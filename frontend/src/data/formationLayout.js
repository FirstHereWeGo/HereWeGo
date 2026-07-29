/**
 * backend Formation.positions는 역할 순서만 주고 피치 좌표는 주지 않는다
 * (오른쪽부터 수비->미드필드->공격 순, 각 라인은 오른쪽->왼쪽).
 * Formation.id(예: "4-2-3-1")는 사실 라인별 인원수를 그대로 담고 있으므로
 * (4+2+3+1=10), 역할명이 아니라 이 숫자로 라인을 나누면 같은 라인의 선수가
 * 역할명이 달라도(FB/CB 등) 한 줄로 정확히 스프레드된다.
 * 두 팀이 하프라인을 넘어 겹치지 않도록, y는 자기 진영 절반(50~100) 안에서만
 * 배치한다 (공격 라인도 50을 넘지 않음). y: 0 = 상대 골문 쪽, 100 = 우리 골문 쪽.
 */
const OWN_HALF_BACK_Y = 86; // 최후방 라인(GK 제외)
const OWN_HALF_FRONT_Y = 54; // 최전방 라인 — 하프라인(50) 안쪽에서 멈춤

/** 라인 인원이 적을수록 중앙에 좁게 모이고, 많을수록 터치라인 쪽까지 넓게 퍼진다. */
function lineHalfWidth(size) {
  if (size <= 1) return 0;
  return Math.min(42, 10 + 15 * (size - 2));
}

/** @param {{id:string, positions:string[]}} formation */
export function layoutFormation(formation) {
  const { id, positions } = formation;
  let lineSizes = id.split('-').map(Number);
  if (lineSizes.some(Number.isNaN) || lineSizes.reduce((a, b) => a + b, 0) !== positions.length) {
    lineSizes = [positions.length]; // 예상과 다른 id 포맷이면 한 줄로 폴백
  }

  const coords = new Array(positions.length);
  const numLines = lineSizes.length;
  let idx = 0;
  lineSizes.forEach((size, lineIdx) => {
    const y = numLines === 1
      ? (OWN_HALF_BACK_Y + OWN_HALF_FRONT_Y) / 2
      : OWN_HALF_BACK_Y - ((OWN_HALF_BACK_Y - OWN_HALF_FRONT_Y) * lineIdx) / (numLines - 1);
    const hw = lineHalfWidth(size);
    for (let i = 0; i < size; i++) {
      const x = size === 1 ? 50 : 50 + hw - (2 * hw * i) / (size - 1);
      coords[idx] = { x, y };
      idx++;
    }
  });
  return coords;
}

export const GK_COORD = { x: 50, y: 92 };
