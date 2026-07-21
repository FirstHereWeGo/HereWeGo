"""TacticConfig.opponentHalf 기반 rating 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.schemas import TacticConfig


def _record_penalty(context: TeamContext, code: str) -> None:
    penalties = getattr(context, "penalty_codes", None)
    if penalties is None:
        penalties = []
        setattr(context, "penalty_codes", penalties)
    penalties.append(code)
    setattr(TeamContext, "_last_penalty_codes", list(penalties))


def apply_opponent_half(rating: float, tc: TacticConfig, context: TeamContext) -> float:
    oop = getattr(tc, "opponentHalf", None)
    if not oop:
        return rating

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
        if st_height_avg >= 185 and st_strength_avg >= 12:
            rating += 3.0
        else:
            # 패널티: 공중 경합을 받을 타깃 스트라이커의 신장/몸싸움이 부족함
            _record_penalty(context, "OH_HIGH_CROSS_TARGET_WEAK")
            rating -= 16.0

    # 로우 크로싱 -> 주력/민첩성/위치선정/골결정력
    if crossing == "low":
        st_players = [p for p in attackers if "ST" in getattr(p, "positions", [])]
        st_pace_avg = avg(lambda p: attr(p, "pace"), st_players)
        st_agility_avg = avg(lambda p: attr(p, "agility"), st_players)
        st_pos_avg = avg(lambda p: attr(p, "positioning"), st_players)
        st_fin_avg = avg(lambda p: attr(p, "finishing"), st_players)
        low_cross_score = st_pace_avg + st_agility_avg + st_pos_avg + st_fin_avg - 40
        if low_cross_score < 0:
            # 패널티: 로우 크로스에 필요한 침투/결정력이 부족함
            _record_penalty(context, "OH_LOW_CROSS_FINISHER_WEAK")
            rating += low_cross_score * 0.48
        else:
            rating += low_cross_score * 0.12

    # 얼리 크로스
    if early_crosses:
        wing_pass_avg = avg(lambda p: attr(p, "passing"), wingers)
        wing_vision_avg = avg(lambda p: attr(p, "vision"), wingers)
        st_pos_avg = avg(lambda p: attr(p, "positioning"), attackers)
        st_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        if wing_pass_avg >= 11 and wing_vision_avg >= 11 and st_pos_avg >= 11:
            rating += 1.8 + (st_pace_avg - 10) * 0.05
        else:
            # 패널티: 얼리 크로스를 넣을 측면 전개와 박스 침투 타이밍이 부족함
            _record_penalty(context, "OH_EARLY_CROSS_SUPPORT_WEAK")
            rating -= 16.0

    # 드리블 위주 플레이
    if dribble_more:
        atk_drib_avg = avg(lambda p: attr(p, "dribbling"), attackers)
        atk_agil_avg = avg(lambda p: attr(p, "agility"), attackers)
        if atk_drib_avg >= 15 and atk_agil_avg >= 15:
            rating += 3.0
        else:
            # 패널티: 드리블 전개를 맡기기엔 공격진의 드리블/민첩성이 부족함
            _record_penalty(context, "OH_DRIBBLE_MORE_WEAK")
            rating -= 28.0

    # 침착한 플레이
    if play_calmly:
        atk_vision_avg = avg(lambda p: attr(p, "vision"), attackers)
        atk_passing_avg = avg(lambda p: attr(p, "passing"), attackers)
        atk_pos_avg = avg(lambda p: attr(p, "positioning"), attackers)
        if atk_vision_avg >= 13 and atk_passing_avg >= 13 and atk_pos_avg >= 13:
            rating += 2.5
        else:
            # 점유율은 늘지만 결정력은 낮음 -> rating을 낮춰 무승부 경향을 높임
            # 패널티: 침착한 전개에 필요한 시야/패스/위치선정이 부족함
            _record_penalty(context, "OH_PLAY_CALMLY_CREATION_WEAK")
            rating -= 16.0

    # 자유로운 플레이
    if play_for_freedom:
        team_vision_avg = avg(lambda p: attr(p, "vision"), field_players)
        team_pos_avg = avg(lambda p: attr(p, "positioning"), field_players)
        if team_vision_avg >= 15 and team_pos_avg >= 15:
            rating *= 1.12
        else:
            # 패널티: 자유로운 전술을 받쳐줄 전체 시야/위치선정 수준이 부족함
            _record_penalty(context, "OH_PLAY_FOR_FREEDOM_STRUCTURE_WEAK")
            rating -= 56.0

    return rating
