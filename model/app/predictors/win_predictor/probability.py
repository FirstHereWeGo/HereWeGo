"""두 팀의 rating을 win/draw/loss 확률로 변환."""
from app.schemas import WinProbabilityOutput

BASELINE_BIAS = 0.062
BASE_DRAW = 0.14


def ratings_to_output(rating_a: float, rating_b: float) -> WinProbabilityOutput:
    diff = rating_a - rating_b

    # shareA: 휴리스틱 분배에 쓰는 상대 전력 비율
    if rating_a + rating_b > 0:
        share_a = max(0.0, rating_a) / (max(0.0, rating_a) + max(0.0, rating_b))
    else:
        share_a = 0.5

    # 무승부 확률은 diff에 영향받되 base_draw를 기준으로 함
    draw = max(0.05, BASE_DRAW - min(0.1, abs(diff) * 0.0004))

    # remaining = 1 - draw; 상대 전력 비율로 나누고 bias 적용 (기존 흐름 유지)
    remaining = 1.0 - draw
    win_a = remaining * share_a
    win_b = remaining * (1.0 - share_a)

    # 기존 알고리즘과 동일한 위치에서 baseline bias 적용
    win_a = win_a + BASELINE_BIAS * (1.0 - draw)

    # 재정규화
    total = win_a + win_b + draw
    if total <= 0:
        total = 1.0
    win_a /= total
    win_b /= total
    draw /= total

    # 소수점 3자리로 반올림 (비율 안정성을 위해 유지)
    team_a_out = {
        "win": round(win_a, 3),
        "draw": round(draw, 3),
        "loss": round(win_b, 3),
    }
    team_b_out = {"win": round(win_b, 3), "draw": round(draw, 3), "loss": round(win_a, 3)}

    return WinProbabilityOutput(teamA=team_a_out, teamB=team_b_out)
