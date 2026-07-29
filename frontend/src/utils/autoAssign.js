import { KEY_ATTRS } from '../data/positionLabels';
import { layoutFormation } from '../data/formationLayout';

const NEIGHBOR = {
  CB: ['FB'],
  FB: ['CB', 'WB'],
  WB: ['FB', 'WG'],
  DM: ['CM', 'CB'],
  CM: ['DM', 'AM'],
  AM: ['CM', 'WG'],
  WG: ['AM', 'WB', 'ST'],
  ST: ['WG', 'AM'],
};

/**
 * 아웃필드 선수들을 포메이션 슬롯에 자동 배정한다.
 * @param {Object.<string,{data:import('../api/client').Player}>} outfieldPlayers GK 제외
 * @param {{positions:string[]}} formation
 * @returns {{id:string,x:number,y:number}[]}
 */
export function assignFormation(outfieldPlayers, formation) {
  const coords = layoutFormation(formation);
  const pool = Object.keys(outfieldPlayers);
  const assigned = new Set();
  const updates = [];

  formation.positions.forEach((role, slotIdx) => {
    let best = null, bestScore = -1;
    pool.forEach(id => {
      if (assigned.has(id)) return;
      const d = outfieldPlayers[id].data;
      let score = 0;
      if (d.positions.includes(role)) score = 100;
      else if ((NEIGHBOR[role] || []).some(r => d.positions.includes(r))) score = 40;
      const statKey = (KEY_ATTRS[role] || [])[0];
      if (statKey && d.attributes?.[statKey] != null) score += d.attributes[statKey];
      if (score > bestScore) { bestScore = score; best = id; }
    });
    if (best) {
      assigned.add(best);
      updates.push({ id: best, x: coords[slotIdx].x, y: coords[slotIdx].y });
    }
  });
  return updates;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * 현재 피치 위 좌표(x,y) 기준으로 각 포메이션 슬롯에 가장 가까운 선수를 매칭해
 * backend StartingXI.playerIds 순서(formation.positions와 1:1 대응)를 복원한다.
 * @param {Object.<string,{x:number,y:number,data:import('../api/client').Player}>} outfieldPlayers GK 제외
 * @param {{positions:string[]}} formation
 * @returns {string[]|null} 슬롯 수와 선수 수가 다르면 null
 */
export function slotOrderPlayerIds(outfieldPlayers, formation) {
  const coords = layoutFormation(formation);
  const pool = Object.entries(outfieldPlayers).map(([id, p]) => ({ id, x: p.x, y: p.y }));
  if (pool.length !== coords.length) return null;

  const remaining = [...pool];
  return coords.map(c => {
    let bestIdx = 0, bestD = Infinity;
    remaining.forEach((p, i) => {
      const d = dist(p.x, p.y, c.x, c.y);
      if (d < bestD) { bestD = d; bestIdx = i; }
    });
    return remaining.splice(bestIdx, 1)[0].id;
  });
}
