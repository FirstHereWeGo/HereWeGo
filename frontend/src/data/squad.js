/**
 * PRIME REWIND — 선수/스쿼드/포메이션 데이터 (풀매치 시뮬레이션)
 * 스탯 인덱스: [0주력, 1몸싸움, 2민첩성, 3위치선정, 4골결정력, 5드리블, 6패스, 7시야, 8일대일마크, 9태클]
 */

export const STAT_NAMES = ['주력', '몸싸움', '민첩성', '위치선정', '골결정력', '드리블', '패스', '시야', '1:1 마크', '태클'];
export const KEY_STATS = { GK: [2, 3], DF: [8, 9, 1], MF: [6, 7, 0], WG: [5, 0, 2], ST: [3, 4, 1] };
export const ROLE_KR = { GK: '골키퍼', DF: '수비수', MF: '미드필더', WG: '윙어', ST: '스트라이커' };

export const PRIME_BOOST = 0.15;
export const OFFROLE_PENALTY = 0.92;
export const GK_MISMATCH = 0.80;

// ---------- 대한민국 선수 DB ----------
export const SQUAD = {
  kimSG:   { no: 1,  name: '김승규',      pref: ['GK'],       h: 187, age: 35, star: false,
             stats: [40, 70, 62, 30, 15, 25, 60, 58, 45, 40] },
  leeKH:   { no: 3,  name: '이기혁',      pref: ['DF'],       h: 186, age: 25, star: false,
             stats: [72, 80, 66, 45, 30, 40, 62, 58, 80, 78] },
  kimMJ:   { no: 4,  name: '김민재',      pref: ['DF'],       h: 190, age: 29, star: true,
             stats: [80, 92, 74, 55, 38, 45, 74, 70, 94, 90] },
  leeHB:   { no: 2,  name: '이한범',      pref: ['DF'],       h: 188, age: 24, star: false,
             stats: [70, 84, 64, 44, 28, 38, 64, 56, 82, 79] },
  leeTS:   { no: 13, name: '이태석',      pref: ['DF', 'MF'], h: 174, age: 23, star: false,
             stats: [80, 62, 80, 46, 36, 68, 72, 66, 72, 70] },
  hwangIB: { no: 6,  name: '황인범',      pref: ['MF'],       h: 177, age: 29, star: false,
             stats: [68, 66, 74, 62, 58, 72, 88, 86, 60, 62] },
  baekSH:  { no: 8,  name: '백승호',      pref: ['MF'],       h: 182, age: 29, star: false,
             stats: [66, 72, 66, 58, 62, 64, 84, 80, 62, 64] },
  seolYW:  { no: 22, name: '설영우',      pref: ['DF', 'MF'], h: 180, age: 27, star: false,
             stats: [82, 72, 78, 52, 42, 66, 74, 70, 78, 76] },
  hwangHC: { no: 11, name: '황희찬',      pref: ['WG', 'ST'], h: 177, age: 30, star: true,
             stats: [86, 78, 82, 74, 80, 80, 70, 68, 44, 42] },
  leeKI:   { no: 19, name: '이강인',      pref: ['WG', 'MF'], h: 173, age: 25, star: true,
             stats: [72, 58, 86, 74, 78, 90, 92, 90, 42, 40] },
  ohHG:    { no: 18, name: '오현규',      pref: ['ST'],       h: 185, age: 25, star: false,
             stats: [80, 84, 72, 76, 74, 62, 58, 56, 44, 42] },
  // ----- 벤치 (실제 교체 자원 5명) -----
  sonHM:   { no: 7,  name: '손흥민',      pref: ['WG', 'ST'], h: 183, age: 33, star: true,
             stats: [84, 70, 84, 88, 94, 84, 84, 82, 40, 38] },
  kimJG:   { no: 24, name: '김진규',      pref: ['MF'],       h: 177, age: 29, star: false,
             stats: [70, 64, 72, 56, 52, 70, 80, 78, 58, 60] },
  castrop: { no: 23, name: '카스트로프',  pref: ['MF', 'DF'], h: 180, age: 23, star: false,
             stats: [78, 74, 76, 58, 55, 68, 80, 76, 68, 72] },
  parkJS:  { no: 16, name: '박진섭',      pref: ['DF', 'MF'], h: 182, age: 30, star: false,
             stats: [66, 82, 68, 50, 40, 44, 72, 70, 84, 86] },
  choGS:   { no: 9,  name: '조규성',      pref: ['ST'],       h: 189, age: 28, star: false,
             stats: [74, 88, 66, 80, 78, 56, 60, 58, 48, 46] },
};

// ---------- 킥오프 라인업 (실제 선발 3-4-2-1, 감독 홍명보) ----------
export const KOR_STARTING = [
  ['kimSG', 50, 92],
  ['leeKH', 30, 78], ['kimMJ', 50, 80], ['leeHB', 70, 78],
  ['leeTS', 12, 58], ['hwangIB', 40, 62], ['baekSH', 60, 62], ['seolYW', 88, 58],
  ['hwangHC', 35, 32], ['leeKI', 65, 32],
  ['ohHG', 50, 20],
];
export const KOR_BENCH = ['sonHM', 'kimJG', 'castrop', 'parkJS', 'choGS'];
export const MAX_SUBS = 5;

