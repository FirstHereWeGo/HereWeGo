"""팀 rating 계산에 쓰는 기본 휴리스틱 가중치."""

WEIGHTS = {
    "core_w": 1.5,  # pace/agility/strength/positioning 기본 가중치 (동일 비중)
    "finishing_attack_w": 1.4,
    "passing_mid_w": 1.4,
    "tackling_def_w": 1.4,
    "dribbling_w": 0.75,
    "passing_w": 0.825,
    "vision_w": 0.825,
    "tackling_w": 0.75,
    "marking_w": 0.75,
    "gk_w": 1.6,
    "foot_w": 0.075,  # 발(왼발/오른발) 능력치 1개당 가중치 (1..5)
}
