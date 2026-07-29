"""model 서비스 호출을 중앙화하는 httpx 래퍼. MODEL_URL/타임아웃/에러 처리를 한 곳에서 관리한다."""
import os

import httpx
from fastapi import HTTPException

MODEL_URL = os.environ.get("MODEL_URL", "http://localhost:8000")
TIMEOUT_SECONDS = 10.0


async def _post(path: str, payload: dict) -> dict:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(f"{MODEL_URL}{path}", json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as err:
        raise HTTPException(status_code=502, detail=f"model 서비스 호출 실패 ({path}): {err}") from err


async def call_xg_positions(payload: dict) -> dict:
    return await _post("/xg/positions", payload)


async def call_win_probability(payload: dict) -> dict:
    return await _post("/win-probability", payload)


async def call_match_simulation(payload: dict) -> dict:
    return await _post("/match-simulation", payload)


async def call_match_stats(payload: dict) -> dict:
    return await _post("/match-stats", payload)
