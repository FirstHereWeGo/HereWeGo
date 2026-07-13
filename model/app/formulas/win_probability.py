"""
양팀의 선수 합성 등급 + 전술 지표를 이용한 승/무/패 확률 계산.
두 팀 모두 동일한 공식을 대칭으로 통과하므로 상대적 계산이 보장된다.
"""
import math

from app.formulas.attribute_index_map import compute_team_composite
from app.formulas.tactic_index_map import compute_tactic_indices
from app.schemas import TeamMatchInput, TeamOutcome, WinProbabilityInput, WinProbabilityOutput

# 공격 실효치 보정 계수
A_TEMPO, A_DIRECTNESS, A_WIDTH, A_RISK = 0.3, 0.25, 0.15, 0.2
# 수비 실효치 보정 계수
D_PRESS, D_COMPACT, D_LINE = 0.25, 0.25, 0.15
# ratingDiff 결합 계수
K_NET_THREAT, M_MENTAL, P_PHYSICAL = 1.0, 0.15, 0.1
ELO_SCALE = 15.0
BASE_DRAW_PROB = 0.24
DRAW_SHRINK_RATE = 0.004
MIN_DRAW_PROB = 0.08


def _effective_attack(team_attack: float, idx) -> float:
    return team_attack * (
        1
        + A_TEMPO * (idx.buildupTempo - 50) / 100
        + A_DIRECTNESS * (idx.directness - 50) / 100
        + A_WIDTH * (idx.attackingWidth - 50) / 100
        + A_RISK * (idx.riskTaking - 50) / 100
    )


def _effective_defense(team_defense: float, idx) -> float:
    return team_defense * (
        1
        + D_PRESS * (idx.pressingIndex - 50) / 100
        + D_COMPACT * (idx.defensiveCompactness - 50) / 100
        - D_LINE * (idx.defensiveLineHeight - 50) / 100
    )


def _team_stats(team: TeamMatchInput):
    composite = compute_team_composite(team.players)
    indices = compute_tactic_indices(team.tacticConfig)
    return composite, indices


def calculate_win_probability(payload: WinProbabilityInput) -> WinProbabilityOutput:
    composite_a, idx_a = _team_stats(payload.teamA)
    composite_b, idx_b = _team_stats(payload.teamB)

    effective_attack_a = _effective_attack(composite_a.attackingRating, idx_a)
    effective_attack_b = _effective_attack(composite_b.attackingRating, idx_b)
    effective_defense_a = _effective_defense(composite_a.defendingRating, idx_a)
    effective_defense_b = _effective_defense(composite_b.defendingRating, idx_b)

    net_threat_a = effective_attack_a - effective_defense_b
    net_threat_b = effective_attack_b - effective_defense_a

    rating_diff = (
        K_NET_THREAT * (net_threat_a - net_threat_b)
        + M_MENTAL * (composite_a.mentalRating - composite_b.mentalRating)
        + P_PHYSICAL * (composite_a.physicalRating - composite_b.physicalRating)
    )

    expected_a = 1 / (1 + math.pow(10, -rating_diff / ELO_SCALE))
    draw_probability = max(MIN_DRAW_PROB, BASE_DRAW_PROB - DRAW_SHRINK_RATE * abs(rating_diff))
    remaining = 1 - draw_probability

    win_a = remaining * expected_a
    win_b = remaining * (1 - expected_a)

    return WinProbabilityOutput(
        teamA=TeamOutcome(win=round(win_a, 3), draw=round(draw_probability, 3), loss=round(win_b, 3)),
        teamB=TeamOutcome(win=round(win_b, 3), draw=round(draw_probability, 3), loss=round(win_a, 3)),
    )
