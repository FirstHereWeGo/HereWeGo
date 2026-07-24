"""구간(하이드레이션 브레이크 사이) 하나에 대한 경기 통계 "증가분"을 생성한다.

match_predictor.simulate와 같은 이유로 세그먼트 단위로만 계산한다 - 이 구간의
tacticConfig만 반영하면 되고, 이전 구간이 어땠는지는 몰라도 된다. 프런트가
구간마다 받은 델타를 팀별로 계속 더해서 누적 통계를 만든다(골 누적과 동일한 패턴).
실측 데이터셋이 없어 win_predictor/xg와 같은 손튜닝 공식 + 랜덤 노이즈로 만든
연출용 지표이며, 실제 스코어(득점/실점)는 이 출력에 포함하지 않는다 — 프런트가
이미 알고 있는 실제 누적 스코어와 불일치할 위험을 없애기 위해서다.

핵심 원칙 — 총량(volume)과 배분/질(mix·quality)의 역할을 분리한다:
  - "총량"(파이널서드 진입 수, 슈팅 수, 압박 시도 수 등)은 team_rating()의 total
    rating 차이(share_a)로만 정한다. 전술-선수 미스매치 페널티는 이미 그 팀의
    total rating을 깎아서 share_a에 반영돼 있으므로, 여기서 총량을 한 번 더
    깎으면 이중 반영이 된다 — 그래서 전력차가 크면 미스매치가 있어도 총량은
    여전히 강팀 쪽으로 쏠린다(그냥 뚫린다).
  - win_predictor가 계산해준 penalty_codes(전술-선수 미스매치 목록)는 그 총량이
    "어디로 배분되는지"(예: 와이드 채널 vs 중앙)와 "얼마나 정확한지"(온 타겟
    비율, 라인 브레이크 성공률 등)만 바꾸는 데 쓴다.
"""
import math

import numpy as np

from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.predictors.win_predictor.team_rating import team_rating
from app.schemas import MatchStatsInput, MatchStatsOutput, MomentumPoint, StatRow, StatSection, TeamMatchInput

SCALE = 400.0  # win_predictor.probability와 동일한 기준

# 팀 스타일(TacticStyle.tacticStyle)에 따른 점유율 가감 - 선수단 적합도(rating)와는
# 별개로 "이 스타일을 선택했다"는 것 자체가 점유 시간에 미치는 영향. 점유 팀은
# 의도적으로 볼을 오래 갖고, 다이렉트/역습 팀은 의도적으로 빨리 전개하거나 내준다.
_POSSESSION_STYLE_SHIFT = {
    "possession": 8,
    "gegenpressing": 3,
    "counter_attack": -5,
    "direct": -8,
}

# 점유 팀은 짧은 패스를 많이 돌리니 패스/받을 패스 수 자체가 늘고, 다이렉트/역습 팀은 패스 수는
# 줄어드는 대신 그 적은 패스로 곧장 파이널서드까지 가려고 하니 진입 수는 오히려 늘어난다.
_PASS_VOLUME_STYLE_MULT = {
    "possession": 1.35,
    "gegenpressing": 1.05,
    "counter_attack": 0.85,
    "direct": 0.7,
}
_FINAL_THIRD_STYLE_MULT = {
    "direct": 1.35,
    "counter_attack": 1.15,
    "gegenpressing": 1.05,
    "possession": 0.95,
}

# buildupStyle/buildFromBack이 후방/중간/전방 존에 얹는 보정 - 팀 레이팅(share_a)과는
# 무관하게 "이 전술을 선택했다" 자체의 절대적 효과다(총량은 이미 pass_pair()에서 share_a로
# 정해졌고, 여기선 그 위에 추가/감산만 함).
_BUILD_FROM_BACK_BONUS = {"rear": 25.0, "mid": 25.0}
_BUILDUP_STYLE_ZONE_BONUS = {
    "short": {"rear": 20.0, "mid": 20.0, "front": 20.0},
    "mixed": {"rear": 10.0, "mid": 20.0, "front": 15.0},
    "direct": {"mid": -20.0, "front": 10.0},
}


