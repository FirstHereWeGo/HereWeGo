import { ATTRIBUTE_LABELS, GK_ATTRIBUTE_LABELS, KEY_ATTRS } from '../data/positionLabels';
import { slotOrderPlayerIds } from './autoAssign';

// 실 시드 데이터(app/data/teams.py) 기준 실제 값 범위는 대략 0~100.
const ATTR_MAX = 100;

const ATTACK_KEYS = ['finishing', 'dribbling', 'passing', 'vision', 'pace'];
const DEFENSE_KEYS = ['tackling', 'marking', 'positioning', 'strength', 'agility'];

const LABEL_BY_KEY = Object.fromEntries(ATTRIBUTE_LABELS);
const GK_KEYS = GK_ATTRIBUTE_LABELS.map(([key]) => key);
const GK_LABEL_BY_KEY = Object.fromEntries(GK_ATTRIBUTE_LABELS);

/** GoalkeepingBlock 5개 세부 스탯 평균 - "종합" 한 줄이 필요한 곳(대표 스탯 비교)에서 쓴다. */
function gkAggregate(attributes) {
  const sum = GK_KEYS.reduce((s, key) => s + (attributes?.[key] ?? 0), 0);
  return sum / GK_KEYS.length;
}

function outfieldStarters(players) {
  return Object.values(players || {}).filter(p => !p.data.positions.includes('GK'));
}

function averagesByKeys(starters, keys) {
  const n = starters.length || 1;
  return keys.map(key => {
    const sum = starters.reduce((acc, p) => acc + (p.data.attributes[key] ?? 0), 0);
    return { key, label: LABEL_BY_KEY[key], value: sum / n };
  });
}

/** 선발 필드 플레이어 평균 기준 공격/수비 프로필, 강점·약점 TOP3, GK 능력치를 계산한다. */
export function computeTeamAnalytics(players) {
  const starters = outfieldStarters(players);
  const attack = averagesByKeys(starters, ATTACK_KEYS);
  const defense = averagesByKeys(starters, DEFENSE_KEYS);

  const allAttrs = averagesByKeys(starters, ATTRIBUTE_LABELS.map(([key]) => key))
    .sort((a, b) => b.value - a.value);
  const strengths = allAttrs.slice(0, 3);
  const weaknesses = allAttrs.slice(-3).reverse();

  const gk = Object.values(players || {}).find(p => p.data.positions.includes('GK'));
  const gkOverall = gk ? gkAggregate(gk.data.attributes) : null;

  return { attack, defense, strengths, weaknesses, gkOverall, max: ATTR_MAX };
}

// --- 포지션 라인별 비교 ---

// 선수의 주 포지션(positions[0])으로 라인을 정한다 - model의 base_rating.py와 같은 기준.
const GROUP_BY_POSITION = {
  GK: 'GK',
  CB: 'DF', FB: 'DF', WB: 'DF',
  DM: 'MF', CM: 'MF', AM: 'MF',
  WG: 'FW', ST: 'FW',
};

/** 라인별로 "그 라인에서 실제로 중요한" 스탯만 골라 비교한다. */
export const POSITION_GROUPS = [
  { key: 'DF', label: '수비진', attrs: ['marking', 'tackling', 'strength', 'positioning', 'pace'] },
  { key: 'MF', label: '중원', attrs: ['passing', 'vision', 'positioning', 'tackling', 'agility'] },
  { key: 'FW', label: '공격진', attrs: ['finishing', 'dribbling', 'pace', 'agility', 'positioning'] },
];

function playersInGroup(players, groupKey) {
  return Object.values(players || {}).filter(p => GROUP_BY_POSITION[p.data.positions[0]] === groupKey);
}

function groupAvg(members, key) {
  if (members.length === 0) return 0;
  return members.reduce((sum, p) => sum + (p.data.attributes[key] ?? 0), 0) / members.length;
}

function goalkeeperOf(players) {
  return Object.values(players || {}).find(p => p.data.positions.includes('GK'));
}

/** GK/DF/MF/FW 라인별로 우리 팀·상대 팀의 스탯 평균을 나란히 낸다. */
export function computeGroupComparison(myPlayers, oppPlayers) {
  const lines = POSITION_GROUPS.map(group => {
    const mine = playersInGroup(myPlayers, group.key);
    const opp = playersInGroup(oppPlayers, group.key);
    return {
      key: group.key,
      label: group.label,
      mineCount: mine.length,
      oppCount: opp.length,
      rows: group.attrs.map(key => ({
        key,
        label: LABEL_BY_KEY[key],
        mine: groupAvg(mine, key),
        opp: groupAvg(opp, key),
      })),
    };
  });

  // GK는 필드 플레이어와 스탯 종류가 달라 별도 행으로 뺀다.
  const myGk = goalkeeperOf(myPlayers);
  const oppGk = goalkeeperOf(oppPlayers);
  const keeper = {
    key: 'GK',
    label: '골키퍼',
    mineCount: myGk ? 1 : 0,
    oppCount: oppGk ? 1 : 0,
    rows: GK_KEYS.map(key => ({
      key,
      label: GK_LABEL_BY_KEY[key],
      mine: myGk?.data.attributes[key] ?? 0,
      opp: oppGk?.data.attributes[key] ?? 0,
    })),
  };

  return [keeper, ...lines].filter(line => line.mineCount > 0 || line.oppCount > 0);
}

