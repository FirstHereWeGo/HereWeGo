"""두 팀의 rating을 win/draw/loss 확률로 변환."""
import math

from app.schemas import WinProbabilityOutput

BASE_DRAW = 0.35  # rating이 동률일 때 무승부 확률 (실제 축구 무승부 비율 25~30%대 참고)
DRAW_FLOOR = 0.05  # 한쪽이 압도적으로 강해도 남겨두는 최소 무승부 확률
SCALE = 400.0  # rating 차이가 커질수록 확률이 갈리는 속도 (클수록 완만하게 갈림)


def ratings_to_output(rating_a: float, rating_b: float) -> WinProbabilityOutput:
    diff = rating_a - rating_b
    strength = math.tanh(diff / SCALE)  # -1..1, diff=0이면 0 (완전 동률)

    # rating 차이가 벌어질수록 무승부 확률이 BASE_DRAW에서 DRAW_FLOOR로 줄어듦
    draw = DRAW_FLOOR + (BASE_DRAW - DRAW_FLOOR) * (1 - abs(strength))

    # 무승부를 제외한 나머지를 strength 비율로 대칭 분배 (diff=0이면 0.5/0.5)
    remaining = 1.0 - draw
    win_a = remaining * (0.5 + strength / 2)
    win_b = remaining * (0.5 - strength / 2)

    # 소수점 3자리로 반올림 (비율 안정성을 위해 유지)
    team_a_out = {
        "win": round(win_a, 3),
        "draw": round(draw, 3),
        "loss": round(win_b, 3),
    }
    team_b_out = {"win": round(win_b, 3), "draw": round(draw, 3), "loss": round(win_a, 3)}

    return WinProbabilityOutput(teamA=team_a_out, teamB=team_b_out)
