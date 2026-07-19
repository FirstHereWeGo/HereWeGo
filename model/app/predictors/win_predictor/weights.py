"""팀 rating 계산에 쓰는 기본 휴리스틱 가중치."""

WEIGHTS = {
    "core_w": 2.25,  # pace/agility/strength/positioning 기본 가중치 (동일 비중)
    "finishing_attack_w": 2.1,
    "passing_mid_w": 2.1,
    "tackling_def_w": 2.1,
    "dribbling_w": 1.05,
    "passing_w": 1.35,
    "vision_w": 1.35,
    "tackling_w": 1.2,
    "marking_w": 1.2,
    "gk_w": 3.0,
    "foot_w": 0.12,  # 발(왼발/오른발) 능력치 1개당 가중치 (1..5)
    "mismatch_penalty": 12.0,
}
