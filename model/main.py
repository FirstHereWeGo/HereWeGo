"""
xG(기대득점) 및 승률 계산 모델 서비스.
composite index 계산(속성->합성등급, 전술->지표)과 확률 공식은 app/formulas 안에만 존재한다.
"""
from fastapi import FastAPI

from app.routers import win_probability, xg

app = FastAPI()

app.include_router(xg.router)
app.include_router(win_probability.router)


@app.get("/health")
def health():
    return {"status": "ok"}
