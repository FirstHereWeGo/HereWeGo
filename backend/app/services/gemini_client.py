"""Gemini API 호출을 중앙화하는 httpx 래퍼. GEMINI_API_KEY/모델/타임아웃/에러 처리를 한 곳에서 관리한다."""
import os

import httpx
from fastapi import HTTPException

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
TIMEOUT_SECONDS = 30.0


async def generate_suggestion(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY가 설정되지 않았습니다")

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(
                GEMINI_URL,
                headers={"x-goog-api-key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
            response.raise_for_status()
            body = response.json()
    except httpx.HTTPError as err:
        raise HTTPException(status_code=502, detail=f"Gemini API 호출 실패: {err}") from err

    try:
        parts = body["candidates"][0]["content"]["parts"]
        return "".join(part.get("text", "") for part in parts).strip()
    except (KeyError, IndexError) as err:
        raise HTTPException(status_code=502, detail=f"Gemini 응답 파싱 실패: {body}") from err
