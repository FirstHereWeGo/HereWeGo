"""TacticConfig.outOfPossession 기반 rating 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.schemas import TacticConfig


def apply_out_of_possession(rating: float, tc: TacticConfig, context: TeamContext) -> float:
    oop_def = getattr(tc, "outOfPossession", None)
    if not oop_def:
        return rating

    field_players = context.field_players
    cbs = context.cbs

    pressing = getattr(oop_def, "pressingIntensity", 50)
    dline = getattr(oop_def, "defensiveLineHeight", 50)
    tackling_instr = getattr(oop_def, "tackling", "stay_on_feet")
    offside_trap = getattr(oop_def, "offsideTrap", "none")
    defensive_shape = getattr(oop_def, "defensiveShape", "normal")
    allow_crosses = getattr(oop_def, "allowCrosses", True)

    cb_pace_avg = avg(lambda p: attr(p, "pace"), cbs)
    cb_agil_avg = avg(lambda p: attr(p, "agility"), cbs)
    cb_strength_avg = avg(lambda p: attr(p, "strength"), cbs)
    cb_mark_avg = avg(lambda p: attr(p, "marking"), cbs)
    cb_pos_avg = avg(lambda p: attr(p, "positioning"), cbs)
    cb_height_avg = avg(lambda p: getattr(p, "height", 0), cbs)

    # 높은 라인 & 강한 압박은 빠른 CB가 필요
    if dline > 70 and pressing > 70:
        if cb_pace_avg <= 11 or cb_agil_avg <= 11:
            rating -= 8.0
        else:
            rating += 2.5

    # 낮은 라인(텐백)은 힘/신장/마킹을 중시
    if dline < 40 and pressing < 40:
        if cb_strength_avg >= 12 and cb_height_avg >= 182 and cb_mark_avg >= 12:
            rating += 2.0
        else:
            rating -= 3.0

    # 압박 강도 효과
    if pressing > 75:
        mid_def = [p for p in field_players if any(pos in ("DM", "CM", "CB") for pos in getattr(p, "positions", []))]
        press_tackle = avg(lambda p: attr(p, "tackling"), mid_def)
        press_pos = avg(lambda p: attr(p, "positioning"), mid_def)
        press_pace = avg(lambda p: attr(p, "pace"), mid_def)
        rating += (press_tackle + press_pos + press_pace - 30) * 0.08

    # 태클 지침
    if tackling_instr == "hard_tackle":
        team_tackle_avg = avg(lambda p: attr(p, "tackling"), field_players)
        team_strength_avg = avg(lambda p: attr(p, "strength"), field_players)
        if team_tackle_avg >= 13 and team_strength_avg >= 12:
            rating += 2.0
        else:
            rating -= 3.0
    else:  # 서서 버티기(stay_on_feet)
        team_pos_avg = avg(lambda p: attr(p, "positioning"), field_players)
        team_mark_avg = avg(lambda p: attr(p, "marking"), field_players)
        rating += (team_pos_avg + team_mark_avg - 20) * 0.07

    # 오프사이드 트랩
    if offside_trap == "in":
        if cb_pos_avg >= 15 and avg(lambda p: attr(p, "vision"), cbs) >= 15:
            rating += 3.0
        else:
            rating -= 6.0

    # 수비 형태 & 크로스 허용
    if defensive_shape == "narrow" and allow_crosses:
        if cb_height_avg >= 182 and cb_strength_avg >= 12:
            rating += 2.5
        else:
            rating -= 2.0

    if defensive_shape == "wide" and not allow_crosses:
        # 풀백/CB가 적응돼 있어야 함
        fb_wb = [p for p in field_players if any(pos in ("FB", "WB") for pos in getattr(p, "positions", []))]
        fb_wb_pace = avg(lambda p: attr(p, "pace"), fb_wb)
        fb_wb_mark = avg(lambda p: attr(p, "marking"), fb_wb)
        if fb_wb_pace >= 12 and cb_mark_avg >= 12 and avg(lambda p: attr(p, "tackling"), fb_wb) >= 11:
            rating += 2.0
        else:
            rating -= 3.0

    return rating
