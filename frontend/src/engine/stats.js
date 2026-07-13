import { PRIME_BOOST, OFFROLE_PENALTY, GK_MISMATCH } from '../data/squad';

/**
 * 현재 배치 좌표 → 역할 판정
 * y: 0=상대 골문, 100=우리 골문
 */
export function roleAt(x, y) {
  if (y > 86) return 'GK';
  if (y > 64) return 'DF';
  if (y >= 40) return 'MF';
  return (x <= 36 || x >= 64) ? 'WG' : 'ST';
}

/** 나이 보정: 피크 23~29세, 이후/이전은 신체 스탯만 감소 */
export function ageMod(age) {
  return 1 - Math.max(0, age - 29) * 0.012 - Math.max(0, 22 - age) * 0.01;
}

/** player = { data: SQUAD 항목, x, y, prime } */
export function roleInfo(player) {
  const role = roleAt(player.x, player.y);
  const gkNow = role === 'GK';
  const gkPref = player.data.pref.includes('GK');
  let posMod = 1;
  let fit = 'ok';
  if (gkNow !== gkPref) {
    posMod = GK_MISMATCH;
    fit = 'gk';
  } else if (!gkPref && !player.data.pref.includes(role)) {
    posMod = OFFROLE_PENALTY;
    fit = 'off';
  }
  return { role, posMod, fit };
}

/**
 * 최종 능력치 = 나이 보정(신체 스탯만) → 전성기(+15%, 나이 피크 간주) → 포지션 부적응
 */
export function effStats(player) {
  const { posMod } = roleInfo(player);
  const a = ageMod(player.prime ? 27 : player.data.age);
  return player.data.stats.map((v, i) => {
    let s = v;
    if (i < 3) s *= a;              // 주력/몸싸움/민첩성만 나이 영향
    if (player.prime) s *= (1 + PRIME_BOOST);
    s *= posMod;
    return Math.min(99, Math.round(s));
  });
}

/** 공중볼 경합 보정 (키 178cm 기준, 190cm ≈ +0.2) */
export function heightBonus(h) {
  return (h - 178) / 60;
}
