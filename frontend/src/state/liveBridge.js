/**
 * 백엔드 실시간 데이터 연동 브리지 (Zustand 스타일 경량 스토어)
 *
 * FastAPI(backend/model)에서 계산한 실시간 데이터를 UI에 주입하는 단일 진입점.
 * WebSocket 또는 폴링 응답을 받아 applyServerUpdate(payload) 한 번만 호출하면
 * 구독 중인 컴포넌트가 즉시 리렌더된다. (React useSyncExternalStore 호환)
 *
 * ── 서버 페이로드 스키마 ──────────────────────────────────────────
 * @typedef {Object} ServerUpdate
 * @property {{w:number, d:number, l:number}=} wdl        실시간 승/무/패 확률 (합=1)
 * @property {{min:number, text:string, type?:string}[]=} feed  추가할 경기 이벤트 목록
 * @property {Object.<string, number[]>=} playerStats     선수ID → 10개 스탯 배열 오버라이드
 * @property {{kor:number, rsa:number}=} score            서버 권위 스코어 (선택)
 *
 * 사용 예 (백엔드 팀 테스트용 — 브라우저 콘솔):
 *   window.__PRIME_REWIND_BRIDGE__.applyServerUpdate({
 *     wdl: { w: 0.42, d: 0.31, l: 0.27 },
 *     feed: [{ min: 37, text: '서버 계산 xG 갱신', type: 'info' }],
 *   })
 *
 * WebSocket 연결 예:
 *   const ws = new WebSocket('ws://localhost:8000/ws/match');
 *   ws.onmessage = (e) => applyServerUpdate(JSON.parse(e.data));
 */

let state = {
  serverWdl: null,     // null이면 클라이언트 자체 계산 사용
  serverFeed: [],      // 누적 서버 이벤트 (TacticalBoard가 소비)
  playerStats: null,   // 선수 스탯 오버라이드 (추후 PlayerCard 연동 지점)
  serverScore: null,
  _feedSeq: 0,
};
const listeners = new Set();

export function getBridgeState() { return state; }
export function subscribeBridge(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() { listeners.forEach(fn => fn()); }

/** @param {ServerUpdate} payload */
export function applyServerUpdate(payload = {}) {
  const next = { ...state };
  if (payload.wdl) next.serverWdl = payload.wdl;
  if (payload.feed?.length) {
    next.serverFeed = [...state.serverFeed, ...payload.feed.map(f => ({ ...f, _id: ++state._feedSeq }))];
  }
  if (payload.playerStats) next.playerStats = { ...state.playerStats, ...payload.playerStats };
  if (payload.score) next.serverScore = payload.score;
  state = next;
  emit();
}

/** TacticalBoard가 소비한 서버 피드를 비움 */
export function drainServerFeed() {
  if (!state.serverFeed.length) return [];
  const items = state.serverFeed;
  state = { ...state, serverFeed: [] };
  return items;
}

// 백엔드 팀이 콘솔/외부 스크립트에서 바로 테스트할 수 있도록 노출
if (typeof window !== 'undefined') {
  window.__PRIME_REWIND_BRIDGE__ = { applyServerUpdate, getBridgeState };
}
