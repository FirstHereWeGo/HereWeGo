import { FORMATIONS } from '../data/squad';

const RELEVANT_STAT = { DF: 8, MF: 6, WG: 5, ST: 4 }; // 역할별 대표 스탯 인덱스
const NEIGHBOR = { WG: ['ST', 'MF'], ST: ['WG'], MF: ['DF', 'WG'], DF: ['MF'] };

/**
 * 포메이션 슬롯에 선수를 자동 배정한다.
 * GK는 그대로 두고, 아웃필드 10명을 선호 포지션 + 대표 스탯 점수로 슬롯에 매칭.
 * @returns {{id:string, x:number, y:number}[]}
 */
export function assignFormation(players, formationName) {
  const slots = FORMATIONS[formationName];
  if (!slots) return [];
  const gkId = Object.keys(players).find(id => players[id].data.pref.includes('GK'));
  const pool = Object.keys(players).filter(id => id !== gkId);
  const assigned = new Set();
  const updates = [];

  slots.forEach(slot => {
    let best = null, bestScore = -1;
    pool.forEach(id => {
      if (assigned.has(id)) return;
      const d = players[id].data;
      let s = d.stats[RELEVANT_STAT[slot.role]];
      if (d.pref.includes(slot.role)) s += 100;
      else if ((NEIGHBOR[slot.role] || []).some(r => d.pref.includes(r))) s += 40;
      if (s > bestScore) { bestScore = s; best = id; }
    });
    if (best) {
      assigned.add(best);
      updates.push({ id: best, x: slot.x, y: slot.y });
    }
  });
  return updates;
}
