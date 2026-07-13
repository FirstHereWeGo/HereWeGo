# HereWeGo — 현재 구현 상태

## 개요

backend/model/frontend 3개 서비스의 코드를 전부 구현 완료했다. model 서비스는 실제로 실행해서 공식이 방향성 있게 동작하는지 검증했고(수비수가 많을수록/압박이 강할수록 xG 하락, 팀 능력치가 높을수록 승률 상승 등), backend도 model과 실제 HTTP로 통신시켜 라우터/스키마/오버라이드 로직을 검증했다. 프론트엔드는 아직 실제 빌드 검증 전이라 팀원이 직접 `docker-compose`로 빌드해서 확인해야 한다.

이 문서는 "지금 뭐가 이미 만들어져 있고, 무엇을 채워 넣어야 하는지, 데이터/API 형태가 어떤지"를 팀원과 공유하기 위한 현재 상태 스냅샷이다.

---

## 지금 당장 해야 할 일 (TL;DR)

코드(프론트/백엔드/모델)는 이미 다 짜여 있다. **남은 건 대부분 데이터 입력이다.**

| 파일 | 채워야 할 내용 | 형식 |
|---|---|---|
| `backend/app/data/teams.py` | 국가대표팀 로스터 (선발 11명 기준, 팀 2개 이상) | `TEAMS: list[Team]` 에 항목 추가 |
| `backend/app/data/goal_scenarios.py` | 골 장면 시나리오 2~4개 | `GOAL_SCENARIOS: list[GoalScenario]` 에 항목 추가 |
| `backend/app/data/player_presets.py` | 레전드 프리셋 (전성기 메시, 호날두) | `PRESETS: list[PlayerPreset]` 에 항목 추가 |

세 파일 모두 지금은 빈 리스트(`[]`)이고, 파일 상단에 실제로 채워 넣을 때 참고할 예시 딕셔너리 형태를 주석으로 남겨뒀다. 데이터를 채우면 코드 수정 없이 바로 API에 반영된다 (GET 엔드포인트가 그 리스트를 그대로 반환).

⚠ **`/api/xg/rewind`(골 리와인드), `/api/win-probability`(승부 리와인드) 계산 엔드포인트는 지금 항상 에러(500/502)를 반환합니다 — 의도된 상태입니다.** 실제 학습된 모델을 팀원이 만들어서 넣기 전까지는 계산 결과를 낼 수 없도록 일부러 막아뒀습니다 (자세한 건 아래 "학습된 모델 연결하는 방법" 참고). `/api/teams`, `/api/scenarios/goal` 같은 조회 엔드포인트와 프론트 UI 자체는 정상 동작합니다.

그 외 남은 일:
- 프론트엔드 실 빌드/타입체크 확인 (`docker-compose -f docker-compose.dev.yml up --build` 후 브라우저 확인)
- 데이터가 들어간 뒤 실제 화면에서 슬라이더/드래그를 조작했을 때 (계산 자체는 아직 에러가 나더라도) UI 흐름이 정상인지 확인
- (다른 환경에서 모델 훈련 중인 팀원) 훈련 끝나면 `model/app/ml/`에 아티팩트 넣고 `model/app/predictors/*.py`의 `predict_xg()` / `predict_win_probability()` 채우기 — 자세한 절차는 아래 "학습된 모델 연결하는 방법" 섹션 참고

---

## 폴더 구조

