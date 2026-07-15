"""TacticConfig.inPossession 기반 rating 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.schemas import TacticConfig


def apply_in_possession(rating: float, tc: TacticConfig, context: TeamContext) -> float:
    ip = getattr(tc, "inPossession", None)
    if not ip:
        return rating

    field_players = context.field_players
    midfielders = context.midfielders
    attackers = context.attackers
    wingers = context.wingers
    cbs = context.cbs
    gk = context.gk

    buildup = getattr(ip, "buildupStyle", "mixed")
    passing_directness = getattr(ip, "passingDirectness", 50)
    tempo = getattr(ip, "tempo", 50)
    attacking_width = getattr(ip, "attackingWidth", 50)
    target_wide = getattr(ip, "targetWide", False)
    target_central = getattr(ip, "targetCentral", False)
    overlap_left = getattr(ip, "overlapLeft", False)
    overlap_right = getattr(ip, "overlapRight", False)
    build_from_back = getattr(ip, "buildFromBack", False)

    # Short build + low directness -> midfield synergy or turnover penalty
    if buildup == "short" and passing_directness < 50:
        mid_pass_avg = avg(lambda p: attr(p, "passing"), midfielders)
        mid_vision_avg = avg(lambda p: attr(p, "vision"), midfielders)
        mid_agility_avg = avg(lambda p: attr(p, "agility"), midfielders)
        if mid_pass_avg >= 13 and mid_vision_avg >= 13 and mid_agility_avg >= 13:
            rating += 4.0  # synergy bonus
        else:
            rating -= 6.0  # turnover penalty

    # Direct build + high directness -> use CB passing + attacker physicals
    if buildup == "direct" and passing_directness > 50:
        cb_pass_avg = avg(lambda p: attr(p, "passing"), cbs)
        atk_strength_avg = avg(lambda p: attr(p, "strength"), attackers)
        atk_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        atk_pos_avg = avg(lambda p: attr(p, "positioning"), attackers)
        if cb_pass_avg >= 11 and (atk_strength_avg >= 11 or atk_pace_avg >= 12):
            rating += 3.0
        else:
            rating -= 2.5

    # Attacking width + targetWide
    if attacking_width > 65 and target_wide:
        # require wing resources
        if len(wingers) < 2:
            # tactical mismatch with narrow personnel
            rating -= 7.0
        else:
            wings_pace_avg = avg(lambda p: attr(p, "pace"), wingers)
            wings_drib_avg = avg(lambda p: attr(p, "dribbling"), wingers)
            rating += (wings_pace_avg + wings_drib_avg - 20) * 0.15

    # Narrow width + targetCentral
    if attacking_width < 35 and target_central:
        central_players = [p for p in field_players if any(pos in ("CM", "AM", "ST") for pos in getattr(p, "positions", []))]
        cent_pass_avg = avg(lambda p: attr(p, "passing"), central_players)
        cent_vision_avg = avg(lambda p: attr(p, "vision"), central_players)
        cent_agility_avg = avg(lambda p: attr(p, "agility"), central_players)
        rating += (cent_pass_avg + cent_vision_avg + cent_agility_avg - 30) * 0.12

    # Overlaps
    if overlap_left or overlap_right:
        # treat both sides the same due to lack of side-specific players
        overlap_players = [p for p in field_players if any(pos in ("FB", "WB") for pos in getattr(p, "positions", []))]
        ov_pace_avg = avg(lambda p: attr(p, "pace"), overlap_players)
        ov_pos_avg = avg(lambda p: attr(p, "positioning"), overlap_players)
        if ov_pace_avg >= 14 and ov_pos_avg >= 14:
            rating += 2.5
            # risk: if CBs are slow or poor marking, heavy vulnerability
            cb_pace_avg = avg(lambda p: attr(p, "pace"), cbs)
            cb_mark_avg = avg(lambda p: attr(p, "marking"), cbs)
            if cb_pace_avg <= 11 or cb_mark_avg <= 11:
                rating -= 5.0
        else:
            rating -= 1.5

    # Build from back
    if build_from_back:
        gk_over = getattr(getattr(gk, "attributes", None), "overall", 0)
        cb_pass_avg = avg(lambda p: attr(p, "passing"), cbs)
        cb_vision_avg = avg(lambda p: attr(p, "vision"), cbs)
        cb_agility_avg = avg(lambda p: attr(p, "agility"), cbs)
        if gk_over >= 12 and cb_pass_avg >= 11 and cb_vision_avg >= 11 and cb_agility_avg >= 10:
            rating += 3.0
        else:
            # turnover -> significant penalty
            rating -= 8.0

    # Tempo
    if tempo > 70:
        team_agility_avg = avg(lambda p: attr(p, "agility"), field_players)
        team_pass_avg = avg(lambda p: attr(p, "passing"), field_players)
        team_vision_avg = avg(lambda p: attr(p, "vision"), field_players)
        if team_agility_avg >= 12 and team_pass_avg >= 12 and team_vision_avg >= 12:
            rating += (tempo - 70) * 0.08
        else:
            rating -= (tempo - 70) * 0.12

    return rating
