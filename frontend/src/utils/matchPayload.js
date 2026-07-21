import { slotOrderPlayerIds } from './autoAssign';

/** win-probability / match-simulation 요청의 TeamMatchConfig 하나를 만든다. */
export function buildTeamConfig(teamId, formationId, goalkeeperId, playerIds, tacticConfig) {
  return {
    teamId,
    startingXI: { formationId, goalkeeperId, playerIds },
    tacticConfig,
    playerOverrides: [],
  };
}

/** GameContext의 현재 편집 상태(state)로부터 "내 팀" TeamMatchConfig를 만든다. 슬롯 수가 안 맞으면 null. */
export function buildMyTeamConfig(state) {
  const formation = state.formations.find(f => f.id === state.formationId);
  if (!formation) return null;
  const goalkeeperId = Object.keys(state.players).find(id => state.players[id].data.positions.includes('GK'));
  const outfield = Object.fromEntries(
    Object.entries(state.players).filter(([id]) => id !== goalkeeperId)
  );
  const playerIds = slotOrderPlayerIds(outfield, formation);
  if (!goalkeeperId || !playerIds) return null;
  return buildTeamConfig(state.team.id, formation.id, goalkeeperId, playerIds, state.tacticConfig);
}

/** 팀의 기본 TeamTacticPreset(/api/tactics)으로 TeamMatchConfig를 만든다. */
export function buildPresetTeamConfig(teamId, tactics) {
  const preset = tactics.find(t => t.teamId === teamId);
  if (!preset) return null;
  return buildTeamConfig(teamId, preset.formationId, preset.goalkeeperId, preset.startingPlayerIds, preset.tacticConfig);
}