def _apply_zone_bonus(count: int, mean: float, k: float) -> int:
    """mean이 양수면 포아송만큼 더하고 음수면 뺀다 - 팀 레이팅과 무관한 절대 보정."""
    if mean == 0:
        return count
    delta = int(np.random.poisson(abs(mean) * k))
    return count + delta if mean > 0 else max(0, count - delta)


def _apply_pass_zone_bonuses(rear: int, mid: int, front: int, in_possession, k: float) -> tuple[int, int, int]:
    style_bonus = _BUILDUP_STYLE_ZONE_BONUS.get(in_possession.buildupStyle, {})
    rear = _apply_zone_bonus(rear, style_bonus.get("rear", 0.0), k)
    mid = _apply_zone_bonus(mid, style_bonus.get("mid", 0.0), k)
    front = _apply_zone_bonus(front, style_bonus.get("front", 0.0), k)
    if in_possession.buildFromBack:
        rear = _apply_zone_bonus(rear, _BUILD_FROM_BACK_BONUS["rear"], k)
        mid = _apply_zone_bonus(mid, _BUILD_FROM_BACK_BONUS["mid"], k)
    return rear, mid, front


def _rating_with_penalties(team: TeamMatchInput) -> tuple[float, list[str]]:
    """win_predictor.win_predictor.predict_win_probability와 동일한 패턴으로
    team_rating() 계산 중 기록된 전술-선수 미스매치 코드를 함께 꺼낸다."""
    setattr(TeamContext, "_last_penalty_codes", [])
    details = team_rating(team)
    penalties = list(getattr(TeamContext, "_last_penalty_codes", []))
    return details["total"], penalties


def _strength(rating_a: float, rating_b: float) -> float:
    return math.tanh((rating_a - rating_b) / SCALE)  # -1..1


def _team_share(team_a: TeamMatchInput, team_b: TeamMatchInput, strength: float, momentum_avg: float = 0.0) -> float:
    ip_a, ip_b = team_a.tacticConfig.inPossession, team_b.tacticConfig.inPossession
    tempo_edge = (ip_a.tempo - ip_b.tempo) / 400
    width_edge = (ip_a.attackingWidth - ip_b.attackingWidth) / 400
    # momentum_avg: 이 구간 모멘텀(분당 랜덤워크)의 평균 - strength를 중심으로 흔들리는 값이라
    # 완전히 새로운 정보는 아니지만, "이번 구간엔 유독 흐름이 한쪽으로 쏠렸다"는 걸 총량에도
    # 살짝 반영해 모멘텀 그래프와 스탯이 서로 어긋나 보이지 않게 한다.
    share_a = 0.5 + 0.28 * strength + 0.05 * tempo_edge + 0.05 * width_edge + 0.05 * momentum_avg
    return max(0.12, min(0.88, share_a))


def _count_pair(mean_total: float, share_a: float, k: float) -> tuple[int, int]:
    mean_total = max(mean_total, 0.0) * k
    a = int(np.random.poisson(max(mean_total * share_a, 0.0)))
    b = int(np.random.poisson(max(mean_total * (1 - share_a), 0.0)))
    return a, b


def _styled_pair(mean_total: float, share_a: float, k: float, mult_a: float = 1.0, mult_b: float = 1.0) -> tuple[int, int]:
    """_count_pair와 같지만 각 팀 몫에 팀 스타일 배수를 따로 곱한다(총량 자체를 스타일이 밀어올리는 경우)."""
    mean_a = max(mean_total * share_a * mult_a, 0.0) * k
    mean_b = max(mean_total * (1 - share_a) * mult_b, 0.0) * k
    return int(np.random.poisson(mean_a)), int(np.random.poisson(mean_b))


def _completion_rate(base: float, spread: float, lo: float = 0.5, hi: float = 0.97) -> float:
    return max(lo, min(hi, base + np.random.uniform(-spread, spread)))


