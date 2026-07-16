/**
 * 풀매치 시뮬레이션 엔진 (순수 로직, 렌더링 비의존)
 * - 분 단위 확률로 찬스 발생, 찬스별 xG 샘플링, 골 판정
 * - 63' 마세코 / 90'+2 헤더는 역사적 앵커 이벤트로 고정 발생 (xG는 현재 전술 반영)
 * - 실시간 승/무/패 확률: 남은 시간 기대득점 포아송 + 현재 스코어
 */
import { effStats, roleAt } from './stats';
import { calcConcededXG, calcChanceXG, defVacancyPenalty } from './xgModel';

export const MATCH_END = 94;      // 90' + 추가시간 4'
export const HALF_TIME = 45;

// ---------- 전술/스쿼드 기반 팀 레이트 ----------
export function computeRates(korPlayers, inst, mentality) {
  // 공격 자원 평가: 전방(y<45) 선수들의 공격 스탯 평균
  let atkSum = 0, atkN = 0;
  let primeForwards = 0;
  for (const id in korPlayers) {
    const p = korPlayers[id];
    if (p.data.pref.includes('GK')) continue;
    if (p.y < 45) {
      const es = effStats(p);
      atkSum += (es[4] + es[3] + es[0]) / 3;
      atkN++;
      if (p.prime) primeForwards++;
    }
  }
  const atkQ = atkN ? atkSum / atkN / 75 : 0.9; // 75 기준 정규화

  let korPerMin = 9 / 90;   // 기본 경기당 9회 찬스
  let rsaPerMin = 8.5 / 90;
  let korQ = 1, rsaQ = 1;

  if (mentality === 'dominant')  { korPerMin *= 1.15; rsaPerMin *= 1.08; }
  if (mentality === 'defensive') { korPerMin *= 0.80; rsaPerMin *= 0.85; korQ *= 0.95; }
  if (mentality === 'counter')   { korQ *= 1.08; rsaPerMin *= 0.95; }
  if (inst.tempo === 'fast')          { korPerMin *= 1.10; }
  if (inst.line === 'high')           { korPerMin *= 1.05; rsaQ *= 1.12; }
  if (inst.line === 'low')            { korPerMin *= 0.92; rsaQ *= 0.88; }
  if (inst.press === 'counterpress')  { korPerMin *= 1.05; rsaQ *= 0.95; }
  if (inst.transition === 'counter')  { korQ *= 1.05; }

  korQ *= 0.85 + atkQ * 0.25 + primeForwards * 0.06;
  rsaQ *= 1 + defVacancyPenalty(korPlayers) * 1.5; // 뒷문 공백 시 상대 찬스 질 상승

  return { korPerMin, rsaPerMin, korQ, rsaQ };
}

// ---------- 분당 찬스 발생 판정 ----------
export function rollChanceAt(rates, rng = Math.random) {
  if (rng() < rates.korPerMin) return 'kor';
  if (rng() < rates.rsaPerMin) return 'rsa';
  return null;
}

// ---------- 찬스 xG 샘플링 (저품질 위주 분포) ----------
export function sampleChanceXG(side, rates, rng = Math.random) {
  const q = side === 'kor' ? rates.korQ : rates.rsaQ;
  const base = 0.04 + Math.pow(rng(), 2.5) * 0.30;
  return Math.max(0.02, Math.min(0.65, base * q));
}

// ---------- 역사적 앵커 이벤트 ----------
export function anchorAt(minute, done) {
  if (minute >= 63 && !done.maseko63) return 'maseko63';
  if (minute >= 92 && !done.header90) return 'header90';
  return null;
}
export function anchorXG(anchor, korPlayers, inst, mentality) {
  if (anchor === 'maseko63') return calcConcededXG(korPlayers, inst, mentality); // RSA 찬스
  return calcChanceXG(korPlayers, inst, mentality); // KOR 찬스
}

// ---------- 실시간 승/무/패 ----------
export function liveWDL(score, minute, rates) {
  const remain = Math.max(0, MATCH_END - minute);
  // 남은 시간 동안의 기대 득점 = 분당 찬스율 × 평균 xG(≈0.115 × 질 보정) × 남은 분
  const lkAdj = rates.korPerMin * remain * 0.115 * rates.korQ;
  const lrAdj = rates.rsaPerMin * remain * 0.115 * rates.rsaQ;
  const F = [1, 1, 2, 6, 24, 120, 720];
  const P = (l, k) => Math.exp(-l) * Math.pow(l, k) / F[k];
  let w = 0, d = 0, l = 0;
  for (let a = 0; a <= 5; a++) {
    for (let b = 0; b <= 5; b++) {
      const p = P(lkAdj, a) * P(lrAdj, b);
      const fk = score.kor + a, fr = score.rsa + b;
      if (fk > fr) w += p; else if (fk === fr) d += p; else l += p;
    }
  }
  const s = w + d + l || 1;
  return { w: w / s, d: d / s, l: l / s };
}

// ---------- 랜덤 찬스 존 생성 ----------
export function randomChanceZones(side, rng = Math.random) {
  if (side === 'kor') {
    return {
      cross:  { x: rng() < 0.5 ? 12 : 88, y: 16 + rng() * 8 },
      target: { x: 38 + rng() * 24, y: 9 + rng() * 7 },
    };
  }
  return {
    cross:  { x: rng() < 0.5 ? 12 : 88, y: 76 + rng() * 6 },
    target: { x: 38 + rng() * 24, y: 82 + rng() * 7 },
  };
}

// ---------- 찬스 설명 텍스트 ----------
const KOR_VERBS = ['측면 돌파 후 크로스', '역습 전개', '세컨볼 슈팅 기회', '침투 패스 연결', '코너 세컨볼'];
const RSA_VERBS = ['측면 크로스', '역습 찬스', '중거리 슈팅 기회', '뒷공간 침투', '프리킥 세컨볼'];
export function chanceLabel(side, rng = Math.random) {
  const list = side === 'kor' ? KOR_VERBS : RSA_VERBS;
  return list[Math.floor(rng() * list.length)];
}
