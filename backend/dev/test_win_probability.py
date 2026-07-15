"""
POST /api/win-probability 수동 테스트 스크립트.

컨테이너 안에서 실행: docker exec backend_dev python dev/test_win_probability.py
요청 body는 win_probability_sample.json을 수정해서 바꾸면 된다.
"""
import json
import pathlib

import httpx

SAMPLE_PATH = pathlib.Path(__file__).parent / "win_probability_sample.json"
BACKEND_URL = "http://localhost:4000/api/win-probability"

payload = json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))
response = httpx.post(BACKEND_URL, json=payload, timeout=10)
print(response.status_code)
print(json.dumps(response.json(), indent=2, ensure_ascii=False))