def _generate_momentum(strength: float, duration_minutes: int) -> list[MomentumPoint]:
    """이 구간 동안의 분 단위 순간 우세도(-1=팀B 우세 ~ 1=팀A 우세). 이 구간의 다른 모든
    통계(슈팅, 진입 수 등)를 정하는 것과 같은 strength로 평균을 편향시킨 평균회귀
    랜덤워크라, "이 구간엔 어느 팀이 우세했나"의 방향성은 나머지 통계와 어긋나지 않는다.
    분 번호는 이 구간 기준 상대값(1..duration_minutes)이고, 절대 분(하이드레이션 브레이크
    오프셋)으로 바꾸는 건 프런트 몫이다 - 이 구간의 tacticConfig만 반영하면 되는
    match_stats 전체 원칙과 동일하게 여기서도 이전 구간의 값을 몰라도 된다.
    """
    points: list[MomentumPoint] = []
    value = strength * 0.4
    for minute in range(1, max(duration_minutes, 0) + 1):
        value += (strength - value) * 0.12 + np.random.normal(0, 0.22)
        value = max(-1.0, min(1.0, value))
        points.append(MomentumPoint(minute=minute, value=round(value, 3)))
    return points


# 파이널서드 채널 매치업 보정 — 사이드 태그 필드를 새로 추가하는 대신,
# TeamMatchInput.players가 formation.positions와 1:1 순서 대응한다는 기존 규칙(같은
# 라벨이 여러 번 나오면 "먼저 나온 쪽=오른쪽, 나중=왼쪽" - backend/app/data/formations.py 참고)
# 만으로 좌/우를 그때그때 유추한다.
_MISMATCH_SCALE = 150.0
_MISMATCH_CAP = 0.08


def _mismatch_bonus(atk_score: float, def_score: float) -> float:
    """공격 자원 대비 그걸 막는 수비 자원의 점수 차이 -> 채널 가산점.
    차이가 클수록(막는 쪽이 약할수록) 그 채널로 진입이 더 몰린다."""
    return max(-_MISMATCH_CAP, min(_MISMATCH_CAP, (atk_score - def_score) / _MISMATCH_SCALE))


def _side_tags(formation_positions: list[str]) -> list[str]:
    indices_by_label: dict[str, list[int]] = {}
    for i, pos in enumerate(formation_positions):
        indices_by_label.setdefault(pos, []).append(i)

    tags = ["center"] * len(formation_positions)
    for idxs in indices_by_label.values():
        n = len(idxs)
        for rank, i in enumerate(idxs):
            if rank < n - 1 - rank:
                tags[i] = "right"
            elif rank > n - 1 - rank:
                tags[i] = "left"
    return tags


def _find_wide_player(slots, side: str, priority: tuple[str, ...]):
    for label in priority:
        for pos_label, tag, player in slots:
            if tag == side and pos_label == label:
                return player
    return None


def _wide_mismatch_bonus(attacker, defender) -> float:
    """공격 자원(드리블+주력) 대비 그 자리를 막는 수비 자원(태클+마킹) 차이 -> 채널 가산점."""
    if attacker is None or defender is None:
        return 0.0
    atk_score = attr(attacker, "dribbling") + attr(attacker, "pace")
    def_score = attr(defender, "tackling") + attr(defender, "marking")
    return _mismatch_bonus(atk_score, def_score)


