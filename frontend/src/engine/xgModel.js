import { SCENES } from '../data/squad';
import { effStats, heightBonus } from './stats';

function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

/**
 * 실점 장면 xG: 슈팅 지점(마크·태클·민첩) + 크로스 경로(마크·주력·키) 커버리지
 * players: { [id]: {data, x, y, prime} }, GK 제외
 */
export function calcConcededXG(players, inst, mentality) {
  const sc = SCENES.conceded;
  let coverShot = 0, coverCross = 0;
  for (const id in players) {
    const p = players[id];
    if (p.data.pref.includes('GK')) continue;
    const es = effStats(p);
    const mk = es[8] / 100, tk = es[9] / 100, ag = es[2] / 100, sp = es[0] / 100;
    const hb = Math.max(0, heightBonus(p.data.h));
    const dS = dist(p.x, p.y, sc.zoneMain.x, sc.zoneMain.y);
    const dC = dist(p.x, p.y, sc.zoneCross.x, sc.zoneCross.y);
    if (dS < 20) coverShot += (mk * 0.45 + tk * 0.30 + ag * 0.25) * (1 - dS / 20);
    if (dC < 18) coverCross += (mk * 0.40 + sp * 0.30 + hb * 0.35) * (1 - dC / 18);
  }
  let mod = 1;
  if (inst.line === 'low') mod *= 0.90;
  if (inst.line === 'high') mod *= 1.12;
  if (inst.press === 'counterpress') mod *= 0.95;
  if (inst.press === 'regroup') mod *= 1.03;
  if (mentality === 'defensive') mod *= 0.93;
  if (mentality === 'dominant') mod *= 1.06;
  const reduction = Math.min(0.82, coverShot * 0.30 + coverCross * 0.24);
  return Math.max(0.04, sc.baseXG * (1.35 - reduction) * mod);
}

/**
 * 득점 기회 xG: 헤더 낙하 지점(골결정력·위치선정·몸싸움·키) + 크로스(패스·시야)
 */
export function calcChanceXG(players, inst, mentality) {
  const sc = SCENES.chance;
  let attack = 0, crossQ = 0;
  for (const id in players) {
    const p = players[id];
    if (p.data.pref.includes('GK')) continue;
    const es = effStats(p);
    const fin = es[4] / 100, pos = es[3] / 100, str = es[1] / 100, pas = es[6] / 100, vis = es[7] / 100;
    const hb = Math.max(0, heightBonus(p.data.h));
    const dT = dist(p.x, p.y, sc.zoneMain.x, sc.zoneMain.y);
    const dC = dist(p.x, p.y, sc.zoneCross.x, sc.zoneCross.y);
    if (dT < 18) attack += (fin * 0.35 + pos * 0.28 + str * 0.15 + hb * 0.45) * (1 - dT / 18);
    if (dC < 14) crossQ = Math.max(crossQ, (pas * 0.60 + vis * 0.40) * (1 - dC / 14));
  }
  let mod = 1;
  if (inst.tempo === 'fast') mod *= 1.06;
  if (inst.transition === 'counter') mod *= 1.05;
  if (inst.line === 'high') mod *= 1.04;
  if (mentality === 'dominant') mod *= 1.05;
  if (mentality === 'defensive') mod *= 0.92;
  const gain = Math.min(0.50, attack * 0.16 + crossQ * 0.13);
  return Math.min(0.68, (sc.baseXG + gain) * mod);
}

/** 뒷문 공백: 자기 진영(y>62) 1:1 마크 자원 부족 시 상대 기대 득점 가산 */
export function defVacancyPenalty(players) {
  let backCover = 0;
  for (const id in players) {
    const p = players[id];
    if (p.data.pref.includes('GK')) continue;
    if (p.y > 62) backCover += effStats(p)[8] / 100;
  }
  return Math.max(0, 2.4 - backCover) * 0.12;
}

/** 포아송 분포 기반 승/무/패 확률 */
export function poissonWDL(lk, lr) {
  const F = [1, 1, 2, 6, 24, 120, 720];
  const P = (l, k) => Math.exp(-l) * Math.pow(l, k) / F[k];
  let w = 0, d = 0, l = 0;
  for (let a = 0; a <= 6; a++) {
    for (let b = 0; b <= 6; b++) {
      const p = P(lk, a) * P(lr, b);
      if (a > b) w += p; else if (a === b) d += p; else l += p;
    }
  }
  const s = w + d + l;
  return { w: w / s, d: d / s, l: l / s };
}

/**
 * 장면 종합 재계산.
 * savedXG: { conceded, chance } — 다른 장면 방문 기록 (없으면 실제값 사용)
 */
export function recalcAll(scene, players, inst, mentality, savedXG) {
  const sc = SCENES[scene];
  const xg = scene === 'conceded'
    ? calcConcededXG(players, inst, mentality)
    : calcChanceXG(players, inst, mentality);
  const nextSaved = { ...savedXG, [scene]: xg };
  const xgA = nextSaved.conceded ?? SCENES.conceded.actualXG;
  const xgB = nextSaved.chance ?? SCENES.chance.actualXG;
  const pen = defVacancyPenalty(players);
  const lk = 0.62 + xgB;
  const lr = 0.42 + xgA + pen;
  const { w, d, l } = poissonWDL(lk, lr);
  return { xg, sc, savedXG: nextSaved, xgA, xgB, w, d, l, pen };
}
