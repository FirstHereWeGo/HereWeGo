"""TacticConfig.transitions 기반 rating 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg, gk_overall
from app.schemas import TacticConfig


def apply_transitions(rating: float, tc: TacticConfig, context: TeamContext) -> float:
    tr = getattr(tc, "transitions", None)
    if not tr:
        return rating

    field_players = context.field_players
    attackers = context.attackers
    cbs = context.cbs
    players_all = context.players_all
    gk = context.gk

    press_after_loss = getattr(tr, "pressAfterLoss", False)
    counter_after_win = getattr(tr, "counterAfterWin", False)
    gk_distribution_quick = getattr(tr, "gkDistributeQuick", False)
    distribution_method = getattr(tr, "distributionMethod", "short")

    if press_after_loss:
        front_mid = [p for p in field_players if any(pos in ("WG", "ST", "AM", "CM", "DM") for pos in getattr(p, "positions", []))]
        fm_pace = avg(lambda p: attr(p, "pace"), front_mid)
        fm_agil = avg(lambda p: attr(p, "agility"), front_mid)
        fm_pos = avg(lambda p: attr(p, "positioning"), front_mid)
        age_avg = avg(lambda p: getattr(p, "age", 0), players_all)
        strength_avg = avg(lambda p: attr(p, "strength"), players_all)
        if fm_pace >= 13 and fm_agil >= 13 and fm_pos >= 13:
            rating += 3.0
        else:
            rating -= 4.0
        # 체력/연령 페널티
        if age_avg >= 32 or strength_avg <= 9:
            rating *= 0.9

    if counter_after_win:
        atk_pace = avg(lambda p: attr(p, "pace"), attackers)
        atk_pos = avg(lambda p: attr(p, "positioning"), attackers)
        if atk_pace >= 13 and atk_pos >= 12:
            rating += 2.5

    if gk_distribution_quick:
        if distribution_method == "short":
            gk_over = gk_overall(gk)
            cb_pos_avg = avg(lambda p: attr(p, "positioning"), cbs)
            cb_pass_avg = avg(lambda p: attr(p, "passing"), cbs)
            if gk_over >= 12 and cb_pos_avg >= 11 and cb_pass_avg >= 11:
                rating += 1.8
            else:
                rating -= 2.5
        else:  # 롱 배급
            st_height_avg = avg(lambda p: getattr(p, "height", 0), attackers)
            st_strength_avg = avg(lambda p: attr(p, "strength"), attackers)
            rating += (st_height_avg - 180) * 0.02 + (st_strength_avg - 10) * 0.12

    return rating
