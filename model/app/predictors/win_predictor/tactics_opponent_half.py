"""TacticConfig.opponentHalf 기반 rating_adjustment 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.predictors.win_predictor.report import OPPONENT_HALF as CAT
from app.predictors.win_predictor.report import bonus, need, penalty
from app.schemas import TacticConfig


def apply_opponent_half(tc: TacticConfig, context: TeamContext) -> float:
    rating_adjustment = 0.0
    oop = getattr(tc, "opponentHalf", None)
    if not oop:
        return rating_adjustment

    field_players = context.field_players
    attackers = context.attackers
    wingers = context.wingers

    crossing = getattr(oop, "crossingApproach", "mixed")
    early_crosses = getattr(oop, "earlyCrosses", False)
    dribble_more = getattr(oop, "dribbleMore", False)
    play_calmly = getattr(oop, "playCalmly", False)
    play_for_freedom = getattr(oop, "playForFreedom", False)

    # 하이 크로싱 -> 키 크고 강한 ST에게 유리
    if crossing == "high":
        st_players = [p for p in attackers if "ST" in getattr(p, "positions", [])]
        st_height_avg = sum(getattr(p, "height", 0) for p in st_players) / (len(st_players) or 1)
        st_strength_avg = avg(lambda p: attr(p, "strength"), st_players)
        reasons = (need("스트라이커 신장", st_height_avg, 185, "cm"), need("몸싸움", st_strength_avg, 12))
        if st_height_avg >= 185 and st_strength_avg >= 12:
            bonus(context, CAT, "높은 크로스를 받아낼 타깃 스트라이커가 있음", *reasons)
            rating_adjustment += 12.0
        else:
            penalty(context, CAT, "공중 경합을 받을 타깃 스트라이커의 신장/몸싸움이 부족함", *reasons)
            rating_adjustment -= 16.0

    # 로우 크로싱 -> 주력/민첩성/위치선정/골결정력
    if crossing == "low":
        st_players = [p for p in attackers if "ST" in getattr(p, "positions", [])]
        st_pace_avg = avg(lambda p: attr(p, "pace"), st_players)
        st_agility_avg = avg(lambda p: attr(p, "agility"), st_players)
        st_pos_avg = avg(lambda p: attr(p, "positioning"), st_players)
        st_fin_avg = avg(lambda p: attr(p, "finishing"), st_players)
        low_cross_score = st_pace_avg + st_agility_avg + st_pos_avg + st_fin_avg - 40
        reasons = (
            need("스트라이커 주력+민첩성+위치선정+결정력 합", low_cross_score + 40, 40),
        )
        if low_cross_score < 0:
            penalty(context, CAT, "로우 크로스에 필요한 침투/결정력이 부족함", *reasons)
            rating_adjustment += low_cross_score * 0.48
        else:
            bonus(context, CAT, "낮은 크로스에 뛰어들 침투와 결정력이 충분함", *reasons)
            rating_adjustment += low_cross_score * 0.12

    # 얼리 크로스
    if early_crosses:
        wing_pass_avg = avg(lambda p: attr(p, "passing"), wingers)
        wing_vision_avg = avg(lambda p: attr(p, "vision"), wingers)
        st_pos_avg = avg(lambda p: attr(p, "positioning"), attackers)
        st_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        reasons = (
            need("측면 패스", wing_pass_avg, 11),
            need("시야", wing_vision_avg, 11),
            need("공격진 위치선정", st_pos_avg, 11),
        )
        if wing_pass_avg >= 11 and wing_vision_avg >= 11 and st_pos_avg >= 11:
            bonus(context, CAT, "측면 전개와 박스 침투 타이밍이 얼리 크로스와 맞음", *reasons)
            rating_adjustment += 1.8 + (st_pace_avg - 10) * 0.05
        else:
            penalty(context, CAT, "얼리 크로스를 넣을 측면 전개와 박스 침투 타이밍이 부족함", *reasons)
            rating_adjustment -= 16.0

    # 드리블 위주 플레이
    if dribble_more:
        atk_drib_avg = avg(lambda p: attr(p, "dribbling"), attackers)
        atk_agil_avg = avg(lambda p: attr(p, "agility"), attackers)
        reasons = (need("공격진 드리블", atk_drib_avg, 15), need("민첩성", atk_agil_avg, 15))
        if atk_drib_avg >= 15 and atk_agil_avg >= 15:
            bonus(context, CAT, "개인 돌파로 수비를 벗겨낼 공격진을 보유함", *reasons)
            rating_adjustment += 12.0
        else:
            penalty(context, CAT, "드리블 전개를 맡기기엔 공격진의 드리블/민첩성이 부족함", *reasons)
            rating_adjustment -= 28.0

    # 침착한 플레이
    if play_calmly:
        atk_vision_avg = avg(lambda p: attr(p, "vision"), attackers)
        atk_passing_avg = avg(lambda p: attr(p, "passing"), attackers)
        atk_pos_avg = avg(lambda p: attr(p, "positioning"), attackers)
        reasons = (
            need("공격진 시야", atk_vision_avg, 13),
            need("패스", atk_passing_avg, 13),
            need("위치선정", atk_pos_avg, 13),
        )
        if atk_vision_avg >= 13 and atk_passing_avg >= 13 and atk_pos_avg >= 13:
            bonus(context, CAT, "최종 3분의 1에서 서두르지 않고 기회를 고를 수 있음", *reasons)
            rating_adjustment += 10.0
        else:
            # 점유율은 늘지만 결정력은 낮음 -> rating_adjustment을 낮춰 무승부 경향을 높임
            penalty(context, CAT, "침착한 전개에 필요한 시야/패스/위치선정이 부족함", *reasons)
            rating_adjustment -= 16.0

    # 자유로운 플레이
    if play_for_freedom:
        team_vision_avg = avg(lambda p: attr(p, "vision"), field_players)
        team_pos_avg = avg(lambda p: attr(p, "positioning"), field_players)
        reasons = (need("팀 시야", team_vision_avg, 15), need("위치선정", team_pos_avg, 15))
        if team_vision_avg >= 15 and team_pos_avg >= 15:
            bonus(context, CAT, "선수 재량을 풀어줘도 판단이 흔들리지 않는 스쿼드", *reasons)
            rating_adjustment *= 1.12
        else:
            penalty(context, CAT, "자유로운 전술을 받쳐줄 전체 시야/위치선정 수준이 부족함", *reasons)
            rating_adjustment -= 56.0

    return rating_adjustment
