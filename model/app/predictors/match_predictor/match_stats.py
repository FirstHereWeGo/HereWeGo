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

from app.predictors.win_predictor.context import TeamContext
from app.predictors.win_predictor.team_rating import team_rating
from app.schemas import MatchStatsInput, MatchStatsOutput, StatRow, StatSection, TeamMatchInput

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


def _rating_with_penalties(team: TeamMatchInput) -> tuple[float, list[str]]:
    """win_predictor.win_predictor.predict_win_probability와 동일한 패턴으로
    team_rating() 계산 중 기록된 전술-선수 미스매치 코드를 함께 꺼낸다."""
    setattr(TeamContext, "_last_penalty_codes", [])
    details = team_rating(team)
    penalties = list(getattr(TeamContext, "_last_penalty_codes", []))
    return details["total"], penalties


def _strength(rating_a: float, rating_b: float) -> float:
    return math.tanh((rating_a - rating_b) / SCALE)  # -1..1


def _team_share(team_a: TeamMatchInput, team_b: TeamMatchInput, strength: float) -> float:
    ip_a, ip_b = team_a.tacticConfig.inPossession, team_b.tacticConfig.inPossession
    tempo_edge = (ip_a.tempo - ip_b.tempo) / 400
    width_edge = (ip_a.attackingWidth - ip_b.attackingWidth) / 400
    share_a = 0.5 + 0.28 * strength + 0.05 * tempo_edge + 0.05 * width_edge
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


