"""기존 스칼라 defenderCount 기반 xG 공식 - main.py에서 그대로 옮겨온 것, 로직 변경 없음."""
from app.schemas import ShotInput

GOAL_X, GOAL_Y = 105, 34


def calculate_xg_scalar(shot: ShotInput) -> float:
    distance = ((GOAL_X - shot.x) ** 2 + (GOAL_Y - shot.y) ** 2) ** 0.5

    distance_score = 1 / (1 + distance / 12)
    pressure_score = max(0, 1 - shot.defenderCount * 0.15)
    body_part_multiplier = 0.65 if shot.isHeader else 1.0

    xg = (0.6 * distance_score + 0.4 * pressure_score) * body_part_multiplier
    return round(min(max(xg, 0.01), 0.95), 3)
