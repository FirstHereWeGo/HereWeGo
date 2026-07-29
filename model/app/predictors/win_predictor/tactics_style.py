"""TacticConfig.style(팀 스타일 + 공수 비중) 기반 rating_adjustment 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.predictors.win_predictor.report import STYLE as CAT
from app.predictors.win_predictor.report import bonus, have, need, penalty
from app.schemas import TacticConfig

# 프론트/seed(tactic.py)는 'counter', 'gegenpress'를 쓰고 이 파일은 원래 'counter_attack',
# 'gegenpressing'만 봤기 때문에 두 스타일의 규칙이 통째로 죽어 있었다. 양쪽 표기를 모두 받는다.
STYLE_ALIASES = {
    "counter": "counter_attack",
    "counter_attack": "counter_attack",
    "gegenpress": "gegenpressing",
    "gegenpressing": "gegenpressing",
    "possession": "possession",
    "direct": "direct",
    "attacking": "direct",  # seed에 남아 있는 표기 - 롱볼/다이렉트 계열로 취급
}

STYLE_LABELS = {
    "possession": "점유형",
    "counter_attack": "역습형",
    "direct": "다이렉트형",
    "gegenpressing": "게겐프레싱형",
}

APPROACH_LABELS = {
    "attacking": "공격적",
    "balanced": "균형",
    "defensive": "수비적",
}


def normalize_style(tactic_style: str | None) -> str:
    return STYLE_ALIASES.get(tactic_style or "", "possession")


def style_label(tc: TacticConfig | None) -> str:
    """배지에 쓸 '점유형 · 공격적' 형태의 짧은 라벨."""
    style = getattr(tc, "style", None)
    key = normalize_style(getattr(style, "tacticStyle", None))
    approach = APPROACH_LABELS.get(getattr(style, "approach", "balanced"), "균형")
    return f"{STYLE_LABELS.get(key, key)} · {approach}"


def _get_player_avg_stats(players, stats):
    if not players:
        return 0
    return avg(lambda p: sum(attr(p, stat) for stat in stats) / len(stats), players)


def apply_style(tc: TacticConfig, context: TeamContext) -> float:
    rating_adjustment = 0.0
    style = getattr(tc, "style", None)
    if not style:
        return rating_adjustment

    tactic_style = normalize_style(getattr(style, "tacticStyle", None))

    # 'possession' 전술 스타일
    if tactic_style == "possession":
        midfielders = context.midfielders
        # 미드필더진의 볼 배급 능력과 시야가 좋아야 지배적인 경기를 펼칠 수 있음
        mid_pass_vision_avg = _get_player_avg_stats(midfielders, ["passing", "vision"])
        if mid_pass_vision_avg >= 14:
            bonus(
                context, CAT, "중원의 배급과 시야가 점유 축구를 지탱함",
                need("미드필더 패스+시야 평균", mid_pass_vision_avg, 14),
            )
            rating_adjustment += 20.0  # 시너지 보너스 (Synergy Bonus)

        # 패싱 능력이 낮으면 볼 점유가 어렵고 빌드업에 실패할 확률이 높음
        team_pass_avg = avg(lambda p: attr(p, "passing"), context.field_players)
        if team_pass_avg < 11:
            penalty(
                context, CAT, "패싱 능력이 낮으면 볼 점유가 어렵고 빌드업에 실패할 확률이 높음",
                need("팀 평균 패스", team_pass_avg, 11),
            )
            rating_adjustment -= 50.0  # 페널티 (Penalty)

    # 'counter_attack' 전술 스타일 (역습)
    elif tactic_style == "counter_attack":
        attackers = context.attackers
        defenders = context.defenders
        # 빠른 공격수와 견고한 수비를 통해 효과적인 역습 전술 구사 가능
        atk_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        def_tackling_avg = avg(lambda p: attr(p, "tackling"), defenders)
        if atk_pace_avg >= 15 and def_tackling_avg >= 13:
            bonus(
                context, CAT, "빠른 공격진과 단단한 수비가 역습 구조를 완성함",
                need("공격진 주력", atk_pace_avg, 15), need("수비진 태클", def_tackling_avg, 13),
            )
            rating_adjustment += 25.0  # 시너지 보너스 (Synergy Bonus)

        # 역습 전술의 핵심인 공격 속도가 부족하면 전술 효율 저하
        if atk_pace_avg < 12:
            penalty(
                context, CAT, "역습 전술의 핵심인 공격 속도가 부족하면 전술 효율 저하",
                need("공격진 주력", atk_pace_avg, 12),
            )
            rating_adjustment -= 30.0  # 페널티 (Penalty)

    # 'direct' 전술 스타일 (다이렉트 플레이)
    elif tactic_style == "direct":
        strikers = [p for p in context.attackers if "ST" in p.positions]  # 스트라이커만 필터링
        defenders_and_dms = context.defenders + [p for p in context.midfielders if "DM" in p.positions]

        if strikers:  # 스트라이커가 존재할 경우
            st_strength = avg(lambda p: attr(p, "strength"), strikers)  # 스트라이커 평균 몸싸움
            st_height = avg(lambda p: p.height, strikers)  # 스트라이커 평균 신장
            passing_avg = avg(lambda p: attr(p, "passing"), defenders_and_dms)  # 수비수 및 수미 평균 패싱

            # 장신/몸싸움 좋은 스트라이커와 정확한 롱패스를 공급할 후방 라인이 조화를 이룰 때 효과적
            if (st_height >= 185 or st_strength >= 15) and passing_avg >= 12:
                bonus(
                    context, CAT, "타깃형 스트라이커와 후방 롱패스 공급이 맞물림",
                    need("스트라이커 신장", st_height, 185, "cm"),
                    need("또는 몸싸움", st_strength, 15),
                    need("후방 패스", passing_avg, 12),
                )
                rating_adjustment += 22.0  # 시너지 보너스 (Synergy Bonus)

            # 제공권이나 몸싸움에 약한 스트라이커는 다이렉트 플레이에 부적합
            if st_height < 180 and st_strength < 11:
                penalty(
                    context, CAT, "제공권이나 몸싸움에 약한 스트라이커는 다이렉트 플레이에 부적합",
                    need("스트라이커 신장", st_height, 180, "cm"),
                    need("몸싸움", st_strength, 11),
                )
                rating_adjustment -= 45.0  # 페널티 (Penalty)

    # 'gegenpressing' 전술 스타일 (게겐프레싱)
    elif tactic_style == "gegenpressing":
        # 젊고 활동량 많은 선수들이 전방 압박 및 빠른 공수 전환에 유리
        team_pos_pace_avg = avg(lambda p: (attr(p, "positioning") + attr(p, "pace")) / 2, context.field_players)
        team_age_avg = avg(lambda p: p.age, context.players_all)

        if team_pos_pace_avg >= 14 and team_age_avg <= 28:
            bonus(
                context, CAT, "젊고 기동력 있는 스쿼드가 게겐프레싱에 최적화됨",
                need("팀 위치선정+주력 평균", team_pos_pace_avg, 14),
                need("팀 평균 연령", team_age_avg, 28, "세", higher=False),
            )
            rating_adjustment += 28.0  # 시너지 보너스 (Synergy Bonus)

        # 활동량이 많아야 하는 게겐프레싱은 노쇠하거나 기동성이 떨어지는 선수들에게 불리
        team_pace_agility_avg = avg(lambda p: (attr(p, "pace") + attr(p, "agility")) / 2, context.field_players)
        if team_age_avg > 30 or team_pace_agility_avg < 12:
            penalty(
                context, CAT, "활동량이 많아야 하는 게겐프레싱 전술은 노쇠하거나 기동성이 떨어지는 선수들에게 불리",
                need("팀 평균 연령", team_age_avg, 30, "세", higher=False),
                need("주력+민첩성 평균", team_pace_agility_avg, 12),
            )
            rating_adjustment -= 60.0  # 페널티 (Penalty)

    # TacticStyle.approach
    # 'attacking' 전술 접근 방식 (공격형)
    if style.approach == "attacking":
        attackers = context.attackers
        defenders = context.defenders
        # 공격 전술의 성공을 위한 공격진의 핵심 능력치
        atk_fin_vis_pos_avg = _get_player_avg_stats(attackers, ["finishing", "vision", "positioning"])
        if atk_fin_vis_pos_avg >= 14:
            bonus(
                context, CAT, "공격진의 마무리·시야·위치선정이 공격적 접근을 받쳐줌",
                need("공격진 결정력+시야+위치선정 평균", atk_fin_vis_pos_avg, 14),
            )
            rating_adjustment += 18.0  # 시너지 (Synergy)

        # 공격적인 전술로 뒷공간이 많이 생기는데 수비수가 느리면 위험에 노출될 확률 증가
        def_pace_avg = avg(lambda p: attr(p, "pace"), defenders)
        if def_pace_avg < 12:
            penalty(
                context, CAT, "공격적인 전술로 인해 뒷공간이 많이 생기는데, 수비수의 속도가 느리면 위험에 노출될 확률 증가",
                need("수비진 주력", def_pace_avg, 12),
            )
            rating_adjustment -= 55.0  # 페널티 (Penalty)

    # 'defensive' 전술 접근 방식 (수비형)
    elif style.approach == "defensive":
        def_mid = context.defenders + context.midfielders
        # 수비적인 전술의 성공을 위한 수비 및 중원 장악력
        def_stats_avg = _get_player_avg_stats(def_mid, ["marking", "tackling", "strength", "positioning"])
        if def_stats_avg >= 14:
            bonus(
                context, CAT, "수비·중원의 대인 방어력이 수비적 접근과 맞음",
                need("수비+중원 마킹·태클·몸싸움·위치선정 평균", def_stats_avg, 14),
            )
            rating_adjustment += 15.0  # 시너지 (Synergy)

        attackers = context.attackers
        # 수비형 전술에서 역습을 통한 한 방을 기대하기 어려움
        crack_players = [p for p in attackers if attr(p, "dribbling") >= 15 and attr(p, "finishing") >= 15 and attr(p, "pace") >= 15]
        if not crack_players:
            penalty(
                context, CAT, "수비형 전술에서 역습을 통한 한 방을 기대하기 어려움",
                "드리블·결정력·주력이 모두 15 이상인 해결사 0명",
            )
            rating_adjustment -= 40.0  # 페널티 (Penalty)

    # 'balanced' 전술 접근 방식 (균형형)
    elif style.approach == "balanced":
        # 모든 선수가 기본적인 능력치를 고루 갖춰야 균형 잡힌 전술을 효과적으로 수행 가능
        stat_names = ["passing", "vision", "agility", "pace", "tackling", "marking", "strength", "finishing", "positioning", "dribbling"]

        low_stat_players = [
            p for p in context.field_players
            if any(attr(p, s) < 10 for s in stat_names)
        ]

        if not low_stat_players:
            bonus(
                context, CAT, "구멍 난 스탯이 없어 균형 잡힌 운영이 가능함",
                "10 미만 스탯을 가진 선발 필드 플레이어 0명",
            )
            rating_adjustment += 10.0  # 시너지 (Synergy)

        attackers_avg = _get_player_avg_stats(context.attackers, ["finishing", "pace", "dribbling"])
        defenders_avg = _get_player_avg_stats(context.defenders, ["marking", "tackling", "strength"])

        # 공격 또는 수비 한쪽에 치우친 팀은 균형 잡힌 전술을 수행하기 어려움
        if abs(attackers_avg - defenders_avg) > 7:
            penalty(
                context, CAT, "공격 또는 수비 한쪽에 치우친 팀은 균형 잡힌 전술을 수행하기 어려움",
                have("공격진 평균", attackers_avg), have("수비진 평균", defenders_avg),
                need("두 값의 차이", abs(attackers_avg - defenders_avg), 7, "", higher=False),
            )
            rating_adjustment -= 20.0  # 페널티 (Penalty)

    return rating_adjustment
