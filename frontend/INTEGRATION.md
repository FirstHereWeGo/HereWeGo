# 백엔드 실시간 연동 가이드 (frontend ↔ backend/model)

프론트엔드에는 서버 데이터를 주입하는 단일 진입점이 준비되어 있습니다:
`src/state/liveBridge.js` 의 `applyServerUpdate(payload)`.

## 페이로드 스키마

```jsonc
{
  "wdl":   { "w": 0.42, "d": 0.31, "l": 0.27 },          // 실시간 승/무/패 (합=1) — 있으면 클라 계산 대신 표시
  "feed":  [{ "min": 37, "text": "…", "type": "info" }],  // 라이브 로그에 추가할 이벤트
  "playerStats": { "sonHM": [84,70,84,88,94,84,84,82,40,38] }, // 선수 스탯 오버라이드 (연동 지점 확보)
  "score": { "kor": 1, "rsa": 0 }                          // 서버 권위 스코어 (선택)
}
```

## 연결 방법 (WebSocket 예시)

```js
import { applyServerUpdate } from './state/liveBridge';
const ws = new WebSocket('ws://localhost:8000/ws/match');
ws.onmessage = (e) => applyServerUpdate(JSON.parse(e.data));
```

## 브라우저 콘솔 테스트 (백엔드 없이)

```js
window.__PRIME_REWIND_BRIDGE__.applyServerUpdate({
  wdl: { w: 0.5, d: 0.3, l: 0.2 },
  feed: [{ min: 40, text: '서버 xG 모델 갱신', type: 'info' }],
});
```
상단 승률 바에 `LIVE(서버)` 표시가 붙으면 서버 값이 적용된 것입니다.

## 현재 동작

- `wdl`, `feed`는 즉시 UI 반영 (TacticalBoard가 구독)
- `playerStats`, `score`는 스토어에 저장됨 — UI 반영 지점은 PlayerCard/스코어보드에 연결 예정(팀 논의 후)
