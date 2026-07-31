"""TacticConfig.transitions 기반 rating_adjustment 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.predictors.win_predictor.report import TRANSITIONS as CAT
from app.predictors.win_predictor.report import bonus, have, need, penalty
from app.schemas import TacticConfig


def apply_transitions(tc: TacticConfig, context: TeamContext) -> float:
    rating_adjustment = 0.0
    tr = getattr(tc, "transitions", None)
    if not tr:
        return rating_adjustment

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
        reasons = (
            need("전방/중원 주력", fm_pace, 13),
            need("민첩성", fm_agil, 13),
            need("위치선정", fm_pos, 13),
        )
        if fm_pace >= 13 and fm_agil >= 13 and fm_pos >= 13:
            bonus(context, CAT, "빼앗긴 즉시 다시 압박할 전방/중원 기동력이 있음", *reasons)
            rating_adjustment += 12.0
        else:
            penalty(context, CAT, "역압박을 수행할 전방/중원 자원의 속도·민첩성·위치선정이 부족함", *reasons)
            rating_adjustment -= 32.0
        # 체력/연령 페널티
        if age_avg >= 32 or strength_avg <= 9:
            penalty(
                context, CAT, "고령화되었거나 몸싸움이 약해 역압박 유지가 어려움",
                need("팀 평균 연령", age_avg, 32, "세", higher=False),
                need("몸싸움", strength_avg, 9.1),
            )
            rating_adjustment *= 0.8

    if counter_after_win:
        atk_pace = avg(lambda p: attr(p, "pace"), attackers)
        atk_pos = avg(lambda p: attr(p, "positioning"), attackers)
        reasons = (need("공격진 주력", atk_pace, 13), need("위치선정", atk_pos, 12))
        if atk_pace >= 13 and atk_pos >= 12:
            bonus(context, CAT, "공을 따낸 뒤 곧바로 뒷공간을 노릴 속도가 있음", *reasons)
            rating_adjustment += 10.0
        else:
            penalty(context, CAT, "역습 전환에 필요한 공격수의 주력/위치선정이 부족함", *reasons)
            rating_adjustment -= 12.0

    if gk_distribution_quick:
        if distribution_method == "short":
            gk_pass = attr(gk, "passing")
            cb_pos_avg = avg(lambda p: attr(p, "positioning"), cbs)
            cb_pass_avg = avg(lambda p: attr(p, "passing"), cbs)
            reasons = (
                need("골키퍼 패스", gk_pass, 12),
                need("센터백 위치선정", cb_pos_avg, 11),
                need("패스", cb_pass_avg, 11),
            )
            if gk_pass >= 12 and cb_pos_avg >= 11 and cb_pass_avg >= 11:
                bonus(context, CAT, "짧고 빠른 배급으로 공격 전환을 시작할 수 있음", *reasons)
                rating_adjustment += 1.8
            else:
                penalty(context, CAT, "짧은 배급을 소화할 골키퍼/센터백의 안정성과 패스가 부족함", *reasons)
                rating_adjustment -= 20.0
        else:  # 롱 배급
            st_height_avg = avg(lambda p: getattr(p, "height", 0), attackers)
            st_strength_avg = avg(lambda p: attr(p, "strength"), attackers)
            long_dist_score = (st_height_avg - 180) * 0.02 + (st_strength_avg - 10) * 0.12
            reasons = (
                have("공격진 평균 신장", st_height_avg, "cm"),
                have("몸싸움", st_strength_avg),
            )
            if long_dist_score < 0:
                penalty(context, CAT, "롱 배급을 받을 공격수의 제공권/몸싸움이 부족함", *reasons)
                rating_adjustment += long_dist_score * 6.0
            else:
                bonus(context, CAT, "롱 배급을 받아낼 공격수의 제공권/몸싸움이 확보됨", *reasons)
                rating_adjustment += long_dist_score

    return rating_adjustment
