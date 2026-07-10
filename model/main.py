"""
xG(기대득점) 계산 등 모델 서비스 - 최소 예시 코드
실제 로직으로 교체해서 사용하세요.
"""
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class ShotInput(BaseModel):
    x: float
    y: float
    defenderCount: int = 0
    isHeader: bool = False


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/xg")
def calculate_xg(shot: ShotInput):
    goal_x, goal_y = 105, 34
    distance = ((goal_x - shot.x) ** 2 + (goal_y - shot.y) ** 2) ** 0.5

    distance_score = 1 / (1 + distance / 12)
    pressure_score = max(0, 1 - shot.defenderCount * 0.15)
    body_part_multiplier = 0.65 if shot.isHeader else 1.0

    xg = (0.6 * distance_score + 0.4 * pressure_score) * body_part_multiplier
    xg = min(max(xg, 0.01), 0.95)

    return {"xg": round(xg, 3)}