def _wide_channel_bonuses(team_a: TeamMatchInput, team_b: TeamMatchInput) -> tuple[float, float, float, float]:
    """(left_bonus_a, right_bonus_a, left_bonus_b, right_bonus_b) - 각자 자기 진영 기준 좌/우
    공격 자원을, 반대쪽 진영의 거울상(마주보는) 수비 자원과 비교한다."""
    slots_a = list(zip(team_a.formation.positions, _side_tags(team_a.formation.positions), team_a.players))
    slots_b = list(zip(team_b.formation.positions, _side_tags(team_b.formation.positions), team_b.players))

    atk_priority = ("WG", "WB", "FB")
    def_priority = ("FB", "WB", "CB")

    right_atk_a = _find_wide_player(slots_a, "right", atk_priority)
    left_atk_a = _find_wide_player(slots_a, "left", atk_priority)
    right_atk_b = _find_wide_player(slots_b, "right", atk_priority)
    left_atk_b = _find_wide_player(slots_b, "left", atk_priority)
    right_def_a = _find_wide_player(slots_a, "right", def_priority)
    left_def_a = _find_wide_player(slots_a, "left", def_priority)
    right_def_b = _find_wide_player(slots_b, "right", def_priority)
    left_def_b = _find_wide_player(slots_b, "left", def_priority)

    # A의 오른쪽 공격은 B의 왼쪽 수비와 마주본다(그 반대도 마찬가지) - 서로 거울상 매치업.
    right_bonus_a = _wide_mismatch_bonus(right_atk_a, left_def_b)
    left_bonus_a = _wide_mismatch_bonus(left_atk_a, right_def_b)
    right_bonus_b = _wide_mismatch_bonus(right_atk_b, left_def_a)
    left_bonus_b = _wide_mismatch_bonus(left_atk_b, right_def_a)
    return left_bonus_a, right_bonus_a, left_bonus_b, right_bonus_b


def _central_players(team: TeamMatchInput, labels: tuple[str, ...]) -> list:
    """포지션 라벨(AM/CM/DM)이 사이드 구분 없이 중앙 채널을 대표하므로, 사이드 태그 없이
    formation.positions == label인 슬롯의 선수를 그대로 모은다."""
    return [p for label, p in zip(team.formation.positions, team.players) if label in labels]


def _central_score(players: list, stat1: str, stat2: str) -> float:
    return avg(lambda p: attr(p, stat1), players) + avg(lambda p: attr(p, stat2), players)


def _center_channel_bonuses(team_a: TeamMatchInput, team_b: TeamMatchInput) -> tuple[float, float]:
    """(center_bonus_a, center_bonus_b) - 우리 AM/CM(패스+시야, 창의성)이 상대 CM/DM(태클+마킹,
    중앙 스크린)보다 얼마나 앞서는지로 중앙 채널 가산점을 정한다."""
    atk_a = _central_players(team_a, ("AM", "CM"))
    atk_b = _central_players(team_b, ("AM", "CM"))
    def_a = _central_players(team_a, ("CM", "DM"))
    def_b = _central_players(team_b, ("CM", "DM"))

    center_bonus_a = _mismatch_bonus(
        _central_score(atk_a, "passing", "vision"), _central_score(def_b, "tackling", "marking"),
    )
    center_bonus_b = _mismatch_bonus(
        _central_score(atk_b, "passing", "vision"), _central_score(def_a, "tackling", "marking"),
    )
    return center_bonus_a, center_bonus_b


