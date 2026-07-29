# HereWeGo — 환경/API 설정 요약

AI에게 이 프로젝트 컨텍스트를 처음 전달할 때 쓰는 문서. 아래 내용은 실제 코드를 읽고 검증한 현재 상태 기준이다.

## 1. 환경 구조 (컨테이너 3개)

`docker-compose.yml`(prod) / `docker-compose.dev.yml`(dev, hot-reload)로 3개 서비스를 띄운다. 셋 다 `herewego-net`이라는 외부 도커 네트워크를 공유한다.

| 서비스 | 기술스택 | 포트 | 컨테이너명(dev) | 역할 |
|---|---|---|---|---|
| `frontend` | Vite + React 19 + Three.js | 5173 | `frontend_dev` | 사용자 입력(전술/스탯/포메이션 조작), 3D 피치 렌더링 |
| `backend` | FastAPI (Python) | 4000 | `backend_dev` | 데이터 조회/정제 + model 프록시. **계산은 하지 않는다** |
| `model` | FastAPI (Python) | 8000 | `model_dev` | 실제 확률 계산 (xG, 승률). 원칙상 **계산만** 하고 데이터 저장/조회는 하지 않는다 |

각 서비스는 독립된 도커 빌드 컨텍스트(`./frontend`, `./backend`, `./model`)를 가진 **완전히 분리된 컨테이너**다 — 서로의 파일시스템에 접근 불가능하다. 서버 간 통신은 도커 네트워크 안의 서비스명으로 이루어진다 (예: backend에서 model 호출 시 `http://model:8000`, `MODEL_URL` 환경변수로 주입).

### 데이터 흐름 (설계 원칙)

```
frontend (사용자 입력)
   │  브라우저 → backend, HTTP (CORS)
   ▼
backend (데이터 정제/조회)
   - teamId → 실제 로스터(Player[]) 조회 (app/data/teams.py)
   - formationId → 포메이션 슬롯 조회 (app/data/formations.py)
   - playerOverrides 적용 (스탯/나이 덮어쓰기)
   - 결과를 JSON으로 정리
   │  서버 → 서버, Docker 네트워크 내부
   ▼
model (계산 전용)
   - backend가 보낸 JSON을 그대로 feature로 변환
   - 확률/지표 계산 (xG, 승/무/패)
   - 결과 JSON 반환
   │
   ▼
backend → frontend (결과 그대로 전달)
```

**핵심 원칙**: model은 자체 데이터 저장소가 없고, 매 요청마다 backend가 보내주는 JSON에만 의존해야 한다. backend는 seed 데이터 조회/정제와 model 프록시만 하고 확률 계산 로직을 갖지 않는다. frontend는 backend만 호출하고 model을 직접 호출하지 않는다.

---

## 2. API 목록 (backend 기준, frontend는 이것만 호출)

### 조회용 (seed 데이터 그대로 반환, 계산 없음)

| Method | Path | 반환 | 데이터 출처 |
|---|---|---|---|
| GET | `/health` | `{"status": "ok"}` | - |
| GET | `/api/teams` | `list[Team]` (팀별 26명 로스터) | `app/data/teams.py` — 한국(`kor`)/남아공(`rsa`) 실제 데이터 있음 |
| GET | `/api/players/presets` | `list[PlayerPreset]` | `app/data/player_presets.py` — 현재 비어있음 |
| GET | `/api/formations` | `list[Formation]` (포메이션 22종, 백3/4/5) | `app/data/formations.py` |
| GET | `/api/tactics` | `list[TeamTacticPreset]` (팀별 기본 포메이션+선발11+전술) | `app/data/tactic.py` — 한국(3-4-3)/남아공(4-2-3-1) 있음 |
| GET | `/api/scenarios/goal` | `list[GoalScenario]` | `app/data/goal_scenarios.py` — 현재 비어있음 |

### 계산용 (backend → model 프록시)

