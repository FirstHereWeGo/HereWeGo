"""
벡터(위치+방향+속도) 및 수비 전술을 반영하는 골 장면 리와인드용 xG 공식.
기존 model/main.py의 distance_score 기반 휴리스틱을 확장한 것으로, 학습된 모델이 아니라
설명 가능한 손튜닝 공식이다 (스타일은 기존 공식과 동일하게 유지).
"""
import math

from app.formulas.attribute_index_map import compute_player_composite
from app.schemas import XgPositionsInput

GOAL_X, GOAL_Y = 105.0, 34.0
GOAL_HALF_WIDTH = 3.66
DISTANCE_DIVISOR = 12.0
REACTION_TIME_SEC = 0.4
COVERAGE_RADIUS_M = 8.0
NEARBY_RADIUS_M = 15.0
SHAPE_COMPACTNESS_PENALTY = {"narrow": 0.05, "normal": 0.0, "wide": -0.05}
BODY_PART_MULTIPLIER_HEADER = 0.65


def _clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def _distance(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.hypot(x2 - x1, y2 - y1)


def _distance_score(x: float, y: float) -> float:
    d = _distance(x, y, GOAL_X, GOAL_Y)
    return 1 / (1 + d / DISTANCE_DIVISOR)


def _angle_score(x: float, y: float) -> float:
    post1 = (GOAL_X, GOAL_Y - GOAL_HALF_WIDTH)
    post2 = (GOAL_X, GOAL_Y + GOAL_HALF_WIDTH)
    a1 = math.atan2(post1[1] - y, post1[0] - x)
    a2 = math.atan2(post2[1] - y, post2[0] - x)
    angle = abs(a1 - a2)
    if angle > math.pi:
        angle = 2 * math.pi - angle
    return _clamp(angle / (math.pi / 2))


def _orientation_multiplier(x: float, y: float, direction_deg: float) -> float:
    dir_rad = math.radians(direction_deg)
    dir_vec = (math.cos(dir_rad), math.sin(dir_rad))
    to_goal = (GOAL_X - x, GOAL_Y - y)
    norm = math.hypot(*to_goal) or 1.0
    to_goal_unit = (to_goal[0] / norm, to_goal[1] / norm)
    dot = dir_vec[0] * to_goal_unit[0] + dir_vec[1] * to_goal_unit[1]
    return 0.75 + 0.30 * ((dot + 1) / 2)


def _speed_multiplier(speed_kmh: float) -> float:
    if speed_kmh <= 15:
        return 1.0
    if speed_kmh <= 25:
        return 1.0 - 0.08 * ((speed_kmh - 15) / 10)
    return max(0.85, 0.92 - 0.07 * ((speed_kmh - 25) / 10))


def _point_to_segment_distance(px: float, py: float, ax: float, ay: float, bx: float, by: float) -> float:
    abx, aby = bx - ax, by - ay
    seg_len_sq = abx * abx + aby * aby
    if seg_len_sq == 0:
        return _distance(px, py, ax, ay)
    t = max(0.0, min(1.0, ((px - ax) * abx + (py - ay) * aby) / seg_len_sq))
    proj_x, proj_y = ax + t * abx, ay + t * aby
    return _distance(px, py, proj_x, proj_y)


def _pressure_score(shooter_x: float, shooter_y: float, defenders, defensive_line_height: float,
                     pressing_intensity: float, defensive_shape: str) -> float:
    threats: list[tuple[float, float]] = []
    for d in defenders:
        speed_mps = d.vector.speed / 3.6
        dir_rad = math.radians(d.vector.directionDeg)
        proj_x = d.vector.x + speed_mps * REACTION_TIME_SEC * math.cos(dir_rad)
        proj_y = d.vector.y + speed_mps * REACTION_TIME_SEC * math.sin(dir_rad)
        perp_dist = _point_to_segment_distance(proj_x, proj_y, shooter_x, shooter_y, GOAL_X, GOAL_Y)
        defending_rating = compute_player_composite(d.player).defendingRating
        threat = (defending_rating / 100) * (1 / (1 + perp_dist / COVERAGE_RADIUS_M))
        dist_from_shooter = _distance(d.vector.x, d.vector.y, shooter_x, shooter_y)
        threats.append((dist_from_shooter, threat))

    if not threats:
        nearest_threat, density_threat = 0.0, 0.0
    else:
        nearest_threat = max(t for _, t in threats)
        nearby = [t for dist, t in threats if dist < NEARBY_RADIUS_M]
        density_threat = sum(nearby) / len(nearby) if nearby else 0.0

    # 위협도가 1에 가까워도(수비수가 슛 라인 위에 정확히 있어도) 0으로 수렴만 할 뿐 끊기지 않도록
    # 감산이 아닌 점근적(1/(1+x)) 감쇠를 사용한다.
    pressure_raw = 0.7 * nearest_threat + 0.3 * density_threat
    score = 1 / (1 + 2.0 * pressure_raw)

    dl = defensive_line_height / 100
    pi_ = pressing_intensity / 100
    shape_penalty = SHAPE_COMPACTNESS_PENALTY.get(defensive_shape, 0.0)
    tactic_multiplier = max(0.5, 1 + 0.15 * dl - 0.3 * pi_ - shape_penalty)
    return _clamp(score * tactic_multiplier)


def calculate_xg_vector(payload: XgPositionsInput) -> float:
    shooter_x, shooter_y = payload.shooter.vector.x, payload.shooter.vector.y

    distance_score = _distance_score(shooter_x, shooter_y)
    angle_score = _angle_score(shooter_x, shooter_y)
    positional_score = 0.6 * distance_score + 0.4 * angle_score

    orientation_multiplier = _orientation_multiplier(shooter_x, shooter_y, payload.shooter.vector.directionDeg)
    speed_multiplier = _speed_multiplier(payload.shooter.vector.speed)

    pressure_score = _pressure_score(
        shooter_x, shooter_y, payload.defenders,
        payload.defensiveLineHeight, payload.pressingIntensity, payload.defensiveShape,
    )

    shooter_composite = compute_player_composite(payload.shooter.player)
    technical_multiplier = 0.8 + 0.4 * (shooter_composite.attackingRating / 100)
    body_part_multiplier = BODY_PART_MULTIPLIER_HEADER if payload.shooter.isHeader else 1.0

    xg = (
        positional_score
        * orientation_multiplier
        * speed_multiplier
        * pressure_score
        * technical_multiplier
        * body_part_multiplier
    )
    return round(min(max(xg, 0.01), 0.95), 3)