```
c:\HereWeGo/
├── docker-compose.yml / docker-compose.dev.yml   # 프론트 3000 / 백엔드 4000 / 모델 8000
├── frontend/                                      # Next.js 14 (App Router, TS, Tailwind)
│   ├── app/
│   │   ├── page.tsx            # 랜딩 (헬스체크 + 2개 기능 링크)
│   │   ├── tactics/page.tsx    # 승부 뒤집기 리와인드 (기능1+3 통합)
│   │   └── rewind/page.tsx     # 골 장면 리와인드 (기능2)
│   ├── components/
│   │   ├── pitch/               # PitchBoard(SVG 피치), PlayerDot(점만), VectorPlayerToken(점+방향+속도 화살표)
│   │   ├── tactics/TacticPanel.tsx   # FM 4섹션 전술 패널 전체
│   │   ├── roster/               # PlayerCard, StatEditor(속성 편집), PresetPicker(레전드 원클릭)
│   │   └── scenarios/ScenarioPicker.tsx
│   ├── lib/api.ts               # fetch 래퍼 (getTeams, postWinProbability, getGoalScenarios, postXgRewind 등)
│   └── types/api.ts             # backend 스키마와 1:1 대응하는 TS 타입 (여기가 "타입 사전" 역할)
├── backend/                                       # FastAPI — 비즈니스 로직 + model 프록시, 계산은 안 함
│   ├── main.py                  # CORS, 라우터 include, /health, 레거시 /api/xg
│   └── app/
│       ├── routers/              # teams, win_probability, scenarios, goal_rewind
│       ├── schemas/               # player.py, tactic.py, scenarios.py, win_probability.py
│       ├── data/                  # ⚠ teams.py / goal_scenarios.py / player_presets.py — 지금 비어있음
│       └── services/model_client.py   # model 호출 중앙화 (httpx, MODEL_URL, 에러처리)
└── model/                                         # FastAPI — 확률 계산의 유일한 주체 (학습된 모델 연결 예정, 지금은 미연결)
    ├── main.py                  # /health, 라우터 include
    └── app/
        ├── routers/               # xg.py (기존 /xg + 신규 /xg/positions), win_probability.py
        ├── schemas.py             # Pydantic 모델 전체
        ├── predictors/            # ⚠ 라우터가 실제로 호출하는 곳 — 학습된 모델 연결 지점 (아래 별도 설명)
        │   ├── xg_predictor.py           # predict_xg() — 지금은 NotImplementedError만 던지는 자리표시자
        │   └── win_predictor.py          # predict_win_probability() — 지금은 NotImplementedError만 던지는 자리표시자
        ├── ml/                    # 학습된 모델 아티팩트(.joblib 등) 놓는 곳, 지금은 비어있음
        └── formulas/
            └── xg.py                    # 기존 스칼라 defenderCount 공식, 레거시 /xg 엔드포인트가 계속 사용 중 (유일하게 남은 파일)
```

**설계 원칙**: frontend는 backend만 호출(브라우저 직접, cross-origin), backend는 model만 호출(서버간, Docker 네트워크). 확률 계산(승률/xG)은 **model 안에서만** 일어나고, backend는 seed 데이터 조회 + model 프록시만 한다. frontend는 "수정 전 1번 + 수정 후 1번" 두 번 호출해서 그 차이를 화면에서 직접 계산해 보여준다 (서버가 baseline을 따로 저장하지 않음 — 나중에 공식 상수를 튜닝해도 baseline이 안 꼬임).

---

## API 목록

| Method | Path | 담당 | 설명 |
|---|---|---|---|
| GET | `/health` | backend, model | 상태 확인 |
| GET | `/api/teams` | backend | 등록된 팀(로스터) 목록 |
| GET | `/api/players/presets` | backend | 레전드 프리셋 목록 |
| POST | `/api/win-probability` | backend → model `/win-probability` | 승부 리와인드 계산 (팀A/B 로스터+오버라이드+전술 → 승/무/패) |
| GET | `/api/scenarios/goal` | backend | 골 장면 시나리오 목록 |
| POST | `/api/xg/rewind` | backend → model `/xg/positions` | 골 리와인드 계산 (슈터/수비수 벡터+수비전술 → 실점확률) |
| POST | `/api/xg` | backend → model `/xg` | (레거시) 스칼라 defenderCount 기반, 하위호환용으로 유지 |

프론트는 이 중 backend 엔드포인트만 호출한다 (`frontend/lib/api.ts` 참고). model의 `/xg/positions`, `/win-probability`는 backend만 호출한다.

---

## 입력 데이터 구조

### Player (선수 1명)
```
{
  id: string, name: string,
  position: "GK" | "CB" | "FB" | "WB" | "DM" | "CM" | "AM" | "WG" | "ST",
  age: number,
  attributes: AttributeBlock | GoalkeepingBlock   // position이 GK면 GoalkeepingBlock
}
```
- **AttributeBlock** (필드선수, 값 1~20 정수 10개, FM 전체 속성에서 간소화됨): pace(주력), agility(민첩성), strength(몸싸움), finishing(골결정력), dribbling(드리블), passing(패스), vision(시야), positioning(위치선정), tackling(태클), marking(일대일 마크)
- **GoalkeepingBlock** (GK): 세부 스탯 없이 overall(종합 능력치) 1개만 사용, 값 1~20

### Team (로스터)
```
{ id: string, name: string, players: Player[] }   // 선발 11명부터 (배열 길이 제한 없음)
```

### TacticConfig (전술, FM 4섹션 그대로)
```
{
  style: { tacticStyle: string, approach: string },
  inPossession: { attackingWidth, buildupStyle, overlapLeft/Right, targetCentral/Wide, buildFromBack, passingDirectness, tempo, timeWasting },
  opponentHalf: { crossingApproach, playCalmly, earlyCrosses, dontHoldBack, exploitSetPieces, dribbleMore, playForFreedom },
  transitions: { pressAfterLoss, counterAfterWin, gkDistributeQuick, distributionMethod },
  outOfPossession: { defensiveShape, pressingIntensity, pressingLine, tackling, defensiveLineHeight, offsideTrap, allowCrosses }
}
```
프론트 기본값은 `frontend/types/api.ts`의 `defaultTacticConfig()` 참고.

