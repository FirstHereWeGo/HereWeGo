"""
backend API - 최소 예시 코드
실제 API 로직으로 교체해서 사용하세요.
"""
import os

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

MODEL_URL = os.environ.get("MODEL_URL", "http://localhost:8000")


@app.get("/health")
def health():
    return {"status": "ok"}


# model 서비스로 프록시하는 예시
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
