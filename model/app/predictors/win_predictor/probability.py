"""두 팀의 rating을 win/draw/loss 확률로 변환."""
from app.schemas import WinProbabilityOutput

BASELINE_BIAS = 0.062
BASE_DRAW = 0.14


def ratings_to_output(rating_a: float, rating_b: float) -> WinProbabilityOutput:
    diff = rating_a - rating_b

    # shareA: relative strength share used by heuristic split
    if rating_a + rating_b > 0:
        share_a = max(0.0, rating_a) / (max(0.0, rating_a) + max(0.0, rating_b))
    else:
        share_a = 0.5

    # draw influenced by diff, anchored to base_draw
    draw = max(0.05, BASE_DRAW - min(0.1, abs(diff) * 0.0004))

    # remaining = 1 - draw; split by relative strength and apply bias (keeps original flow)
    remaining = 1.0 - draw
    win_a = remaining * share_a
    win_b = remaining * (1.0 - share_a)

    # apply baseline bias in the same place as original algorithm
    win_a = win_a + BASELINE_BIAS * (1.0 - draw)

    # renormalize
    total = win_a + win_b + draw
    if total <= 0:
        total = 1.0
    win_a /= total
    win_b /= total
    draw /= total

    # round to reasonable precision (keep 3 decimals for fraction stability)
    team_a_out = {
        "win": round(win_a, 3),
        "draw": round(draw, 3),
        "loss": round(win_b, 3),
    }
    team_b_out = {"win": round(win_b, 3), "draw": round(draw, 3), "loss": round(win_a, 3)}

    return WinProbabilityOutput(teamA=team_a_out, teamB=team_b_out)