def generate_match_stats(payload: MatchStatsInput) -> MatchStatsOutput:
    rating_a, pen_a = _rating_with_penalties(payload.teamA)
    rating_b, pen_b = _rating_with_penalties(payload.teamB)
    strength = _strength(rating_a, rating_b)
    share_a = _team_share(payload.teamA, payload.teamB, strength)
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
    assists = pair(1.1)
    sections.append(StatSection(title="공격", rows=[
        StatRow(label="점유", a=possession_a, b=possession_b),
        row("도움", *assists),
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
        row("페널티 구역 바깥쪽", shots_total[0] - in_box_a, shots_total[1] - in_box_b),
    ]))

    def channel_split(total: int, width: float, left_bonus: float, right_bonus: float, suppress_wide: bool) -> list[int]:
        wide = max(0.0, width - 50) / 50  # 0..1
        if suppress_wide:  # 와이드 전술인데 윙어가 없음(IP_WIDE_ATTACK_NO_WINGERS) - 배분만 중앙으로 이동
            wide *= 0.25
        w_left = 0.16 + wide * 0.12 + left_bonus
        w_right = 0.16 + wide * 0.12 + right_bonus
        w_lc = 0.18
        w_rc = 0.18
        w_center = max(0.05, 1 - (w_left + w_right + w_lc + w_rc))
        weights = [w_left, w_lc, w_center, w_rc, w_right]
        s = sum(weights)
        weights = [w / s for w in weights]
        return [round(total * w) for w in weights]

    left_a = 0.05 if ip_a.overlapLeft else 0.0
    right_a = 0.05 if ip_a.overlapRight else 0.0
    left_b = 0.05 if ip_b.overlapLeft else 0.0
    right_b = 0.05 if ip_b.overlapRight else 0.0
    channels_a = channel_split(total_entries[0], width_a, left_a, right_a, "IP_WIDE_ATTACK_NO_WINGERS" in pen_a)
    channels_b = channel_split(total_entries[1], width_b, left_b, right_b, "IP_WIDE_ATTACK_NO_WINGERS" in pen_b)
    sections.append(StatSection(title="파이널 서드 진입", rows=[
        row(label, ca, cb)
        for label, ca, cb in zip(
            ["왼쪽 채널", "왼쪽 중앙 채널", "중앙 채널", "오른쪽 중앙 채널", "오른쪽 채널"],
            channels_a, channels_b,
        )
    ]))

    # 받을 패스 수 — 총량은 share_a + 팀 스타일(점유일수록 증가, 다이렉트/역습일수록 감소)
    sections.append(StatSection(title="받을 패스 수", rows=[
        row("후방", *pass_pair(240.0)),
        row("중간", *pass_pair(390.0)),
        row("전방", *pass_pair(290.0)),
    ]))
    sections.append(StatSection(title="빌드업 루트", rows=[
        row("상대 미드필드와 수비라인 사이에서 패스받은 횟수", *pass_pair(225.0)),
        row("상대 수비 뒷공간에서 패스받은 횟수", *pass_pair(24.0)),
    ]))

    # 라인 브레이크 — 시도는 share_a, 성공률(질)만 자기 팀 빌드업 적합도 + 상대 수비라인 적합도로 조정
    lb_attempt = pair(470.0)
    lb_rate_a = _completion_rate(
        0.68 + 0.1 * strength
        - (0.15 if "IP_SHORT_BUILDUP_MIDFIELD_WEAK" in pen_a else 0.0)
        + (0.10 if "OOP_HIGH_LINE_SLOW_CB" in pen_b else 0.0),
        0.06, lo=0.3, hi=0.9,
    )
    lb_rate_b = _completion_rate(
        0.68 - 0.1 * strength
        - (0.15 if "IP_SHORT_BUILDUP_MIDFIELD_WEAK" in pen_b else 0.0)
        + (0.10 if "OOP_HIGH_LINE_SLOW_CB" in pen_a else 0.0),
        0.06, lo=0.3, hi=0.9,
    )
    dlb_attempt = pair(47.0)
    dlb_rate_a = _completion_rate(0.55, 0.08)
    dlb_rate_b = _completion_rate(0.55, 0.08)
    sections.append(StatSection(title="라인 브레이크", rows=[
        row("라인 브레이크 시도", *lb_attempt),
        ratio_row("라인 브레이크 성공", lb_attempt, lb_rate_a, lb_rate_b),
        row("수비 라인 브레이크 시도", *dlb_attempt),
        ratio_row("수비 라인 브레이크 성공", dlb_attempt, dlb_rate_a, dlb_rate_b),
    ]))

    # 경고 (파울은 상대 입장에서 "피파울"이 됨)
    fouls_a, fouls_b = pair(8.0, bias=(-0.1 if op_a.tackling == "hard_tackle" else 0.0) - (-0.1 if op_b.tackling == "hard_tackle" else 0.0))
    yellow_a = int(np.random.poisson(fouls_a * 0.14 * (1.6 if op_a.tackling == "hard_tackle" else 1.0)))
    yellow_b = int(np.random.poisson(fouls_b * 0.14 * (1.6 if op_b.tackling == "hard_tackle" else 1.0)))
    red_a = 1 if np.random.random() < 0.01 * k and op_a.tackling == "hard_tackle" else 0
    red_b = 1 if np.random.random() < 0.01 * k and op_b.tackling == "hard_tackle" else 0
    # 오프사이드 트랩을 걸었어도 그걸 받쳐줄 CB가 없으면(OOP_OFFSIDE_TRAP_WEAK) 실제로는 잘 안 걸림
    trap_bonus_b = (0.1 if "OOP_OFFSIDE_TRAP_WEAK" not in pen_b else 0.02) if op_b.offsideTrap == "in" else 0.0
    trap_bonus_a = (0.1 if "OOP_OFFSIDE_TRAP_WEAK" not in pen_a else 0.02) if op_a.offsideTrap == "in" else 0.0
    offside_a, offside_b = pair(1.2, bias=trap_bonus_b - trap_bonus_a)
    sections.append(StatSection(title="경고", rows=[
        row("옐로우 카드", yellow_a, yellow_b),
        row("레드 카드", red_a, red_b),
        row("피파울", fouls_b, fouls_a),
        row("오프사이드", offside_a, offside_b),
    ]))

    # 볼 배급 — 패스 총량도 팀 스타일 반영(받을 패스 수와 같은 성격의 지표)
    passes = pass_pair(1350.0)
    pass_rate_a = _completion_rate(0.82 + 0.05 * strength, 0.04)
    pass_rate_b = _completion_rate(0.82 - 0.05 * strength, 0.04)
    crosses = pair(8.0, bias=(0.05 if oh_a.earlyCrosses else 0.0) - (0.05 if oh_b.earlyCrosses else 0.0))
    cross_rate_a = _completion_rate(0.30, 0.06, lo=0.15, hi=0.55)
    cross_rate_b = _completion_rate(0.30, 0.06, lo=0.15, hi=0.55)
    sections.append(StatSection(title="볼 배급", rows=[
        row("패스", *passes),
        ratio_row("성공한 패스 수", passes, pass_rate_a, pass_rate_b),
        row("크로스", *crosses),
        ratio_row("성공한 크로스 수", crosses, cross_rate_a, cross_rate_b),
        row("플레이 위치 변경 성공 횟수", *pair(4.0)),
    ]))

    # 세트피스 — 프리킥은 "피파울"과 같은 사건이라 재사용, 코너킥은 크로스 물량에서 파생시킨다
    # (페널티킥 득점은 오픈플레이 시뮬레이션 대상이 아니라 항상 0)
    corners_a = int(np.random.poisson(max(crosses[0] * 0.35, 0.0)))
    corners_b = int(np.random.poisson(max(crosses[1] * 0.35, 0.0)))
    sections.append(StatSection(title="세트피스", rows=[
        row("코너킥", corners_a, corners_b),
        row("프리킥", fouls_b, fouls_a),
        row("페널티킥 득점", 0, 0),
    ]))

    # 수비 — 압박 시도(총량)는 pressingIntensity에 직접 비례, 볼탈취 성공률(질)만 압박 적합도로 조정
    # (자책골은 이 시뮬레이션에서 다루지 않아 항상 0)
    press_a = int(np.random.poisson(max(372.0 * (op_a.pressingIntensity / 50) * k, 0.0)))
    press_b = int(np.random.poisson(max(372.0 * (op_b.pressingIntensity / 50) * k, 0.0)))
    recovery_rate_a = _completion_rate(0.55 - (0.15 if "OOP_PRESSING_CORE_WEAK" in pen_a else 0.0), 0.06, lo=0.3, hi=0.75)
    recovery_rate_b = _completion_rate(0.55 - (0.15 if "OOP_PRESSING_CORE_WEAK" in pen_b else 0.0), 0.06, lo=0.3, hi=0.75)
    sections.append(StatSection(title="수비", rows=[
        row("자책골", 0, 0),
        row("수비가 의도한 볼탈취", round(press_a * recovery_rate_a), round(press_b * recovery_rate_b)),
        row("압박 시도 횟수", press_a, press_b),
    ]))

    return MatchStatsOutput(sections=sections)
