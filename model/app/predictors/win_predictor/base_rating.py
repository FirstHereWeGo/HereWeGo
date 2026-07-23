"""전술 조정 이전 기본 rating: 선수 능력치 합산 + GK + 포지션 미스매치 + 연령/신장 페널티."""
from app.predictors.win_predictor.context import ATTR_SCALE, TeamContext, gk_overall
from app.predictors.win_predictor.weights import WEIGHTS
from app.schemas import TeamMatchInput


POSITION_GROUPS = {
    "CB": "defense",
    "FB": "defense",
    "WB": "defense",
    "DM": "midfield",
    "CM": "midfield",
    "AM": "midfield",
    "WG": "attack",
    "ST": "attack",
}

POSITION_COMPATIBILITY = {
    "CB": {"same_family": {"FB", "WB"}, "adjacent_line": {"DM"}},
    "FB": {"same_family": {"CB", "WB"}, "adjacent_line": {"DM", "WG"}},
    "WB": {"same_family": {"CB", "FB"}, "adjacent_line": {"DM", "WG"}},
    "DM": {"same_family": {"CM", "AM"}, "adjacent_line": {"CB", "FB", "WB"}},
    "CM": {"same_family": {"DM", "AM"}, "adjacent_line": {"CB", "FB", "WB", "WG"}},
    "AM": {"same_family": {"CM", "WG"}, "adjacent_line": {"DM", "ST"}},
    "WG": {"same_family": {"AM", "ST"}, "adjacent_line": {"FB", "WB", "CM"}},
    "ST": {"same_family": {"WG", "AM"}, "adjacent_line": {"CM", "DM"}},
}


def _record_penalty(context: TeamContext, code: str) -> None:
    penalties = getattr(context, "penalty_codes", None)
    if penalties is None:
        penalties = []
        setattr(context, "penalty_codes", penalties)
    penalties.append(code)
    setattr(TeamContext, "_last_penalty_codes", list(penalties))


def _position_mismatch_penalty(slot_pos: str, player_positions: list[str]) -> float:
    """포지션 미스매치를 3단계로 나눠 반영한다."""
    if slot_pos in player_positions:
        return 0.0
    return 96.0


def compute_base_rating(team_input: TeamMatchInput, context: TeamContext) -> float:
    core_w = WEIGHTS.get("core_w", 1.5)
    finishing_attack_w = WEIGHTS.get("finishing_attack_w", 1.4)
    passing_mid_w = WEIGHTS.get("passing_mid_w", 1.4)
    tackling_def_w = WEIGHTS.get("tackling_def_w", 1.4)
    dribbling_w = WEIGHTS.get("dribbling_w", 0.7)
    passing_w = WEIGHTS.get("passing_w", 0.9)
    vision_w = WEIGHTS.get("vision_w", 0.9)
    tackling_w = WEIGHTS.get("tackling_w", 0.8)
    marking_w = WEIGHTS.get("marking_w", 0.8)
    gk_w = WEIGHTS.get("gk_w", 2.0)
    foot_w = WEIGHTS.get("foot_w", 0.08)  # 발(왼발/오른발) 능력치 1개당 가중치 (1..5)

    rating = 0.0

    for pl in context.field_players:
        attrs = pl.attributes
        # 주 포지션 기준으로 수비/공격 가산치 적용
        positions = getattr(pl, "positions", [])
        pos_primary = positions[0] if positions else None
        # 핵심 스탯 합산 (ATTR_SCALE로 나눠 1~20 캘리브레이션 기준으로 되돌림)
        pace = getattr(attrs, "pace", 0) / ATTR_SCALE
        agility = getattr(attrs, "agility", 0) / ATTR_SCALE
        strength = getattr(attrs, "strength", 0) / ATTR_SCALE
        positioning = getattr(attrs, "positioning", 0) / ATTR_SCALE

        base = (pace + agility + strength + positioning) * core_w

        # 그 외 스탯
        finishing = getattr(attrs, "finishing", 0) / ATTR_SCALE
        dribbling = getattr(attrs, "dribbling", 0) / ATTR_SCALE
        passing = getattr(attrs, "passing", 0) / ATTR_SCALE
        vision = getattr(attrs, "vision", 0) / ATTR_SCALE
        tackling = getattr(attrs, "tackling", 0) / ATTR_SCALE
        marking = getattr(attrs, "marking", 0) / ATTR_SCALE

        other = (
            dribbling * dribbling_w
            + passing * passing_w
            + vision * vision_w
            + tackling * tackling_w
            + marking * marking_w
        )

        # 포지션별 특화 가산 (지침의 제약 준수)
        if pos_primary in ("WG", "ST"):
            finish_w = min(finishing_attack_w, core_w)
            other += finishing * finish_w
        if pos_primary in ("DM", "CM", "AM"):
            pass_w = min(passing_mid_w, core_w)
            other += (passing + vision) * pass_w
        if pos_primary in ("CB", "FB", "WB"):
            def_w = min(tackling_def_w, core_w)
            other += (tackling + marking) * def_w

        # 양발 능력치
        lf = getattr(pl, "leftFoot", 0)
        rf = getattr(pl, "rightFoot", 0)
        foot_bonus = (lf + rf) * foot_w

        player_score = base + other + foot_bonus
        rating += player_score

    # 골키퍼
    if context.gk is not None:
        rating += gk_overall(context.gk) * gk_w

    # 포메이션-포지션 미스매치 페널티
    try:
        formation_positions = team_input.formation.positions
        for i, pos in enumerate(formation_positions):
            if i < len(team_input.players):
                p = team_input.players[i]
                penalty = _position_mismatch_penalty(pos, list(getattr(p, "positions", [])))
                if penalty > 0:
                    rating -= penalty
                    _record_penalty(context, "선수의 주 포지션이 아니어서 제 기량을 발휘하기 어려움")
    except Exception:
        pass

    # 연령 기반 페널티 (전원 30세 이상 OR 전원 29세 이하) — 양쪽 극단 모두 감소
    ages = [getattr(p, "age", 0) for p in context.players]
    if ages:
        if all(a >= 30 for a in ages):
            rating *= 0.97
        if all(a <= 29 for a in ages):
            rating *= 0.98

    # 신장 페널티: 팀 평균 신장 <= 181 -> 소폭 감소
    heights = [getattr(p, "height", 0) for p in context.players]
    if heights:
        avg_h = sum(heights) / len(heights)
        if avg_h <= 181:
            rating *= 0.985

    return rating
