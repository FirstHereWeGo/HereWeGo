import { createContext, useContext, useReducer, useCallback } from 'react';
import { SQUAD, LINEUPS, SCENES } from '../data/squad';
import { recalcAll } from '../engine/xgModel';

const initialState = {
  scene: null,
  players: {},        // id -> { data, x, y, homeX, homeY, prime }
  selected: null,
  benchState: [],
  subsLeft: 0,
  savedXG: { conceded: null, chance: null },
  inst: { line: 'mid', press: 'counterpress', transition: 'counter', tempo: 'slow' },
  mentality: 'balanced',
  lastXG: null,
};

function buildPlayersFromLineup(sceneKey) {
  const lu = LINEUPS[sceneKey];
  const players = {};
  lu.onfield.forEach(([id, x, y]) => {
    players[id] = { data: SQUAD[id], x, y, homeX: x, homeY: y, prime: false };
  });
  return players;
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_SCENE': {
      const scene = action.scene;
      const players = buildPlayersFromLineup(scene);
      const lu = LINEUPS[scene];
      return {
        ...initialState,
        scene,
        players,
        benchState: lu.bench.map(b => ({ ...b })),
        subsLeft: lu.subsLeft,
      };
    }
    case 'SELECT_PLAYER':
      return { ...state, selected: action.id };
    case 'MOVE_PLAYER': {
      const p = state.players[action.id];
      if (!p) return state;
      let x = Math.max(3, Math.min(97, action.x));
      let y = Math.max(3, Math.min(97, action.y));
      if (p.data.pref.includes('GK')) { y = Math.max(78, y); x = Math.max(25, Math.min(75, x)); }
      return { ...state, players: { ...state.players, [action.id]: { ...p, x, y } } };
    }
    case 'SET_PLAYER_POS_BULK': {
      // action.updates: [{id, x, y}]
      const players = { ...state.players };
      action.updates.forEach(({ id, x, y }) => {
        if (players[id]) players[id] = { ...players[id], x, y };
      });
      return { ...state, players };
    }
    case 'TOGGLE_PRIME': {
      const id = state.selected;
      const p = state.players[id];
      if (!p || !p.data.star) return state;
      return { ...state, players: { ...state.players, [id]: { ...p, prime: !p.prime } } };
    }
    case 'RESTORE_HOME': {
      const players = {};
      for (const id in state.players) {
        const p = state.players[id];
        players[id] = { ...p, x: p.homeX, y: p.homeY };
      }
      return { ...state, players };
    }
    case 'MAKE_SUB': {
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
      return {
        ...state, players, benchState, subsLeft: state.subsLeft - 1, selected: benchId,
      };
    }
    case 'SET_INST':
      return { ...state, inst: { ...state.inst, [action.group]: action.val } };
    case 'SET_MENTALITY':
      return { ...state, mentality: action.val };
    case 'RECALC': {
      if (!state.scene) return state;
      const result = recalcAll(state.scene, state.players, state.inst, state.mentality, state.savedXG);
      return { ...state, savedXG: result.savedXG, lastXG: result };
    }
    default:
      return state;
  }
}

const GameStateContext = createContext(null);
const GameDispatchContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
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

/** 자주 쓰는 액션들을 편의 함수로 제공 */
export function useGameActions() {
  const dispatch = useGameDispatch();
  return {
    startScene: useCallback((scene) => dispatch({ type: 'START_SCENE', scene }), [dispatch]),
    selectPlayer: useCallback((id) => dispatch({ type: 'SELECT_PLAYER', id }), [dispatch]),
    movePlayer: useCallback((id, x, y) => dispatch({ type: 'MOVE_PLAYER', id, x, y }), [dispatch]),
    setPlayerPosBulk: useCallback((updates) => dispatch({ type: 'SET_PLAYER_POS_BULK', updates }), [dispatch]),
    togglePrime: useCallback(() => dispatch({ type: 'TOGGLE_PRIME' }), [dispatch]),
    restoreHome: useCallback(() => dispatch({ type: 'RESTORE_HOME' }), [dispatch]),
    makeSub: useCallback((benchId) => dispatch({ type: 'MAKE_SUB', benchId }), [dispatch]),
    setInst: useCallback((group, val) => dispatch({ type: 'SET_INST', group, val }), [dispatch]),
    setMentality: useCallback((val) => dispatch({ type: 'SET_MENTALITY', val }), [dispatch]),
    recalc: useCallback(() => dispatch({ type: 'RECALC' }), [dispatch]),
  };
}

export { SCENES };
