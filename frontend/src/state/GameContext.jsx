import { createContext, useContext, useReducer, useCallback } from 'react';
import { getFormations, getTactics, getTeams } from '../api/client';
import { layoutFormation, GK_COORD } from '../data/formationLayout';

/**
 * 로스터/포메이션/전술 전역 상태.
 * editable: 로딩 완료 후 항상 true — 승률 계산은 프리매치 예측이라 언제든 편집 가능.
 */
const initialState = {
  loading: true,
  error: null,
  team: null,          // 내 팀 Team (id, name, players)
  oppTeam: null,        // 상대 팀 Team
  formations: [],        // Formation[]
  tacticPreset: null,     // 내 팀 TeamTacticPreset
  oppTacticPreset: null,   // 상대 팀 TeamTacticPreset
  formationId: null,
  players: {},           // GK 포함 11명: { [id]: {data: Player, x, y, homeX, homeY} }
  selected: null,          // 피치에서 선택된 선수(교체 시 "나가는" 선수) id
  viewedId: null,          // PlayerCard에 표시 중인 선수 id — 벤치 선수 클릭 시엔 이것만 바뀜
  tacticConfig: null,      // 내 팀 현재 TacticConfig (Sidebar가 수정)
  editable: true,
};

function isGk(player) {
  return player.positions.includes('GK');
}

function buildFromPreset(team, formation, preset) {
  const coords = layoutFormation(formation);
  const playersById = Object.fromEntries(team.players.map(p => [p.id, p]));
  const players = {};

  const gk = playersById[preset.goalkeeperId];
  if (gk) {
    players[gk.id] = { data: gk, x: GK_COORD.x, y: GK_COORD.y, homeX: GK_COORD.x, homeY: GK_COORD.y };
  }
  preset.startingPlayerIds.forEach((id, i) => {
    const p = playersById[id];
    if (!p) return;
    players[id] = { data: p, x: coords[i].x, y: coords[i].y, homeX: coords[i].x, homeY: coords[i].y };
  });

  return players;
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'LOAD_SUCCESS': {
      const { team, oppTeam, formations, tacticPreset, oppTacticPreset } = action;
      // 같은 내 팀으로 토너먼트를 이어가는 중이면(상대만 바뀜) 직전 경기에서 수정한
      // 포메이션/라인업/전술을 그대로 이어간다 — 매 라운드 기본 프리셋으로 리셋하지 않는다.
      const carryOver = state.team?.id === team.id && state.players && Object.keys(state.players).length > 0;
      const formationId = carryOver ? state.formationId : (formations.find(f => f.id === tacticPreset.formationId) || formations[0]).id;
      const players = carryOver ? state.players : buildFromPreset(team, formations.find(f => f.id === formationId) || formations[0], tacticPreset);
      const tacticConfig = carryOver ? state.tacticConfig : tacticPreset.tacticConfig;
      return {
        ...state,
        loading: false,
        error: null,
        team, oppTeam, formations, tacticPreset, oppTacticPreset,
        formationId,
        players,
        tacticConfig,
        selected: null,
        viewedId: null,
      };
    }
    case 'SELECT_PLAYER':
      return { ...state, selected: action.id, viewedId: action.id };
    case 'VIEW_PLAYER':
      return { ...state, viewedId: action.id };
    case 'DESELECT_PLAYER':
      return { ...state, selected: null };
    case 'SWAP_PLAYERS': {
      if (!state.editable) return state;
      const { idA, idB } = action;
      const a = state.players[idA];
      const b = state.players[idB];
      if (!a || !b) return state;
      if (isGk(a.data) !== isGk(b.data)) return state; // GK는 GK끼리만
      return {
        ...state,
        players: {
          ...state.players,
          [idA]: { ...a, x: b.x, y: b.y },
          [idB]: { ...b, x: a.x, y: a.y },
        },
        selected: null,
        viewedId: idB,
      };
    }
    case 'SET_PLAYER_POS_BULK': {
      if (!state.editable) return state;
      const players = { ...state.players };
      action.updates.forEach(({ id, x, y }) => {
        if (players[id]) players[id] = { ...players[id], x, y };
      });
      return { ...state, players };
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
    case 'APPLY_FORMATION':
      if (!state.editable) return state;
      return { ...state, formationId: action.formationId };
    case 'MAKE_SUB': {
      if (!state.editable) return state;
      const { benchId } = action;
      const outId = state.selected;
      if (state.players[benchId]) return state; // 이미 선발이면 무시
      if (!outId || !state.players[outId]) return state;
      const inPlayer = state.team.players.find(p => p.id === benchId);
      if (!inPlayer) return state;

      const outPlayer = state.players[outId];
      if (isGk(outPlayer.data) !== isGk(inPlayer)) return state;

      const cur = outPlayer;
      const players = { ...state.players };
      delete players[outId];
      players[benchId] = { data: inPlayer, x: cur.x, y: cur.y, homeX: cur.homeX, homeY: cur.homeY };
      return { ...state, players, selected: benchId, viewedId: benchId };
    }
    case 'SET_TACTIC_CONFIG':
      if (!state.editable) return state;
      return { ...state, tacticConfig: action.value };
    case 'SET_EDITABLE':
      return { ...state, editable: action.value };
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
export function useGameActions() {
  const dispatch = useGameDispatch();
  const loadMatch = useCallback(async (myTeamId, oppTeamId) => {
    dispatch({ type: 'LOAD_START' });
    try {
      const [teams, formations, tactics] = await Promise.all([getTeams(), getFormations(), getTactics()]);
      const team = teams.find(t => t.id === myTeamId);
      const oppTeam = teams.find(t => t.id === oppTeamId);
      const tacticPreset = tactics.find(t => t.teamId === myTeamId);
      const oppTacticPreset = tactics.find(t => t.teamId === oppTeamId);
      if (!team || !tacticPreset) throw new Error(`선택한 내 팀(${myTeamId})의 데이터를 찾지 못했습니다`);
      if (!oppTeam || !oppTacticPreset) throw new Error(`선택한 상대 팀(${oppTeamId})의 데이터를 찾지 못했습니다`);
      dispatch({ type: 'LOAD_SUCCESS', team, oppTeam, formations, tacticPreset, oppTacticPreset });
    } catch (err) {
      dispatch({ type: 'LOAD_ERROR', error: err.message });
    }
  }, [dispatch]);

  return {
    loadMatch,
    selectPlayer: useCallback((id) => dispatch({ type: 'SELECT_PLAYER', id }), [dispatch]),
    viewPlayer: useCallback((id) => dispatch({ type: 'VIEW_PLAYER', id }), [dispatch]),
    deselectPlayer: useCallback(() => dispatch({ type: 'DESELECT_PLAYER' }), [dispatch]),
    swapPlayers: useCallback((idA, idB) => dispatch({ type: 'SWAP_PLAYERS', idA, idB }), [dispatch]),
    setPlayerPosBulk: useCallback((updates) => dispatch({ type: 'SET_PLAYER_POS_BULK', updates }), [dispatch]),
    restoreHome: useCallback(() => dispatch({ type: 'RESTORE_HOME' }), [dispatch]),
    applyFormation: useCallback((formationId) => dispatch({ type: 'APPLY_FORMATION', formationId }), [dispatch]),
    makeSub: useCallback((benchId) => dispatch({ type: 'MAKE_SUB', benchId }), [dispatch]),
    setTacticConfig: useCallback((value) => dispatch({ type: 'SET_TACTIC_CONFIG', value }), [dispatch]),
    setEditable: useCallback((value) => dispatch({ type: 'SET_EDITABLE', value }), [dispatch]),
  };
}