def generate_match_stats(payload: MatchStatsInput) -> MatchStatsOutput:
    rating_a, pen_a = _rating_with_penalties(payload.teamA)
    rating_b, pen_b = _rating_with_penalties(payload.teamB)
    strength = _strength(rating_a, rating_b)
    momentum = _generate_momentum(strength, payload.durationMinutes)
    momentum_avg = sum(p.value for p in momentum) / len(momentum) if momentum else 0.0
    share_a = _team_share(payload.teamA, payload.teamB, strength, momentum_avg)
    k = max(payload.durationMinutes, 0) / 90.0

    ip_a, ip_b = payload.teamA.tacticConfig.inPossession, payload.teamB.tacticConfig.inPossession
    op_a, op_b = payload.teamA.tacticConfig.outOfPossession, payload.teamB.tacticConfig.outOfPossession
    oh_a, oh_b = payload.teamA.tacticConfig.opponentHalf, payload.teamB.tacticConfig.opponentHalf
    style_a = payload.teamA.tacticConfig.style.tacticStyle
    style_b = payload.teamB.tacticConfig.style.tacticStyle

    def pair(mean_total: float, bias: float = 0.0) -> tuple[int, int]:
        return _count_pair(mean_total, max(0.05, min(0.95, share_a + bias)), k)

    def pass_pair(mean_total: float) -> tuple[int, int]:
        """점유 스타일이면 패스/받을 패스 수 자체가 늘고, 다이렉트/역습이면 준다."""
        return _styled_pair(
            mean_total, share_a, k,
            _PASS_VOLUME_STYLE_MULT.get(style_a, 1.0), _PASS_VOLUME_STYLE_MULT.get(style_b, 1.0),
        )

    def row(label: str, a, b) -> StatRow:
        return StatRow(label=label, a=a, b=b)

    def ratio_row(label: str, attempts: tuple[int, int], rate_a: float, rate_b: float) -> StatRow:
        return StatRow(label=label, a=round(attempts[0] * rate_a), b=round(attempts[1] * rate_b))

    sections: list[StatSection] = []

    # 공격 — 점유율도 다른 모든 총량과 같은 share_a로 통일(전에는 pressingIntensity만 따로 봄).
    # A% + B% + 경합 상황%이 항상 100이 되도록, 먼저 경합 비율을 떼어내고 나머지를 A/B로 나눈다.
    share_shift_a = (share_a - 0.5) * 0.6
    if oh_a.playCalmly and "OH_PLAY_CALMLY_CREATION_WEAK" in pen_a:
        share_shift_a += 0.04
    if oh_b.playCalmly and "OH_PLAY_CALMLY_CREATION_WEAK" in pen_b:
        share_shift_a -= 0.04
    share_shift_a += _POSSESSION_STYLE_SHIFT.get(style_a, 0) / 100
    share_shift_a -= _POSSESSION_STYLE_SHIFT.get(style_b, 0) / 100
    raw_share_a = max(0.2, min(0.8, 0.5 + share_shift_a))

    contested_pct = round(_completion_rate(0.08, 0.03, lo=0.03, hi=0.15) * 100)
    remaining = 100 - contested_pct
    possession_a = round(remaining * raw_share_a)
    possession_b = remaining - possession_a
    sections.append(StatSection(title="공격", rows=[
        StatRow(label="점유", a=possession_a, b=possession_b),
    ]))

    # 파이널 서드 진입 (5채널) — 총량은 share_a + 팀 스타일(다이렉트/역습일수록 진입 수 자체가 증가).
    # 슈팅은 이 진입 수의 일부가 전환된 것이므로(포함관계) 먼저 뽑아서 슈팅 쪽에서 재사용한다.
    width_a = ip_a.attackingWidth
    width_b = ip_b.attackingWidth
    total_entries = _styled_pair(
        105.0, share_a, k,
        _FINAL_THIRD_STYLE_MULT.get(style_a, 1.0), _FINAL_THIRD_STYLE_MULT.get(style_b, 1.0),
    )

    # 슈팅 — 전체는 파이널서드 진입 수에서 전환율만큼만 나오도록 파생시켜, 슈팅이 진입 수를
    # 절대 넘지 못하게 한다(포함관계 보장). 온타겟/인박스 비율(질)은 전술-선수 적합도로 갈라서
    # 온타겟·인박스+아웃박스가 전체를 넘지 않게(포함관계 보장) 한다.
    def _shot_quality_penalty(oh, penalties: list[str]) -> float:
        if oh.crossingApproach == "high" and "OH_HIGH_CROSS_TARGET_WEAK" in penalties:
            return -0.12
        if oh.crossingApproach == "low" and "OH_LOW_CROSS_FINISHER_WEAK" in penalties:
            return -0.12
        return 0.0

    def _box_share(oh) -> float:
        if oh.crossingApproach == "high":
            return 0.72
        if oh.crossingApproach == "low":
            return 0.62
        return 0.66

    shot_conv_rate_a = _completion_rate(0.20, 0.05, lo=0.10, hi=0.35)
    shot_conv_rate_b = _completion_rate(0.20, 0.05, lo=0.10, hi=0.35)
    shots_total = (round(total_entries[0] * shot_conv_rate_a), round(total_entries[1] * shot_conv_rate_b))
    on_rate_a = _completion_rate(0.44 + _shot_quality_penalty(oh_a, pen_a), 0.05, lo=0.25, hi=0.65)
    on_rate_b = _completion_rate(0.44 + _shot_quality_penalty(oh_b, pen_b), 0.05, lo=0.25, hi=0.65)
    on_target_a = round(shots_total[0] * on_rate_a)
    on_target_b = round(shots_total[1] * on_rate_b)
    in_box_a = round(shots_total[0] * _box_share(oh_a))
    in_box_b = round(shots_total[1] * _box_share(oh_b))
    sections.append(StatSection(title="슈팅", rows=[
        row("온 타겟", on_target_a, on_target_b),
        row("오프 타겟", shots_total[0] - on_target_a, shots_total[1] - on_target_b),
        row("페널티 구역 안쪽", in_box_a, in_box_b),
    ]))

    def channel_split(total: int, width: float, left_bonus: float, right_bonus: float, center_bonus: float, suppress_wide: bool) -> list[int]:
        wide = max(0.0, width - 50) / 50  # 0..1
        if suppress_wide:  # 와이드 전술인데 윙어가 없음(IP_WIDE_ATTACK_NO_WINGERS) - 배분만 중앙으로 이동
            wide *= 0.25
        w_left = 0.16 + wide * 0.12 + left_bonus
        w_right = 0.16 + wide * 0.12 + right_bonus
        # 하프스페이스(왼쪽/오른쪽 중앙)는 완전 와이드도 완전 중앙도 아니라서, 그 옆 와이드
        # 채널과 중앙 채널 각각의 매치업 점수를 절반씩 받는다.
        w_lc = 0.18 + (left_bonus + center_bonus) / 2
        w_rc = 0.18 + (right_bonus + center_bonus) / 2
        center_base = max(0.0, 1 - (2 * 0.16 + 2 * wide * 0.12 + 2 * 0.18))
        w_center = max(0.05, center_base + center_bonus)
        weights = [w_left, w_lc, w_center, w_rc, w_right]
        s = sum(weights)
        weights = [w / s for w in weights]
        return [round(total * w) for w in weights]

    wide_left_a, wide_right_a, wide_left_b, wide_right_b = _wide_channel_bonuses(payload.teamA, payload.teamB)
    center_bonus_a, center_bonus_b = _center_channel_bonuses(payload.teamA, payload.teamB)
    left_a = (0.05 if ip_a.overlapLeft else 0.0) + wide_left_a
    right_a = (0.05 if ip_a.overlapRight else 0.0) + wide_right_a
    left_b = (0.05 if ip_b.overlapLeft else 0.0) + wide_left_b
    right_b = (0.05 if ip_b.overlapRight else 0.0) + wide_right_b
    channels_a = channel_split(total_entries[0], width_a, left_a, right_a, center_bonus_a, "IP_WIDE_ATTACK_NO_WINGERS" in pen_a)
    channels_b = channel_split(total_entries[1], width_b, left_b, right_b, center_bonus_b, "IP_WIDE_ATTACK_NO_WINGERS" in pen_b)
    sections.append(StatSection(title="파이널 서드 진입", rows=[
        row(label, ca, cb)
        for label, ca, cb in zip(
            ["왼쪽 채널", "왼쪽 중앙 채널", "중앙 채널", "오른쪽 중앙 채널", "오른쪽 채널"],
            channels_a, channels_b,
        )
    ]))

    # 경고 (파울은 상대 입장에서 "피파울"이 됨)
    fouls_a, fouls_b = pair(8.0, bias=(-0.1 if op_a.tackling == "hard_tackle" else 0.0) - (-0.1 if op_b.tackling == "hard_tackle" else 0.0))
    # 오프사이드 트랩을 걸었어도 그걸 받쳐줄 CB가 없으면(OOP_OFFSIDE_TRAP_WEAK) 실제로는 잘 안 걸림
    trap_bonus_b = (0.1 if "OOP_OFFSIDE_TRAP_WEAK" not in pen_b else 0.02) if op_b.offsideTrap == "in" else 0.0
    trap_bonus_a = (0.1 if "OOP_OFFSIDE_TRAP_WEAK" not in pen_a else 0.02) if op_a.offsideTrap == "in" else 0.0
    offside_a, offside_b = pair(1.2, bias=trap_bonus_b - trap_bonus_a)
    sections.append(StatSection(title="경고", rows=[
        row("피파울", fouls_b, fouls_a),
        row("오프사이드", offside_a, offside_b),
    ]))

    # 볼 배급 — 패스(시도) 총량은 팀 스타일 반영해서 독립적으로 뽑고, "성공한 패스 수"는
    # 후방/중간/전방을 먼저 정한 뒤 그 합으로 역산한다(존별 실제 받은 패스가 먼저고 총량은
    # 거기서 자연스럽게 나온다는 쪽이 더 직관적이라, 총량 -> 배분이 아니라 배분 -> 총량 순서).
    passes = pass_pair(1200.0)
    crosses = pair(8.0, bias=(0.05 if oh_a.earlyCrosses else 0.0) - (0.05 if oh_b.earlyCrosses else 0.0))
    cross_rate_a = _completion_rate(0.30, 0.06, lo=0.15, hi=0.55)
    cross_rate_b = _completion_rate(0.30, 0.06, lo=0.15, hi=0.55)

    rear_a, rear_b = pass_pair(210.0)
    mid_a, mid_b = pass_pair(360.0)
    front_a, front_b = pass_pair(260.0)
    rear_a, mid_a, front_a = _apply_pass_zone_bonuses(rear_a, mid_a, front_a, ip_a, k)
    rear_b, mid_b, front_b = _apply_pass_zone_bonuses(rear_b, mid_b, front_b, ip_b, k)

    pass_success_a = rear_a + mid_a + front_a
    pass_success_b = rear_b + mid_b + front_b
    # 시도(패스)는 최소 성공한 만큼은 있어야 한다 - 둘이 독립 랜덤이라 짧은 구간일수록
    # 우연히 성공이 시도를 넘어설 수 있어서 clampShotsToGoals(온 타겟 vs 골)와 같은 방식으로 보정.
    passes = (max(passes[0], pass_success_a), max(passes[1], pass_success_b))

    sections.append(StatSection(title="볼 배급", rows=[
        row("패스", *passes),
        row("성공한 패스 수", pass_success_a, pass_success_b),
        row("크로스", *crosses),
        ratio_row("성공한 크로스 수", crosses, cross_rate_a, cross_rate_b),
        row("후방", rear_a, rear_b),
        row("중간", mid_a, mid_b),
        row("전방", front_a, front_b),
    ]))

    # 수비 — 압박 시도(총량)는 pressingIntensity에 직접 비례, 볼탈취 성공률(질)만 압박 적합도로 조정
    press_a = int(np.random.poisson(max(186.0 * (op_a.pressingIntensity / 50) * k, 0.0)))
    press_b = int(np.random.poisson(max(186.0 * (op_b.pressingIntensity / 50) * k, 0.0)))
    recovery_rate_a = _completion_rate(0.11 - (0.03 if "OOP_PRESSING_CORE_WEAK" in pen_a else 0.0), 0.012, lo=0.06, hi=0.15)
    recovery_rate_b = _completion_rate(0.11 - (0.03 if "OOP_PRESSING_CORE_WEAK" in pen_b else 0.0), 0.012, lo=0.06, hi=0.15)
    sections.append(StatSection(title="수비", rows=[
        row("수비가 의도한 볼탈취", round(press_a * recovery_rate_a), round(press_b * recovery_rate_b)),
        row("압박 시도 횟수", press_a, press_b),
    ]))

    return MatchStatsOutput(sections=sections, momentum=momentum)
