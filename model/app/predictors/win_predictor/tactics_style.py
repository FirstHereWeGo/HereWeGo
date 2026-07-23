
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.schemas import TacticConfig

def _record_penalty(context: TeamContext, code: str) -> None:
    penalties = getattr(context, "penalty_codes", None)
    if penalties is None:
        penalties = []
        setattr(context, "penalty_codes", penalties)
    penalties.append(code)
    setattr(TeamContext, "_last_penalty_codes", list(penalties))

def _get_player_avg_stats(players, stats):
    if not players:
        return 0
    return avg(lambda p: sum(attr(p, stat) for stat in stats) / len(stats), players)

def apply_style(tc: TacticConfig, context: TeamContext) -> float:
    rating_adjustment = 0.0
    style = getattr(tc, "style", None)
    if not style:
        return rating_adjustment

    # TacticStyle.style
    # 'possession' 전술 스타일
    elif style.tacticStyle == "possession":
        midfielders = context.midfielders
        # 미드필더의 평균 패싱 및 시야 능력치가 14 이상일 경우 시너지
        # 미드필더진의 볼 배급 능력과 시야가 좋아야 지배적인 경기를 펼칠 수 있음
        mid_pass_vision_avg = _get_player_avg_stats(midfielders, ["passing", "vision"])
        if mid_pass_vision_avg >= 14:
            rating_adjustment += 20.0  # 시너지 보너스 (Synergy Bonus)

        # 팀 전체의 평균 패싱 능력치가 11 미만일 경우 페널티
        # 패싱 능력이 낮으면 볼 점유가 어렵고 빌드업에 실패할 확률이 높음
        team_pass_avg = avg(lambda p: attr(p, "passing"), context.field_players)
        if team_pass_avg < 11:
            _record_penalty(context, "패싱 능력이 낮으면 볼 점유가 어렵고 빌드업에 실패할 확률이 높음")
            rating_adjustment -= 50.0  # 페널티 (Penalty)

    # 'counter_attack' 전술 스타일 (역습)
    elif style.tacticStyle == "counter_attack":
        attackers = context.attackers
        defenders = context.defenders
        # 공격수의 평균 속도(pace)가 15 이상이고 수비수의 평균 태클(tackling) 능력치가 13 이상일 경우 시너지
        # 빠른 공격수와 견고한 수비를 통해 효과적인 역습 전술 구사 가능
        atk_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        def_tackling_avg = avg(lambda p: attr(p, "tackling"), defenders)
        if atk_pace_avg >= 15 and def_tackling_avg >= 13:
            rating_adjustment += 25.0  # 시너지 보너스 (Synergy Bonus)

        # 공격수의 평균 속도(pace)가 12 미만일 경우 페널티
        # 역습 전술의 핵심인 공격 속도가 부족하면 전술 효율 저하
        if atk_pace_avg < 12:
            _record_penalty(context, "역습 전술의 핵심인 공격 속도가 부족하면 전술 효율 저하")
            rating_adjustment -= 30.0  # 페널티 (Penalty)

    # 'direct' 전술 스타일 (다이렉트 플레이)
    elif style.tacticStyle == "direct":
        strikers = [p for p in context.attackers if "ST" in p.positions] # 스트라이커만 필터링
        defenders_and_dms = context.defenders + [p for p in context.midfielders if "DM" in p.positions] # 수비수와 수비형 미드필더

        if strikers: # 스트라이커가 존재할 경우
            st_strength = avg(lambda p: attr(p, "strength"), strikers) # 스트라이커 평균 몸싸움
            st_height = avg(lambda p: p.height, strikers) # 스트라이커 평균 신장

            passing_avg = avg(lambda p: attr(p, "passing"), defenders_and_dms) # 수비수 및 수미 평균 패싱

            # 스트라이커의 신장이 185 이상이거나 몸싸움이 15 이상이고, 수비-수미 라인의 패싱이 12 이상일 경우 시너지
            # 장신/몸싸움 좋은 스트라이커와 정확한 롱패스를 공급할 수 있는 후방 빌드업 라인이 조화를 이룰 때 효과적
            if (st_height >= 185 or st_strength >= 15) and passing_avg >= 12:
                rating_adjustment += 22.0  # 시너지 보너스 (Synergy Bonus)

            # 스트라이커의 신장이 180 미만이고 몸싸움이 11 미만일 경우 페널티
            # 제공권이나 몸싸움에 약한 스트라이커는 다이렉트 플레이에 부적합
            if st_height < 180 and st_strength < 11:
                _record_penalty(context, "제공권이나 몸싸움에 약한 스트라이커는 다이렉트 플레이에 부적합")
                rating_adjustment -= 45.0  # 페널티 (Penalty)

    # 'gegenpressing' 전술 스타일 (게겐프레싱)
    elif style.tacticStyle == "gegenpressing":
        # 팀 전체 필드 플레이어의 평균 위치 선정(positioning) 및 속도(pace) 능력치가 14 이상이고,
        # 팀 전체 선수의 평균 연령이 28세 이하일 경우 시너지
        # 젊고 활동량 많은 선수들이 전방 압박 및 빠른 공수 전환에 유리
        team_pos_pace_avg = avg(lambda p: (attr(p, "positioning") + attr(p, "pace")) / 2, context.field_players)
        team_age_avg = avg(lambda p: p.age, context.players_all)

        if team_pos_pace_avg >= 14 and team_age_avg <= 28:
            rating_adjustment += 28.0  # 시너지 보너스 (Synergy Bonus)

        # 팀 전체 선수의 평균 연령이 30세 초과이거나, 팀 전체 필드 플레이어의 평균 속도(pace) 및 민첩성(agility)이 12 미만일 경우 페널티
        # 활동량이 많아야 하는 게겐프레싱 전술은 노쇠하거나 기동성이 떨어지는 선수들에게 불리
        team_pace_agility_avg = avg(lambda p: (attr(p, "pace") + attr(p, "agility")) / 2, context.field_players)
        if team_age_avg > 30 or team_pace_agility_avg < 12:
            _record_penalty(context, "활동량이 많아야 하는 게겐프레싱 전술은 노쇠하거나 기동성이 떨어지는 선수들에게 불리")
            rating_adjustment -= 60.0  # 페널티 (Penalty)

    # TacticStyle.approach
    # 'attacking' 전술 접근 방식 (공격형)
    if style.approach == "attacking":
        attackers = context.attackers
        defenders = context.defenders
        # 공격수의 평균 결정력(finishing), 시야(vision), 위치 선정(positioning) 능력치가 14 이상일 경우 시너지
        # 공격 전술의 성공을 위한 공격진의 핵심 능력치
        atk_fin_vis_pos_avg = _get_player_avg_stats(attackers, ["finishing", "vision", "positioning"])
        if atk_fin_vis_pos_avg >= 14:
            rating_adjustment += 18.0  # 시너지 (Synergy)

        # 수비수의 평균 속도(pace)가 12 미만일 경우 페널티
        # 공격적인 전술로 인해 뒷공간이 많이 생기는데, 수비수의 속도가 느리면 위험에 노출될 확률 증가
        def_pace_avg = avg(lambda p: attr(p, "pace"), defenders)
        if def_pace_avg < 12:
            _record_penalty(context, "공격적인 전술로 인해 뒷공간이 많이 생기는데, 수비수의 속도가 느리면 위험에 노출될 확률 증가")
            rating_adjustment -= 55.0  # 페널티 (Penalty)

    # 'defensive' 전술 접근 방식 (수비형)
    elif style.approach == "defensive":
        def_mid = context.defenders + context.midfielders
        # 수비수와 미드필더의 평균 마킹(marking), 태클(tackling), 몸싸움(strength), 위치 선정(positioning) 능력치가 14 이상일 경우 시너지
        # 수비적인 전술의 성공을 위한 수비 및 중원 장악력
        def_stats_avg = _get_player_avg_stats(def_mid, ["marking", "tackling", "strength", "positioning"])
        if def_stats_avg >= 14:
            rating_adjustment += 15.0  # 시너지 (Synergy)

        attackers = context.attackers
        # 공격수 중에 드리블, 결정력, 속도 모두 15 이상인 선수가 없을 경우 페널티
        # 수비형 전술에서 역습을 통한 한 방을 기대하기 어려움
        crack_players = [p for p in attackers if attr(p, "dribbling") >= 15 and attr(p, "finishing") >= 15 and attr(p, "pace") >= 15]
        if not crack_players:
            _record_penalty(context, "수비형 전술에서 역습을 통한 한 방을 기대하기 어려움")
            rating_adjustment -= 40.0  # 페널티 (Penalty)

    # 'balanced' 전술 접근 방식 (균형형)
    elif style.approach == "balanced":
        # 팀 전체 필드 플레이어 중 특정 핵심 능력치(패싱, 시야, 민첩성, 속도, 태클, 마킹, 몸싸움, 결정력, 위치 선정, 드리블) 중
        # 어느 하나라도 10 미만인 선수가 없을 경우 시너지
        # 모든 선수가 기본적인 능력치를 고루 갖춰야 균형 잡힌 전술을 효과적으로 수행 가능
        stat_names = ["passing", "vision", "agility", "pace", "tackling", "marking", "strength", "finishing", "positioning", "dribbling"]

        low_stat_players = [
            p for p in context.field_players
            if any(attr(p, s) < 10 for s in stat_names)
        ]

        if not low_stat_players:
            rating_adjustment += 10.0  # 시너지 (Synergy)

        attackers_avg = _get_player_avg_stats(context.attackers, ["finishing", "pace", "dribbling"])
        defenders_avg = _get_player_avg_stats(context.defenders, ["marking", "tackling", "strength"])

        # 공격수 평균 능력치와 수비수 평균 능력치 차이가 7을 초과할 경우 페널티
        # 공격 또는 수비 한쪽에 치우친 팀은 균형 잡힌 전술을 수행하기 어려움
        if abs(attackers_avg - defenders_avg) > 7:
            _record_penalty(context, "공격 또는 수비 한쪽에 치우친 팀은 균형 잡힌 전술을 수행하기 어려움")
            rating_adjustment -= 20.0  # 페널티 (Penalty)
            
    return rating_adjustment
