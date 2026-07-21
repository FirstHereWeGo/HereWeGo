"""
backend API. 승부 리와인드/골 장면 리와인드용 비즈니스 로직(seed 데이터, model 프록시)을 담당하며,
확률 계산 자체는 하지 않는다 (model 서비스가 유일한 계산 주체).
"""
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import formations, goal_rewind, match_simulation, scenarios, tactic, teams, win_probability

app = FastAPI()

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(teams.router)
app.include_router(formations.router)
app.include_router(tactic.router)
app.include_router(win_probability.router)
app.include_router(match_simulation.router)
app.include_router(scenarios.router)
app.include_router(goal_rewind.router)

MODEL_URL = os.environ.get("MODEL_URL", "http://localhost:8000")


@app.get("/health")
def health():
    return {"status": "ok"}


# model 서비스로 프록시하는 기존 예시 엔드포인트 - 신규 UI는 /api/xg/rewind를 사용하지만
# 하위 호환을 위해 그대로 유지한다.
@app.post("/api/xg")
async def calculate_xg(request: Request):
    body = await request.json()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{MODEL_URL}/xg", json=body)
            return response.json()
    except httpx.HTTPError as err:
        return JSONResponse(
            status_code=500,
            content={"error": "model 서비스 호출 실패", "detail": str(err)},
        )
