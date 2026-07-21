
from app.predictors.win_predictor.context import TeamContext, attr, avg
from app.schemas import TacticConfig

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
    if style.tacticStyle == "possession":
        midfielders = context.midfielders
        mid_pass_vision_avg = _get_player_avg_stats(midfielders, ["passing", "vision"])
        if mid_pass_vision_avg >= 14:
            rating_adjustment += 20.0  # Synergy Bonus
        
        team_pass_avg = avg(lambda p: attr(p, "passing"), context.field_players)
        if team_pass_avg < 11:
            rating_adjustment -= 50.0  # Penalty

    elif style.tacticStyle == "counter_attack":
        attackers = context.attackers
        defenders = context.defenders
        atk_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        def_tackling_avg = avg(lambda p: attr(p, "tackling"), defenders)
        if atk_pace_avg >= 15 and def_tackling_avg >= 13:
            rating_adjustment += 25.0  # Synergy Bonus
        
        if atk_pace_avg < 12:
            rating_adjustment -= 30.0 # Penalty

    elif style.tacticStyle == "direct":
        strikers = [p for p in context.attackers if "ST" in p.positions]
        defenders_and_dms = context.defenders + [p for p in context.midfielders if "DM" in p.positions]
        
        if strikers:
            st_strength = avg(lambda p: attr(p, "strength"), strikers)
            st_height = avg(lambda p: p.height, strikers)
            
            passing_avg = avg(lambda p: attr(p, "passing"), defenders_and_dms)

            if (st_height >= 185 or st_strength >= 15) and passing_avg >= 12:
                rating_adjustment += 22.0  # Synergy Bonus
            
            if st_height < 180 and st_strength < 11:
                rating_adjustment -= 45.0  # Penalty

    elif style.tacticStyle == "gegenpressing":
        team_pos_pace_avg = avg(lambda p: (attr(p, "positioning") + attr(p, "pace")) / 2, context.field_players)
        team_age_avg = avg(lambda p: p.age, context.players_all)
        
        if team_pos_pace_avg >= 14 and team_age_avg <= 28:
            rating_adjustment += 28.0  # Synergy Bonus
            
        team_pace_agility_avg = avg(lambda p: (attr(p, "pace") + attr(p, "agility")) / 2, context.field_players)
        if team_age_avg > 30 or team_pace_agility_avg < 12:
            rating_adjustment -= 60.0  # Penalty

    # TacticStyle.approach
    if style.approach == "attacking":
        attackers = context.attackers
        defenders = context.defenders
        atk_fin_vis_pos_avg = _get_player_avg_stats(attackers, ["finishing", "vision", "positioning"])
        if atk_fin_vis_pos_avg >= 14:
            rating_adjustment += 18.0  # Synergy
        
        def_pace_avg = avg(lambda p: attr(p, "pace"), defenders)
        if def_pace_avg < 12:
            rating_adjustment -= 55.0  # Penalty

    elif style.approach == "defensive":
        def_mid = context.defenders + context.midfielders
        def_stats_avg = _get_player_avg_stats(def_mid, ["marking", "tackling", "strength", "positioning"])
        if def_stats_avg >= 14:
            rating_adjustment += 15.0  # Synergy
            
        attackers = context.attackers
        crack_players = [p for p in attackers if attr(p, "dribbling") >= 15 and attr(p, "finishing") >= 15 and attr(p, "pace") >= 15]
        if not crack_players:
            rating_adjustment -= 40.0 # Penalty

    elif style.approach == "balanced":
        all_stats = []
        for p in context.field_players:
            all_stats.extend([p.passing, p.vision, p.agility, p.pace, p.tackling, p.marking, p.strength, p.finishing, p.positioning, p.dribbling])
        
        low_stat_players = [p for p in context.field_players if any(s < 10 for s in [p.passing, p.vision, p.agility, p.pace, p.tackling, p.marking, p.strength, p.finishing, p.positioning, p.dribbling])]
        
        if not low_stat_players:
            rating_adjustment += 10.0  # Synergy

        attackers_avg = _get_player_avg_stats(context.attackers, ["finishing", "pace", "dribbling"])
        defenders_avg = _get_player_avg_stats(context.defenders, ["marking", "tackling", "strength"])

        if abs(attackers_avg - defenders_avg) > 7:
            rating_adjustment -= 20.0 # Penalty
            
    return rating_adjustment
