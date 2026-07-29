"""TacticConfig.outOfPossession 기반 rating_adjustment 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.predictors.win_predictor.report import OUT_OF_POSSESSION as CAT
from app.predictors.win_predictor.report import bonus, need, penalty
from app.schemas import TacticConfig


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
        reasons = (need("센터백 주력", cb_pace_avg, 11.1), need("민첩성", cb_agil_avg, 11.1))
        if cb_pace_avg <= 11 or cb_agil_avg <= 11:
            penalty(context, CAT, "높은 수비 라인과 강한 압박을 버틸 센터백 속도/민첩성이 부족함", *reasons)
            rating_adjustment -= 64.0
        else:
            bonus(context, CAT, "센터백이 빨라 하이라인 뒷공간을 커버함", *reasons)
            rating_adjustment += 10.0

    # 낮은 라인(텐백)은 힘/신장/마킹을 중시
    if dline < 40 and pressing < 40:
        reasons = (
            need("센터백 몸싸움", cb_strength_avg, 12),
            need("신장", cb_height_avg, 182, "cm"),
            need("마킹", cb_mark_avg, 12),
        )
        if cb_strength_avg >= 12 and cb_height_avg >= 182 and cb_mark_avg >= 12:
            bonus(context, CAT, "낮은 블록을 버텨낼 센터백 피지컬을 갖춤", *reasons)
            rating_adjustment += 8.0
        else:
            penalty(context, CAT, "낮은 블록을 유지할 센터백 몸싸움/신장/마킹이 부족함", *reasons)
            rating_adjustment -= 24.0

    # 압박 강도 효과
    if pressing > 75:
        mid_def = [p for p in field_players if any(pos in ("DM", "CM", "CB") for pos in getattr(p, "positions", []))]
        press_tackle = avg(lambda p: attr(p, "tackling"), mid_def)
        press_pos = avg(lambda p: attr(p, "positioning"), mid_def)
        press_pace = avg(lambda p: attr(p, "pace"), mid_def)
        pressing_score = press_tackle + press_pos + press_pace - 30
        reasons = (need("중원/수비 태클+위치선정+주력 합", pressing_score + 30, 30),)
        if pressing_score < 0:
            penalty(context, CAT, "강한 압박을 걸기엔 중원/수비의 태클·위치선정·주력이 부족함", *reasons)
            rating_adjustment += pressing_score * 0.48
        else:
            bonus(context, CAT, "중원/수비가 강한 압박을 감당할 수준임", *reasons)
            rating_adjustment += pressing_score * 0.12

    # 태클 지침
    if tackling_instr == "hard_tackle":
        team_tackle_avg = avg(lambda p: attr(p, "tackling"), field_players)
        team_strength_avg = avg(lambda p: attr(p, "strength"), field_players)
        reasons = (need("팀 태클", team_tackle_avg, 13), need("몸싸움", team_strength_avg, 12))
        if team_tackle_avg >= 13 and team_strength_avg >= 12:
            bonus(context, CAT, "거친 태클 지시를 소화할 수비 강도가 있음", *reasons)
            rating_adjustment += 8.0
        else:
            penalty(context, CAT, "강한 태클 지시를 소화할 전체 태클/몸싸움이 부족함", *reasons)
            rating_adjustment -= 24.0
    else:  # 서서 버티기(stay_on_feet)
        team_pos_avg = avg(lambda p: attr(p, "positioning"), field_players)
        team_mark_avg = avg(lambda p: attr(p, "marking"), field_players)
        stay_score = team_pos_avg + team_mark_avg - 20
        reasons = (need("팀 위치선정+마킹 합", stay_score + 20, 20),)
        if stay_score < 0:
            penalty(context, CAT, "서서 버티기 전술인데 전체 위치선정/마킹이 부족함", *reasons)
            rating_adjustment += stay_score * 0.28
        else:
            bonus(context, CAT, "위치선정과 마킹이 좋아 서서 버티는 수비가 유효함", *reasons)
            rating_adjustment += stay_score * 0.07

    # 오프사이드 트랩
    if offside_trap == "in":
        cb_vision_avg = avg(lambda p: attr(p, "vision"), cbs)
        reasons = (need("센터백 위치선정", cb_pos_avg, 15), need("시야", cb_vision_avg, 15))
        if cb_pos_avg >= 15 and cb_vision_avg >= 15:
            bonus(context, CAT, "센터백 라인이 오프사이드 트랩을 맞출 수 있음", *reasons)
            rating_adjustment += 12.0
        else:
            penalty(context, CAT, "오프사이드 트랩을 운영할 센터백 위치선정/시야가 부족함", *reasons)
            rating_adjustment -= 48.0

    # 수비 형태 & 크로스 허용
    if defensive_shape == "narrow" and allow_crosses:
        reasons = (need("센터백 신장", cb_height_avg, 182, "cm"), need("몸싸움", cb_strength_avg, 12))
        if cb_height_avg >= 182 and cb_strength_avg >= 12:
            bonus(context, CAT, "중앙을 좁히고 크로스를 걷어낼 제공권이 있음", *reasons)
            rating_adjustment += 10.0
        else:
            penalty(context, CAT, "좁은 수비 형태에서 크로스를 허용했을 때 제공권 대응이 약함", *reasons)
            rating_adjustment -= 16.0

    if defensive_shape == "wide" and not allow_crosses:
        # 풀백/CB가 적응돼 있어야 함
        fb_wb = [p for p in field_players if any(pos in ("FB", "WB") for pos in getattr(p, "positions", []))]
        fb_wb_pace = avg(lambda p: attr(p, "pace"), fb_wb)
        fb_wb_mark = avg(lambda p: attr(p, "marking"), fb_wb)
        fb_wb_tackle = avg(lambda p: attr(p, "tackling"), fb_wb)
        reasons = (
            need("측면 수비 주력", fb_wb_pace, 12),
            need("센터백 마킹", cb_mark_avg, 12),
            need("측면 태클", fb_wb_tackle, 11),
        )
        if fb_wb_pace >= 12 and cb_mark_avg >= 12 and fb_wb_tackle >= 11:
            bonus(context, CAT, "측면 수비가 넓게 벌려 크로스를 차단할 수 있음", *reasons, f"측면 마킹 {fb_wb_mark:.1f}")
            rating_adjustment += 8.0
        else:
            penalty(context, CAT, "넓은 수비 형태와 크로스 차단을 소화할 측면 수비 자원이 부족함", *reasons)
            rating_adjustment -= 24.0

    return rating_adjustment
