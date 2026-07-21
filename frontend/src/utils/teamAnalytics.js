import { ATTRIBUTE_LABELS } from '../data/positionLabels';

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
