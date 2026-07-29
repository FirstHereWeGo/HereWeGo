import { slotOrderPlayerIds } from './autoAssign';

/** backend는 prime(예: "primekor-7")를 모르므로 실제 로스터 id("kor-7")로 되돌린다. */
function realId(id) {
  return id.startsWith('prime') ? id.slice(5) : id;
}

/** win-probability / match-simulation 요청의 TeamMatchConfig 하나를 만든다. */
export function buildTeamConfig(teamId, formationId, goalkeeperId, playerIds, tacticConfig, playerOverrides = []) {
  return {
    teamId,
    startingXI: { formationId, goalkeeperId, playerIds },
    tacticConfig,
    playerOverrides,
  };
}

/** 피치 위 프라임 선수들을 실제 선수 id에 대한 PlayerOverride(스탯/나이)로 변환한다. */
function buildPrimeOverrides(players, ids) {
  return ids
    .filter(id => players[id]?.prime)
    .map(id => ({
      playerId: realId(id),
      attributeOverrides: { ...players[id].data.attributes },
      ageOverride: players[id].data.age,
    }));
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

  const playerOverrides = buildPrimeOverrides(state.players, [goalkeeperId, ...playerIds]);
  return buildTeamConfig(
    state.team.id,
    formation.id,
    realId(goalkeeperId),
    playerIds.map(realId),
    state.tacticConfig,
    playerOverrides,
  );
}

/** 팀의 기본 TeamTacticPreset(/api/tactics)으로 TeamMatchConfig를 만든다. */
export function buildPresetTeamConfig(teamId, tactics) {
  const preset = tactics.find(t => t.teamId === teamId);
  if (!preset) return null;
  return buildTeamConfig(teamId, preset.formationId, preset.goalkeeperId, preset.startingPlayerIds, preset.tacticConfig);
}
