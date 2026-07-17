/**
 * backend Formation.positions는 역할 순서만 주고 피치 좌표는 주지 않는다
 * (오른쪽부터 수비->미드필드->공격 순, 각 라인은 오른쪽->왼쪽).
 * 3D 피치 렌더링에 필요한 x,y(%)는 프론트가 역할별 고정 라인(y)에 배치하고,
 * 같은 라인을 공유하는 슬롯들은 주어진 순서(오른쪽->왼쪽) 그대로 x를 분배해서 만든다.
 * y: 0 = 상대 골문 쪽, 100 = 우리 골문 쪽.
 */
const ROLE_Y = {
  GK: 90,
  CB: 78,
  FB: 76,
  WB: 72,
  DM: 64,
  CM: 58,
  AM: 46,
  WG: 32,
  ST: 20,
};

/** @param {string[]} positions Formation.positions (GK 제외 10개) */
export function layoutFormation(positions) {
  const ys = positions.map(role => ROLE_Y[role] ?? 50);
  const groups = new Map(); // y -> indices
  ys.forEach((y, i) => {
    if (!groups.has(y)) groups.set(y, []);
    groups.get(y).push(i);
  });

  const coords = new Array(positions.length);
  for (const [y, idxs] of groups) {
    idxs.forEach((slotIdx, i) => {
      const x = idxs.length === 1 ? 50 : 85 - (70 * i) / (idxs.length - 1);
      coords[slotIdx] = { x, y };
    });
  }
  return coords;
}

export const GK_COORD = { x: 50, y: 92 };