### PlayerVector (골 장면용, 위치+방향+속도)
```
{ x: number, y: number, directionDeg: number, speed: number }   // 피치 105x68m, 골 중앙 (105, 34)
```

### GoalScenario (골 장면 시나리오)
```
{
  id, name,
  shooter: { player: Player, vector: PlayerVector, isHeader: boolean },
  defenders: [{ player: Player, vector: PlayerVector }],
  goalkeeper: { player: Player, vector: PlayerVector } | null,
  defendingTacticSubset: { pressingIntensity, defensiveLineHeight, defensiveShape: "narrow"|"normal"|"wide" }
}
```

### PlayerPreset (레전드 프리셋)
```
{ id, label, age, attributes: AttributeBlock }
```

---

## 요청 흐름 (사용자가 전술을 바꾸면 실제로 일어나는 일)

### 승부 뒤집기 리와인드 (전술/스탯 변경 → 승률)

1. **프론트**: `app/tactics/page.tsx`에서 사용자가 `TacticPanel`의 슬라이더/토글을 바꾸면 `tacticA` state(React state)가 바뀜. 선수 스탯을 바꾸면 `overridesA`(PlayerOverride 배열)가 바뀜.
2. **프론트 → 백엔드**: 바뀐 값들을 담아 `POST /api/win-probability` 호출 — body: `{ teamA: { teamId, tacticConfig: tacticA, playerOverrides: overridesA }, teamB: { teamId, tacticConfig: 기본값, playerOverrides: [] } }`. TacticConfig/PlayerOverride 전체가 JSON으로 그대로 전송됨.
3. **백엔드**: `teamId`로 `backend/app/data/teams.py`의 `TEAMS`에서 실제 로스터(Player 배열)를 찾고, `playerOverrides`에 있는 선수는 속성/나이를 덮어씀 → 완성된 `players: Player[]` + 전달받은 `tacticConfig`를 그대로 묶어서 model용 payload 구성 (`app/routers/win_probability.py`의 `_resolve_team`).
4. **백엔드 → 모델**: `model_client.call_win_probability(payload)`가 `POST /win-probability`로 서버 간 호출 (Docker 네트워크 안에서 `http://model:8000`, `MODEL_URL` 환경변수 사용).
5. **모델**: 라우터가 `predictors/win_predictor.py`의 `predict_win_probability()`를 호출 → **지금은 학습된 모델이 아직 연결 안 돼서 여기서 `NotImplementedError`가 발생, 500 에러 반환** (의도된 상태, 아래 "학습된 모델 연결하는 방법" 참고). 이 지점에 실제 모델이 들어가면 위 1~4번, 6~7번은 그대로고 5번만 실제 예측으로 채워진다.
6. **백엔드 → 프론트**: 모델이 500을 반환하면 backend의 `model_client.py`가 502로 감싸서 프론트에 전달 (`model 서비스 호출 실패` 메시지).
7. **프론트**: 팀 선택 직후 저장해둔 baseline(기본 전술/스탯 기준 결과)과 방금 받은 결과를 비교해서 `%p` 차이를 화면에 표시.

### 골 장면 리와인드 (수비수 위치/방향/속도, 수비 전술 변경 → 실점확률)

같은 구조이며 경로만 다르다: 프론트가 `POST /api/xg/rewind`로 슈터/수비수 벡터 + `defendingTacticSubset`을 보내면, 백엔드가 그대로 모델의 `POST /xg/positions`로 중계한다. 모델의 `predict_xg()`도 아직 학습된 모델이 없어서 마찬가지로 500을 반환한다 (의도된 상태).

**핵심**: 계산에 필요한 원본 데이터(선수 속성 전체, 전술 컨트롤 전체)는 항상 프론트 → 백엔드 → 모델까지 그대로 전달되도록 설계되어 있다. 실제 feature 변환/추론은 모델 안 `predictors/*.py`에서만 일어나므로, 나중에 그 로직을 채우거나 바꿔도 백엔드/프론트 코드는 건드릴 필요가 없다.

---

## 출력 데이터 구조

### WinProbabilityResponse
```
{ teamA: {win, draw, loss}, teamB: {win, draw, loss} }   // 0~1 사이 값, 각 팀 win+draw+loss = 1
```

### XgRewindResponse
```
{ concedeProbability: number }   // 0.01~0.95
```

---

## 계산 로직이 어디 있는지

**지금 실제로 호출되는 곳은 `model/app/predictors/xg_predictor.py`, `win_predictor.py` 딱 두 곳뿐이다.** 둘 다 아직 학습된 모델이 없어서 `NotImplementedError`만 던지는 자리표시자 상태다 (`/api/xg/rewind`, `/api/win-probability`가 지금 항상 실패하는 이유).

