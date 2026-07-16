import { createContext, useContext, useReducer, useCallback } from 'react';
import { SQUAD, KOR_STARTING, KOR_BENCH, MAX_SUBS } from '../data/squad';

/**
 * 스쿼드/전술 전역 상태.
 * 경기 시계·스코어 등 매치 런타임 상태는 TacticalBoard가 로컬로 관리한다.
 * editable: 킥오프 전/일시정지/하프타임에만 true — 이때만 배치/교체/전성기/전술 수정 가능.
 */
const initialState = {
  players: {},
  selected: null,
  benchState: [],
  subsLeft: MAX_SUBS,
  inst: { line: 'mid', press: 'counterpress', transition: 'counter', tempo: 'slow' },
  lineVal: 50,        // 수비 라인 높이 슬라이더 (0=낮음, 100=높음)
  balanceVal: 50,     // 공격/수비 비중 슬라이더 (0=수비, 100=공격)
  mentality: 'balanced',
  editable: true,
  playing: false, // 찬스 애니메이션 재생 중
};

function buildStartingPlayers() {
  const players = {};
  KOR_STARTING.forEach(([id, x, y]) => {
    players[id] = { data: SQUAD[id], x, y, homeX: x, homeY: y, prime: false };
  });
  return players;
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET_MATCH':
      return {
        ...initialState,
        players: buildStartingPlayers(),
        benchState: KOR_BENCH.map(id => ({ id, status: 'ok' })),
        subsLeft: MAX_SUBS,
      };
    case 'SELECT_PLAYER':
      return { ...state, selected: action.id };
    case 'MOVE_PLAYER': {
      if (!state.editable) return state;
      const p = state.players[action.id];
      if (!p) return state;
      let x = Math.max(3, Math.min(97, action.x));
      let y = Math.max(3, Math.min(97, action.y));
      if (p.data.pref.includes('GK')) { y = Math.max(78, y); x = Math.max(25, Math.min(75, x)); }
      return { ...state, players: { ...state.players, [action.id]: { ...p, x, y } } };
    }
    case 'SET_PLAYER_POS_BULK': {
      if (!state.editable) return state;
      const players = { ...state.players };
      action.updates.forEach(({ id, x, y }) => {
        if (players[id]) players[id] = { ...players[id], x, y };
      });
      return { ...state, players };
    }
    case 'TOGGLE_PRIME': {
      if (!state.editable) return state;
      const id = state.selected;
      const p = state.players[id];
      if (!p || !p.data.star) return state;
      return { ...state, players: { ...state.players, [id]: { ...p, prime: !p.prime } } };
    }
    case 'RESTORE_HOME': {
      if (!state.editable) return state;
      const players = {};
      for (const id in state.players) {
        const p = state.players[id];
        players[id] = { ...p, x: p.homeX, y: p.homeY };
      }
      return { ...state, players };
    }
    case 'MAKE_SUB': {
      if (!state.editable) return state;
      const { benchId } = action;
      const outId = state.selected;
      const entry = state.benchState.find(b => b.id === benchId);
      if (!entry || entry.status !== 'ok' || state.subsLeft <= 0) return state;
      if (!outId || !state.players[outId]) return state;
      if (state.players[outId].data.pref.includes('GK')) return state;
      const cur = state.players[outId];
      const players = { ...state.players };
      delete players[outId];
      players[benchId] = {
        data: SQUAD[benchId], x: cur.x, y: cur.y, homeX: cur.homeX, homeY: cur.homeY, prime: false,
      };
      const benchState = state.benchState.map(b => b.id === benchId ? { ...b, status: 'in' } : b);
      benchState.push({ id: outId, status: 'out', note: '교체 아웃' });
      return { ...state, players, benchState, subsLeft: state.subsLeft - 1, selected: benchId };
    }
    case 'SET_INST':
      if (!state.editable) return state;
      return { ...state, inst: { ...state.inst, [action.group]: action.val } };
    case 'SET_LINE_VAL': {
      if (!state.editable) return state;
      const v = action.value;
      const line = v < 35 ? 'low' : v > 65 ? 'high' : 'mid';
      return { ...state, lineVal: v, inst: { ...state.inst, line } };
    }
    case 'SET_BALANCE_VAL': {
      if (!state.editable) return state;
      const v = action.value;
      const mentality = v < 33 ? 'defensive' : v > 66 ? 'dominant' : 'balanced';
      return { ...state, balanceVal: v, mentality };
    }
    case 'SET_MENTALITY':
      if (!state.editable) return state;
      return { ...state, mentality: action.val };
    case 'SET_EDITABLE':
      return { ...state, editable: action.value };
    case 'START_PLAYBACK':
      return { ...state, playing: true, selected: null };
    case 'END_PLAYBACK':
      return { ...state, playing: false };
    default:
      return state;
  }
}

const GameStateContext = createContext(null);
const GameDispatchContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => reducer(initialState, { type: 'RESET_MATCH' }));
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameProvider');
  return ctx;
}
export function useGameDispatch() {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error('useGameDispatch must be used within GameProvider');
  return ctx;
}
export function useGameActions() {
  const dispatch = useGameDispatch();
  return {
    resetMatch: useCallback(() => dispatch({ type: 'RESET_MATCH' }), [dispatch]),
    selectPlayer: useCallback((id) => dispatch({ type: 'SELECT_PLAYER', id }), [dispatch]),
    movePlayer: useCallback((id, x, y) => dispatch({ type: 'MOVE_PLAYER', id, x, y }), [dispatch]),
    setPlayerPosBulk: useCallback((updates) => dispatch({ type: 'SET_PLAYER_POS_BULK', updates }), [dispatch]),
    togglePrime: useCallback(() => dispatch({ type: 'TOGGLE_PRIME' }), [dispatch]),
    restoreHome: useCallback(() => dispatch({ type: 'RESTORE_HOME' }), [dispatch]),
    makeSub: useCallback((benchId) => dispatch({ type: 'MAKE_SUB', benchId }), [dispatch]),
    setInst: useCallback((group, val) => dispatch({ type: 'SET_INST', group, val }), [dispatch]),
    setMentality: useCallback((val) => dispatch({ type: 'SET_MENTALITY', val }), [dispatch]),
    setLineVal: useCallback((value) => dispatch({ type: 'SET_LINE_VAL', value }), [dispatch]),
    setBalanceVal: useCallback((value) => dispatch({ type: 'SET_BALANCE_VAL', value }), [dispatch]),
    setEditable: useCallback((value) => dispatch({ type: 'SET_EDITABLE', value }), [dispatch]),
    startPlayback: useCallback(() => dispatch({ type: 'START_PLAYBACK' }), [dispatch]),
    endPlayback: useCallback(() => dispatch({ type: 'END_PLAYBACK' }), [dispatch]),
  };
}
