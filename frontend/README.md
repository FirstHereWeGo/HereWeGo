# PRIME REWIND — 그날, 전성기의 그가 있었다면

실제 2026 월드컵 대한민국 vs 남아공 경기(0-1)의 실점·득점 기회 장면으로 돌아가, 감독이 되어
배치·교체·전성기 소환을 조작하고 xG·승률 시뮬레이션 결과를 확인하는 3D 인터랙티브 웹서비스.

## 실행 방법

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # 프로덕션 빌드 → dist/
```

Node.js 18 이상 권장.

## 폴더 구조

```
src/
  data/squad.js        선수 DB(스탯·키·나이) · 장면별 라인업 · 포메이션 슬롯
  engine/
    stats.js            포지션 판정 · 나이 보정 · 전성기 · 부적응 페널티 → 최종 능력치 계산
    xgModel.js           규칙 기반 xG 모델 + 포아송 승률 계산
    formation.js          포메이션 자동 배정 로직
  three/PitchScene.js    Three.js 3D 스타디움/선수 렌더링 (React와 분리된 순수 렌더링 엔진)
  state/GameContext.jsx  전역 게임 상태 (useReducer) — 배치/선택/벤치/전술 지시
  components/
    Landing.jsx           01 랜딩
    SceneSelect.jsx        02 장면 선택
    TacticalBoard.jsx       03 전술 보드 레이아웃
    Sidebar.jsx              포메이션 버튼 + 팀 지시
    PitchBoard.jsx           3D 캔버스 (PitchScene 소유 + React 상태 동기화)
    TacticalGauge.jsx        xG/승률 게이지
    PlayerCard.jsx            선택 선수 능력치 카드
    BenchList.jsx              벤치/교체
    ResultView.jsx          04 결과 비교
  styles/global.css        전역 스타일
```

## 핵심 데이터/로직 참고

- **선수 스탯**: 10개 공통 스탯(`data/squad.js`의 `STAT_NAMES`). 포지션별 대표 스탯은
  `KEY_STATS`에서 확인. 실제 라인업 이미지 기준으로 시간대별(63′/90′+3) 스쿼드를
  `LINEUPS`에 분리해뒀습니다.
- **능력치 계산**: `engine/stats.js`의 `effStats(player)`가 나이 보정 → 전성기 부스트 →
  포지션 부적응 순으로 적용한 최종 수치를 반환합니다. 새 보정 요소를 추가할 때 이 파일만
  건드리면 됩니다.
- **xG/승률**: `engine/xgModel.js`. 장면별 계산 로직(`calcConcededXG`, `calcChanceXG`)과
  포아송 승률(`poissonWDL`)이 분리되어 있어 계수 튜닝이 쉽습니다.
- **3D 렌더링**: `three/PitchScene.js`는 React를 모르는 순수 클래스입니다. `PitchBoard.jsx`가
  이 클래스를 생성하고 게임 상태 변화를 감지해 메서드를 호출하는 방식으로 연결됩니다.

## 브랜치 전략

기능 단위로 브랜치를 나눠 작업 후 PR로 병합합니다. 예:

- `feature/formation-ui` — 포메이션 버튼/자동배정 개선
- `feature/xg-tuning` — xG 계수 조정, 실제 데이터 기반 보정
- `feature/manager-archetype` — 결과 화면에 감독 유형 판정 추가
- `feature/pitch-camera` — 카메라 연출, 조명, 이펙트

## 다음 작업 (기획서 "On the horizon" 참고)

- [ ] 감독 유형(4~8종) 판정 로직 + 공유 카드
- [ ] 몬테카를로 장면 시뮬레이션(선택적 고도화)
- [ ] Vercel/Netlify 배포