`model/app/formulas/`에 있던 손튜닝 휴리스틱 공식(`xg_vector.py`, `win_probability.py`, `attribute_index_map.py`, `tactic_index_map.py`)은 삭제했다. 이건 원래 속성이 36개일 때 사람이 감당 가능한 수준(합성등급 몇 개)으로 압축하려고 만든 장치였는데, 최종적으로 학습된 모델을 쓰기로 한 데다 스탯도 10개로 줄어서 더 이상 의미가 없어졌다 — **학습된 모델은 압축된 합성등급이 아니라 10개 원본 스탯을 그대로 입력받아 스스로 가중치를 학습하는 게 맞다.** 스칼라 defenderCount 기반의 레거시 `formulas/xg.py`만 예외로 남아있고, `/xg`(레거시 엔드포인트)에서 여전히 쓰인다.

---

## 학습된 모델 연결하는 방법 (다른 환경에서 훈련한 팀원용)

훈련은 다른 환경(팀원 로컬 등)에서 진행하고, 결과물만 이 저장소에 가져와 끼워 넣는 구조로 껍데기를 만들어뒀다.

**라우터는 `app/predictors/*`만 호출한다.** 이 두 함수가 실제 계산이 시작되는 유일한 지점이다.

- `model/app/predictors/xg_predictor.py` — `predict_xg(payload)` : 라우터(`app/routers/xg.py`)가 부르는 함수.
- `model/app/predictors/win_predictor.py` — `predict_win_probability(payload)` : 라우터(`app/routers/win_probability.py`)가 부르는 함수.

**연결 절차**:
1. 학습된 모델 파일(`.joblib` 등)을 `model/app/ml/`에 넣는다 (`model/app/ml/README.md` 참고).
2. 위 두 함수 안의 TODO(지금은 `NotImplementedError`만 던짐)를 채운다 — `_load_model()`로 모델 로드 → payload를 모델이 기대하는 feature로 변환 → `model.predict()` → 지금 쓰는 응답 형태(`float` 또는 `WinProbabilityOutput`)로 변환해서 반환. **feature 변환 시 선수 속성을 attacking/defending 같은 합성등급으로 미리 압축하지 말고 10개 원본 스탯(GK는 overall 1개)을 그대로 넣을 것** — 압축은 모델이 학습 과정에서 스스로 하는 거지, 우리가 미리 정해줄 이유가 없다.

이걸로 끝이다 — 별도 환경변수나 모드 전환 스위치는 없다. 함수 안의 `NotImplementedError`를 실제 코드로 바꾸는 순간 바로 반영된다.

**입력/출력 형태가 훈련된 모델과 다르다면?** `app/schemas.py`의 `XgPositionsInput`/`WinProbabilityInput`/`WinProbabilityOutput`과 위 predictor 함수 시그니처만 같이 바꾸면 된다. 라우터(`app/routers/*.py`)나 backend, frontend는 이 스키마를 그대로 프록시/타입 미러링만 하고 있어서, predictors 레이어 밖으로는 영향이 퍼지지 않도록 설계해뒀다 — 단, 필드가 바뀌면 backend의 `app/schemas/*.py`와 frontend의 `types/api.ts`도 같은 필드명으로 맞춰줘야 한다 (지금은 세 서비스가 완전히 동일한 필드명을 쓰도록 손으로 미러링되어 있음, 자동 동기화 아님).

두 predictor 파일 모두 로컬에서 실제로 500 에러가 나는 것까지 확인 완료 (모델 미연결 상태에서 정상적인 동작), 레거시 `/xg` 엔드포인트는 영향 없이 그대로 동작하는 것도 확인함.

---

## 검증 방법 (팀원이 진행)

1. Docker Desktop 실행 → `docker network create herewego-net` (최초 1회) → `docker-compose -f docker-compose.dev.yml up --build`
2. `http://localhost:3000`, `:4000/health`, `:8000/health` 확인
3. `/tactics`, `/rewind` 페이지 진입 — 데이터 없으면 "등록된 팀/시나리오가 없습니다" 안내만 뜨는 게 정상
4. `docker-compose -f docker-compose.dev.yml exec frontend npx tsc --noEmit` 로 타입 에러 확인
5. `backend/app/data/*.py` 세 파일에 실제 데이터 채운 뒤 다시 3번 확인 — 팀/시나리오 선택, 슬라이더/스탯 편집/드래그 등 UI 흐름은 정상이어야 함. **단, 실제 승률/실점확률 숫자가 나오는 건 학습된 모델이 연결된 뒤부터다 — 지금은 계산 단계에서 에러 메시지가 뜨는 게 정상이다.**