// ---------- 남아공 선발 (4-2-3-1, 감독 브루스) + 실제 교체 스케줄 ----------
// y: 0=남아공 골문 쪽(상단), 100=대한민국 골문 쪽
export const OPP_LINEUP = [
  { no: 1,  name: '윌리엄스', x: 50, y: 6,  gk: true },
  { no: 20, name: '무다우',   x: 82, y: 20 },
  { no: 21, name: '오콘',     x: 60, y: 17 },
  { no: 14, name: '음보카지', x: 40, y: 17 },
  { no: 6,  name: '모디바',   x: 18, y: 20 },
  { no: 5,  name: '음바타',   x: 42, y: 34 },
  { no: 13, name: '시툴레',   x: 60, y: 34 },
  { no: 12, name: '마세코',   x: 20, y: 52 },
  { no: 10, name: '모포켕',   x: 50, y: 48 },
  { no: 7,  name: '아폴리스', x: 80, y: 52 },
  { no: 17, name: '막고파',   x: 50, y: 64 },
];
// 실제 남아공 교체: 62' 모레미(아폴리스), 75' 레이너스(마세코), 80' 아담스(모포켕)
export const OPP_SUBS = [
  { minute: 62, outName: '아폴리스', inNo: 8,  inName: '모레미' },
  { minute: 75, outName: '마세코',   inNo: 15, inName: '레이너스' },
  { minute: 80, outName: '모포켕',   inNo: 23, inName: '아담스' },
];

// ---------- 역사적 앵커 이벤트 존 (그 경기의 실제 순간) ----------
export const ANCHOR_ZONES = {
  maseko63: { // 후반 18분 마세코 결승골 — 남아공 공격
    cross:  { x: 11, y: 76 },
    target: { x: 56, y: 84 },
    label: "63' 그 순간 — 모레미 크로스 → 마세코",
  },
  header90: { // 추가시간 박진섭 헤더 — 대한민국 공격
    cross:  { x: 87, y: 19 },
    target: { x: 47, y: 11 },
    label: "90'+3 그 순간 — 오른쪽 크로스 → 헤더",
  },
};

// (xgModel 호환용) 앵커 계산에 쓰는 장면 상수
export const SCENES = {
  conceded: {
    baseXG: 0.34, actualXG: 0.34,
    zoneMain: ANCHOR_ZONES.maseko63.target,
    zoneCross: ANCHOR_ZONES.maseko63.cross,
  },
  chance: {
    baseXG: 0.07, actualXG: 0.07,
    zoneMain: ANCHOR_ZONES.header90.target,
    zoneCross: ANCHOR_ZONES.header90.cross,
  },
};

// ---------- 포메이션 슬롯 ----------
export const FORMATIONS = {
  '3-4-2-1': [
    { x: 30, y: 78, role: 'DF' }, { x: 50, y: 80, role: 'DF' }, { x: 70, y: 78, role: 'DF' },
    { x: 12, y: 58, role: 'MF' }, { x: 40, y: 62, role: 'MF' }, { x: 60, y: 62, role: 'MF' }, { x: 88, y: 58, role: 'MF' },
    { x: 35, y: 32, role: 'WG' }, { x: 65, y: 32, role: 'WG' }, { x: 50, y: 20, role: 'ST' },
  ],
  '4-2-3-1': [
    { x: 15, y: 76, role: 'DF' }, { x: 38, y: 79, role: 'DF' }, { x: 62, y: 79, role: 'DF' }, { x: 85, y: 76, role: 'DF' },
    { x: 40, y: 62, role: 'MF' }, { x: 60, y: 62, role: 'MF' },
    { x: 15, y: 34, role: 'WG' }, { x: 50, y: 42, role: 'MF' }, { x: 85, y: 34, role: 'WG' },
    { x: 50, y: 20, role: 'ST' },
  ],
  '4-3-3': [
    { x: 15, y: 76, role: 'DF' }, { x: 38, y: 79, role: 'DF' }, { x: 62, y: 79, role: 'DF' }, { x: 85, y: 76, role: 'DF' },
    { x: 50, y: 64, role: 'MF' }, { x: 32, y: 52, role: 'MF' }, { x: 68, y: 52, role: 'MF' },
    { x: 15, y: 32, role: 'WG' }, { x: 85, y: 32, role: 'WG' }, { x: 50, y: 20, role: 'ST' },
  ],
  '4-4-2': [
    { x: 15, y: 76, role: 'DF' }, { x: 38, y: 79, role: 'DF' }, { x: 62, y: 79, role: 'DF' }, { x: 85, y: 76, role: 'DF' },
    { x: 12, y: 52, role: 'MF' }, { x: 40, y: 58, role: 'MF' }, { x: 60, y: 58, role: 'MF' }, { x: 88, y: 52, role: 'MF' },
    { x: 40, y: 24, role: 'ST' }, { x: 60, y: 24, role: 'ST' },
  ],
  '3-5-2': [
    { x: 30, y: 78, role: 'DF' }, { x: 50, y: 80, role: 'DF' }, { x: 70, y: 78, role: 'DF' },
    { x: 10, y: 52, role: 'MF' }, { x: 35, y: 60, role: 'MF' }, { x: 50, y: 64, role: 'MF' }, { x: 65, y: 60, role: 'MF' }, { x: 90, y: 52, role: 'MF' },
    { x: 40, y: 24, role: 'ST' }, { x: 60, y: 24, role: 'ST' },
  ],
};
