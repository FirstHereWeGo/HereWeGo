import { ATTRIBUTE_LABELS, KEY_ATTRS } from '../data/positionLabels';

// 실 시드 데이터(app/data/teams.py) 기준 실제 값 범위는 대략 0~100.
const ATTR_MAX = 100;

const ATTACK_KEYS = ['finishing', 'dribbling', 'passing', 'vision', 'pace'];
const DEFENSE_KEYS = ['tackling', 'marking', 'positioning', 'strength', 'agility'];

const LABEL_BY_KEY = Object.fromEntries(ATTRIBUTE_LABELS);

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
  const gkOverall = gk ? gk.data.attributes.overall : null;

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

  // GK는 세부 스탯 없이 종합 능력치 하나뿐이라 별도 행으로 뺀다.
  const myGk = goalkeeperOf(myPlayers);
  const oppGk = goalkeeperOf(oppPlayers);
  const keeper = {
    key: 'GK',
    label: '골키퍼',
    mineCount: myGk ? 1 : 0,
    oppCount: oppGk ? 1 : 0,
    rows: [{
      key: 'overall',
      label: '종합',
      mine: myGk?.data.attributes.overall ?? 0,
      opp: oppGk?.data.attributes.overall ?? 0,
    }],
  };

  return [keeper, ...lines].filter(line => line.mineCount > 0 || line.oppCount > 0);
}

// --- 포지션별 맞대결 비교 (우리 ST vs 상대 ST처럼, 실제 마주하는 같은 포지션끼리) ---

const MATCHUP_ORDER = ['GK', 'CB', 'FB', 'WB', 'DM', 'CM', 'AM', 'WG', 'ST'];
const MATCHUP_LABEL = {
  GK: '골키퍼', CB: '센터백', FB: '풀백', WB: '윙백', DM: '수비형 미드필더',
  CM: '중앙 미드필더', AM: '공격형 미드필더', WG: '윙어', ST: '스트라이커',
};

/** 선수 한 명의 "대표 스탯"(그 포지션 핵심 스탯 평균) - GK는 종합 능력치 그대로 쓴다. */
function representativeScore(player) {
  if (player.positions.includes('GK')) return player.attributes.overall ?? 0;
  const keys = KEY_ATTRS[player.positions[0]] ?? ATTRIBUTE_LABELS.map(([key]) => key);
  const sum = keys.reduce((s, key) => s + (player.attributes[key] ?? 0), 0);
  return sum / keys.length;
}

function byPrimaryPosition(players) {
  const groups = {};
  Object.values(players || {}).forEach(p => {
    const pos = p.data.positions[0];
    (groups[pos] ??= []).push(p.data);
  });
  return groups;
}

function representativeAvg(members) {
  if (members.length === 0) return 0;
  return members.reduce((sum, p) => sum + representativeScore(p), 0) / members.length;
}

/** 같은 포지션끼리(우리 ST vs 상대 ST 등) 실제로 맞상대하는 구도로 대표 스탯을 비교한다. */
export function computeMatchupComparison(myPlayers, oppPlayers) {
  const mineGroups = byPrimaryPosition(myPlayers);
  const oppGroups = byPrimaryPosition(oppPlayers);

  return MATCHUP_ORDER
    .filter(pos => mineGroups[pos] || oppGroups[pos])
    .map(pos => {
      const mine = mineGroups[pos] || [];
      const opp = oppGroups[pos] || [];
      return {
        key: pos,
        label: MATCHUP_LABEL[pos] ?? pos,
        mine: representativeAvg(mine),
        opp: representativeAvg(opp),
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
