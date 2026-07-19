"""팀 rating 계산에 쓰는 기본 휴리스틱 가중치."""

WEIGHTS = {
    "core_w": 3.0,  # pace/agility/strength/positioning 기본 가중치 (동일 비중)
    "finishing_attack_w": 2.8,
    "passing_mid_w": 2.8,
    "tackling_def_w": 2.8,
    "dribbling_w": 1.5,
    "passing_w": 1.65,
    "vision_w": 1.65,
    "tackling_w": 1.5,
    "marking_w": 1.5,
    "gk_w": 3.2,
    "foot_w": 0.15,  # 발(왼발/오른발) 능력치 1개당 가중치 (1..5)
    "mismatch_penalty_same_family": 14.0,
    "mismatch_penalty_adjacent_line": 34.0,
    "mismatch_penalty_wrong_role": 48.0,
}
