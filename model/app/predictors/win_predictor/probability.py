"""두 팀의 rating을 win/draw/loss 확률로 변환."""
import math

from app.schemas import WinProbabilityOutput

BASE_DRAW = 0.35  # rating이 동률일 때 무승부 확률 (실제 축구 무승부 비율 25~30%대 참고)
DRAW_FLOOR = 0.05  # 한쪽이 압도적으로 강해도 남겨두는 최소 무승부 확률
SCALE = 400.0  # rating 차이가 커질수록 확률이 갈리는 속도 (클수록 완만하게 갈림)
STYLE_FIT_SCALE = 100.0  # 전술 조정 합계를 0~100 적합도로 눌러 담는 폭


def style_fit(tactic_adjustment: float) -> int:
    """전술 조정치 합계를 배지용 0~100 적합도로 바꾼다 (조정 0 = 50점).

    apply_style() 하나만 쓰면 스타일 규칙이 안 걸리는 스쿼드에서 늘 50점이 나와
    두 팀을 구분하지 못한다. 그래서 style + 4개 섹션 조정치를 모두 합쳐
    "이 스쿼드가 지금 짜둔 전술 전체를 얼마나 소화하는가"를 점수로 만든다.
    """
    return round(50 + 50 * math.tanh(tactic_adjustment / STYLE_FIT_SCALE))


def ratings_to_output(
    rating_a: float,
    rating_b: float,
    penalties_a: list[str] | None = None,
    penalties_b: list[str] | None = None,
    extra_a: dict | None = None,
    extra_b: dict | None = None,
) -> WinProbabilityOutput:
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
        "penalties": penalties_a or [],
        **(extra_a or {}),
    }
    team_b_out = {
        "win": round(win_b, 3),
        "draw": round(draw, 3),
        "loss": round(win_a, 3),
        "penalties": penalties_b or [],
        **(extra_b or {}),
    }

    return WinProbabilityOutput(teamA=team_a_out, teamB=team_b_out)
