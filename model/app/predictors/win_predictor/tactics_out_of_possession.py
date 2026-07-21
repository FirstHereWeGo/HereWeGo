"""TacticConfig.outOfPossession 기반 rating_adjustment 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.schemas import TacticConfig


def _record_penalty(context: TeamContext, code: str) -> None:
    penalties = getattr(context, "penalty_codes", None)
    if penalties is None:
        penalties = []
        setattr(context, "penalty_codes", penalties)
    penalties.append(code)
    setattr(TeamContext, "_last_penalty_codes", list(penalties))


def apply_out_of_possession(tc: TacticConfig, context: TeamContext) -> float:
    rating_adjustment = 0.0
    oop_def = getattr(tc, "outOfPossession", None)
    if not oop_def:
        return rating_adjustment

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
            # 패널티: 높은 수비 라인과 강한 압박을 버틸 센터백 속도/민첩성이 부족함
            _record_penalty(context, "OOP_HIGH_LINE_SLOW_CB")
            rating_adjustment -= 64.0
        else:
            rating_adjustment += 10.0

    # 낮은 라인(텐백)은 힘/신장/마킹을 중시
    if dline < 40 and pressing < 40:
        if cb_strength_avg >= 12 and cb_height_avg >= 182 and cb_mark_avg >= 12:
            rating_adjustment += 8.0
        else:
            # 패널티: 낮은 블록을 유지할 센터백 몸싸움/신장/마킹이 부족함
            _record_penalty(context, "OOP_LOW_BLOCK_WEAK_CB")
            rating_adjustment -= 24.0

    # 압박 강도 효과
    if pressing > 75:
        mid_def = [p for p in field_players if any(pos in ("DM", "CM", "CB") for pos in getattr(p, "positions", []))]
        press_tackle = avg(lambda p: attr(p, "tackling"), mid_def)
        press_pos = avg(lambda p: attr(p, "positioning"), mid_def)
        press_pace = avg(lambda p: attr(p, "pace"), mid_def)
        pressing_score = press_tackle + press_pos + press_pace - 30
        # 패널티: 강한 압박을 걸기엔 중원/수비의 태클·위치선정·주력이 부족함
        if pressing_score < 0:
            _record_penalty(context, "OOP_PRESSING_CORE_WEAK")
            rating_adjustment += pressing_score * 0.48
        else:
            rating_adjustment += pressing_score * 0.12

    # 태클 지침
    if tackling_instr == "hard_tackle":
        team_tackle_avg = avg(lambda p: attr(p, "tackling"), field_players)
        team_strength_avg = avg(lambda p: attr(p, "strength"), field_players)
        if team_tackle_avg >= 13 and team_strength_avg >= 12:
            rating_adjustment += 8.0
        else:
            # 패널티: 강한 태클 지시를 소화할 전체 태클/몸싸움이 부족함
            _record_penalty(context, "OOP_HARD_TACKLE_WEAK")
            rating_adjustment -= 24.0
    else:  # 서서 버티기(stay_on_feet)
        team_pos_avg = avg(lambda p: attr(p, "positioning"), field_players)
        team_mark_avg = avg(lambda p: attr(p, "marking"), field_players)
        stay_score = team_pos_avg + team_mark_avg - 20
        # 패널티: 서서 버티기 전술인데 전체 위치선정/마킹이 부족함
        if stay_score < 0:
            _record_penalty(context, "OOP_STAY_ON_FEET_WEAK")
            rating_adjustment += stay_score * 0.28
        else:
            rating_adjustment += stay_score * 0.07

    # 오프사이드 트랩
    if offside_trap == "in":
        if cb_pos_avg >= 15 and avg(lambda p: attr(p, "vision"), cbs) >= 15:
            rating_adjustment += 12.0
        else:
            # 패널티: 오프사이드 트랩을 운영할 센터백 위치선정/시야가 부족함
            _record_penalty(context, "OOP_OFFSIDE_TRAP_WEAK")
            rating_adjustment -= 48.0

    # 수비 형태 & 크로스 허용
    if defensive_shape == "narrow" and allow_crosses:
        if cb_height_avg >= 182 and cb_strength_avg >= 12:
            rating_adjustment += 10.0
        else:
            # 패널티: 좁은 수비 형태에서 크로스를 허용했을 때 제공권 대응이 약함
            _record_penalty(context, "OOP_NARROW_SHAPE_CROSS_WEAK")
            rating_adjustment -= 16.0

    if defensive_shape == "wide" and not allow_crosses:
        # 풀백/CB가 적응돼 있어야 함
        fb_wb = [p for p in field_players if any(pos in ("FB", "WB") for pos in getattr(p, "positions", []))]
        fb_wb_pace = avg(lambda p: attr(p, "pace"), fb_wb)
        fb_wb_mark = avg(lambda p: attr(p, "marking"), fb_wb)
        if fb_wb_pace >= 12 and cb_mark_avg >= 12 and avg(lambda p: attr(p, "tackling"), fb_wb) >= 11:
            rating_adjustment += 8.0
        else:
            # 패널티: 넓은 수비 형태와 크로스 차단을 소화할 측면 수비 자원이 부족함
            _record_penalty(context, "OOP_WIDE_SHAPE_CROSS_STOP_WEAK")
            rating_adjustment -= 24.0

    return rating_adjustment
