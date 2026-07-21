"""매치 시뮬레이션(득점 수 샘플링)에 쓰는 상수."""

AVG_GOALS_PER_TEAM = 1.35  # rating이 동률일 때 팀당 기대 득점 (실제 A매치 평균 참고)
STRENGTH_SWING = 0.9  # strength(-1..1)가 기대 득점에 미치는 배율
MIN_LAMBDA = 0.15  # 압도적으로 약한 팀도 득점 기대값이 0에 붙지 않도록 하는 하한