// --- 포지션별 맞대결 비교 (우리 ST vs 상대 ST처럼, 실제 마주하는 같은 포지션끼리) ---

const MATCHUP_ORDER = ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'WG', 'ST'];
const MATCHUP_LABEL = {
  GK: '골키퍼', CB: '센터백', FB: '풀백', WB: '윙백', DM: '수비형 미드필더',
  CM: '중앙 미드필더', AM: '공격형 미드필더', WG: '윙어', ST: '스트라이커',
};

/**
 * 현재 피치 좌표(x,y) 기준으로 각 선수가 "지금 서 있는" 포메이션 슬롯 포지션을 구한다.
 * @param {Object.<string,{x:number,y:number,data:import('../api/client').Player}>} players GK 포함
 * @param {{positions:string[]}|null} formation
 * @returns {Object.<string,string>} playerId -> 슬롯 포지션 코드
 */
export function currentSlotPositions(players, formation) {
  const result = {};
  const outfield = {};
  Object.entries(players || {}).forEach(([id, p]) => {
    if (p.data.positions.includes('GK')) result[id] = 'GK';
    else outfield[id] = p;
  });
  if (formation) {
    const order = slotOrderPlayerIds(outfield, formation);
    if (order) order.forEach((id, i) => { result[id] = formation.positions[i]; });
  }
  return result;
}

/**
 * 이미 슬롯 순서로 정렬된 목록(TeamTacticPreset.startingPlayerIds 등)에서 슬롯 포지션을 구한다.
 * 상대팀은 피치 좌표가 없는 대신 프리셋 배열 순서 자체가 formation.positions와 1:1 대응이라
 * 좌표 매칭 없이 바로 짝지을 수 있다.
 */
export function slotPositionsFromOrderedIds(goalkeeperId, startingPlayerIds, formation) {
  const result = {};
  if (goalkeeperId) result[goalkeeperId] = 'GK';
  if (formation) {
    (startingPlayerIds || []).forEach((id, i) => { result[id] = formation.positions[i]; });
  }
  return result;
}

/** 선수 한 명의 "대표 스탯"(주어진 포지션의 핵심 스탯 평균) - GK는 종합 능력치 그대로 쓴다. */
function representativeScore(player, pos) {
  if (player.positions.includes('GK')) return gkAggregate(player.attributes);
  const keys = KEY_ATTRS[pos] ?? ATTRIBUTE_LABELS.map(([key]) => key);
  const sum = keys.reduce((s, key) => s + (player.attributes[key] ?? 0), 0);
  return sum / keys.length;
}

function byPrimaryPosition(players, slotById) {
  const groups = {};
  Object.values(players || {}).forEach(p => {
    const pos = slotById?.[p.data.id] ?? p.data.positions[0];
    (groups[pos] ??= []).push(p.data);
  });
  return groups;
}

function representativeAvg(members, pos) {
  if (members.length === 0) return 0;
  return members.reduce((sum, p) => sum + representativeScore(p, pos), 0) / members.length;
}

/** 같은 포지션끼리(우리 ST vs 상대 ST 등) 실제로 맞상대하는 구도로 대표 스탯을 비교한다.
 * mySlots/oppSlots를 넘기면 선수 카드의 주 포지션이 아니라 "지금 서 있는" 슬롯 기준으로 묶는다. */
export function computeMatchupComparison(myPlayers, oppPlayers, mySlots, oppSlots) {
  const mineGroups = byPrimaryPosition(myPlayers, mySlots);
  const oppGroups = byPrimaryPosition(oppPlayers, oppSlots);

  return MATCHUP_ORDER
    .filter(pos => mineGroups[pos] || oppGroups[pos])
    .map(pos => {
      const mine = mineGroups[pos] || [];
      const opp = oppGroups[pos] || [];
      return {
        key: pos,
        label: MATCHUP_LABEL[pos] ?? pos,
        mine: representativeAvg(mine, pos),
        opp: representativeAvg(opp, pos),
        mineCount: mine.length,
        oppCount: opp.length,
      };
    });
}

// --- 스탯 리더보드 ---

const LEADER_CATEGORIES = [
  ['pace', '최고 주력'],
  ['passing', '최고 패스'],
  ['finishing', '최고 결정력'],
  ['tackling', '최고 수비'],
];

/** 선발 필드 플레이어 중 각 스탯 1위를 뽑는다 (동점이면 먼저 나온 선수). */
export function computeStatLeaders(players) {
  const starters = outfieldStarters(players);
  return LEADER_CATEGORIES.map(([key, title]) => {
    const best = starters.reduce(
      (top, p) => (top === null || (p.data.attributes[key] ?? 0) > (top.data.attributes[key] ?? 0) ? p : top),
      null,
    );
    return { key, title, player: best?.data ?? null, value: best ? best.data.attributes[key] : 0 };
  });
}