| Method | Path | model 쪽 엔드포인트 | 설명 | 현재 상태 |
|---|---|---|---|---|
| POST | `/api/win-probability` | `POST /win-probability` | 팀A/B의 `teamId`+`startingXI`(formationId/goalkeeperId/playerIds)+`tacticConfig`+`playerOverrides`를 받아 실제 선수 데이터로 조합 후 model에 전달, 승/무/패 반환 | model이 휴리스틱 계산을 하도록 바뀐 상태 (원래는 `NotImplementedError` 스텁이었음, §1 참고) |
| POST | `/api/xg/rewind` | `POST /xg/positions` | 슈터/수비수/골키퍼 벡터 + 수비 전술 → 실점확률(xG) | model이 `NotImplementedError` 스텁, 항상 500 |
| POST | `/api/xg` | `POST /xg` | (레거시) 스칼라 `defenderCount` 기반 xG, 하위호환용 | `model/app/formulas/xg.py`의 손튜닝 공식으로 실제 계산됨 |

### backend 내부 처리 (`app/routers/win_probability.py::_resolve_team`)

1. `teamId`로 팀 조회 (없으면 404)
2. `startingXI.formationId`로 포메이션 조회 (없으면 404)
3. `startingXI.playerIds` 개수가 포메이션 슬롯 수와 다르면 400
4. `startingXI.goalkeeperId` / `playerIds`로 팀 로스터에서 실제 `Player` 객체를 찾음 (없으면 400)
5. `playerOverrides`(선수별 스탯/나이 덮어쓰기)를 적용
6. `{goalkeeper, players(10, 포메이션 슬롯 순서), formation, tacticConfig}` 형태로 model에 전달

model 쪽 `TeamMatchInput` 스키마도 이와 동일한 필드명을 쓰도록 손으로 미러링돼 있다 (자동 동기화 아님 — backend `app/schemas/*.py`를 바꾸면 `model/app/schemas.py`도 같이 바꿔야 함).

---

## 3. 핵심 스키마

- **Player**: `id, name, positions: list[Position], age, height, leftFoot, rightFoot, attributes`. `Position = "GK"|"CB"|"FB"|"WB"|"DM"|"CM"|"AM"|"WG"|"ST"`. `positions`는 리스트라 선수 한 명이 여러 포지션을 가질 수 있음. `attributes`는 GK면 `GoalkeepingBlock{overall}`, 아니면 `AttributeBlock`(10개 스탯: pace/agility/strength/finishing/dribbling/passing/vision/positioning/tackling/marking, 1~20).
- **Formation**: `id, name, positions: list[Position]` — GK 제외 필드 10명, 오른쪽부터 수비→미드필드→공격 순, 각 라인은 오른쪽→왼쪽.
- **TacticConfig**: FM 스타일 5섹션(`style`, `inPossession`, `opponentHalf`, `transitions`, `outOfPossession`) 그대로 미러링.
- **TeamTacticPreset**: `teamId, formationId, goalkeeperId, startingPlayerIds, tacticConfig` — 팀 선택 시 기본으로 깔리는 값.

---

## 4. 참고

- `backend/dev/`에 `/api/win-probability` 수동 테스트용 샘플 payload(`win_probability_sample.json`)와 실행 스크립트(`test_win_probability.py`)가 있음. 컨테이너 안에서 `python dev/test_win_probability.py`로 실행.
- frontend(`frontend/src/`)는 이제 backend API와 연동돼 있다 (`src/api/client.js`). `GameContext.jsx`가 앱 로드 시 `/api/teams`+`/api/formations`+`/api/tactics`로 로스터/포메이션/기본 전술 프리셋을 받아와 상태를 구성하고, `TacticalBoard.jsx`가 "승률 계산" 버튼을 누를 때만 `/api/win-probability`를 호출한다(자동 재계산 없음 — 경기 중 라이브 시뮬레이션이 아니라 프리매치 스쿼드/전술 편집 도구이기 때문). 화면은 "포메이션"(로스터·라인업·3D 피치)과 "전술"(`TacticConfig` 5개 섹션 전체를 노출하는 상세 폼, `TacticsPanel.jsx`) 두 탭으로 분리돼 있다. 예전에 있던 `frontend/src/engine/`(로컬 xG/매치 시뮬레이션)과 `frontend/src/data/squad.js`(mock 로스터)는 삭제됐다. `/api/xg/rewind`가 여전히 스텁이라 장면별 xG나 라이브 매치 재현 기능은 프론트에 없다.
- 루트의 `PROJECT_STATUS.md`는 과거 스냅샷(Next.js 프론트 기준 등)이라 현재 상태와 다른 부분이 있으니 참고할 때 주의.
