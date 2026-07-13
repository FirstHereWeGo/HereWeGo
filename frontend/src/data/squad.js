/**
 * PRIME REWIND — 선수/스쿼드/포메이션 데이터
 * 스탯 인덱스: [0주력, 1몸싸움, 2민첩성, 3위치선정, 4골결정력, 5드리블, 6패스, 7시야, 8일대일마크, 9태클]
 * 모든 선수가 10개 스탯을 공통으로 보유. 팀 자체 산정치 (기획서 5-2).
 */

export const STAT_NAMES = ['주력', '몸싸움', '민첩성', '위치선정', '골결정력', '드리블', '패스', '시야', '1:1 마크', '태클'];

// 포지션별 대표 스탯 인덱스 (카드에서 강조)
export const KEY_STATS = {
  GK: [2, 3],
  DF: [8, 9, 1],
  MF: [6, 7, 0],
  WG: [5, 0, 2],
  ST: [3, 4, 1],
};

export const ROLE_KR = { GK: '골키퍼', DF: '수비수', MF: '미드필더', WG: '윙어', ST: '스트라이커' };

export const PRIME_BOOST = 0.15;      // 전성기: 전 스탯 +15%, 나이는 피크(27세)로 간주
export const OFFROLE_PENALTY = 0.92;  // 선호 포지션이 아닌 배치 시 전 스탯 -8%
export const GK_MISMATCH = 0.80;      // GK ↔ 필드 오배치 시 -20%

// ---------- 대한민국 선수 DB (키·나이 필수) ----------
export const SQUAD = {
  kimSG:   { no: 1,  name: '김승규',      pref: ['GK'],       h: 187, age: 35, star: false,
             stats: [40, 70, 62, 30, 15, 25, 60, 58, 45, 40] },
  leeKH:   { no: 3,  name: '이기혁',      pref: ['DF'],       h: 186, age: 25, star: false,
             stats: [72, 80, 66, 45, 30, 40, 62, 58, 80, 78] },
  kimMJ:   { no: 4,  name: '김민재',      pref: ['DF'],       h: 190, age: 29, star: true,
             stats: [80, 92, 74, 55, 38, 45, 74, 70, 94, 90] },
  leeHB:   { no: 2,  name: '이한범',      pref: ['DF'],       h: 188, age: 24, star: false,
             stats: [70, 84, 64, 44, 28, 38, 64, 56, 82, 79] },
  castrop: { no: 23, name: '카스트로프',  pref: ['MF', 'DF'], h: 180, age: 23, star: false,
             stats: [78, 74, 76, 58, 55, 68, 80, 76, 68, 72] },
  hwangIB: { no: 6,  name: '황인범',      pref: ['MF'],       h: 177, age: 29, star: false,
             stats: [68, 66, 74, 62, 58, 72, 88, 86, 60, 62] },
  kimJG:   { no: 24, name: '김진규',      pref: ['MF'],       h: 177, age: 29, star: false,
             stats: [70, 64, 72, 56, 52, 70, 80, 78, 58, 60] },
  seolYW:  { no: 22, name: '설영우',      pref: ['DF', 'MF'], h: 180, age: 27, star: false,
             stats: [82, 72, 78, 52, 42, 66, 74, 70, 78, 76] },
  sonHM:   { no: 7,  name: '손흥민',      pref: ['WG', 'ST'], h: 183, age: 33, star: true,
             stats: [84, 70, 84, 88, 94, 84, 84, 82, 40, 38] },
  leeKI:   { no: 19, name: '이강인',      pref: ['WG', 'MF'], h: 173, age: 25, star: true,
             stats: [72, 58, 86, 74, 78, 90, 92, 90, 42, 40] },
  ohHG:    { no: 18, name: '오현규',      pref: ['ST'],       h: 185, age: 25, star: false,
             stats: [80, 84, 72, 76, 74, 62, 58, 56, 44, 42] },
  parkJS:  { no: 16, name: '박진섭',      pref: ['DF', 'MF'], h: 182, age: 30, star: false,
             stats: [66, 82, 68, 50, 40, 44, 72, 70, 84, 86] },
  choGS:   { no: 9,  name: '조규성',      pref: ['ST'],       h: 189, age: 28, star: false,
             stats: [74, 88, 66, 80, 78, 56, 60, 58, 48, 46] },
  // 교체 아웃 (재투입 불가 — 벤치 표기용)
  hwangHC: { no: 11, name: '황희찬',      pref: ['WG', 'ST'], h: 177, age: 30, star: true,
             stats: [86, 78, 82, 74, 80, 80, 70, 68, 44, 42] },
  baekSH:  { no: 8,  name: '백승호',      pref: ['MF'],       h: 182, age: 29, star: false,
             stats: [66, 72, 66, 58, 62, 64, 84, 80, 62, 64] },
  leeTS:   { no: 13, name: '이태석',      pref: ['DF', 'MF'], h: 174, age: 23, star: false,
             stats: [80, 62, 80, 46, 36, 68, 72, 66, 72, 70] },
};

// ---------- 장면별 스쿼드 (시간대 반영) ----------
// x,y: 피치 % 좌표 (y: 0=상대 골문, 100=우리 골문)
export const LINEUPS = {
  conceded: { // 63' — 3-4-2-1, 전반 교체 3장 완료
    onfield: [
      ['kimSG', 50, 92], ['leeKH', 30, 78], ['kimMJ', 50, 80], ['leeHB', 70, 78],
      ['castrop', 12, 58], ['hwangIB', 40, 62], ['kimJG', 60, 62], ['seolYW', 88, 58],
      ['sonHM', 35, 32], ['leeKI', 65, 32], ['ohHG', 50, 20],
    ],
    bench: [
      { id: 'parkJS', status: 'ok' }, { id: 'choGS', status: 'ok' },
      { id: 'hwangHC', status: 'out', note: "45' 교체 아웃" },
      { id: 'baekSH',  status: 'out', note: "45' 교체 아웃" },
      { id: 'leeTS',   status: 'out', note: "45' 교체 아웃" },
    ],
    subsLeft: 2,
  },
  chance: { // 90'+3 — 5장 소진, 총공세 배치
    onfield: [
      ['kimSG', 50, 90], ['leeKH', 34, 62], ['parkJS', 52, 16], ['leeHB', 62, 55],
      ['castrop', 85, 20], ['hwangIB', 55, 38], ['kimJG', 40, 42], ['seolYW', 74, 34],
      ['sonHM', 38, 18], ['leeKI', 60, 26], ['choGS', 48, 14],
    ],
    bench: [
      { id: 'hwangHC', status: 'out', note: "45' 교체 아웃" },
      { id: 'baekSH',  status: 'out', note: "45' 교체 아웃" },
      { id: 'leeTS',   status: 'out', note: "45' 교체 아웃" },
      { id: 'kimMJ',   status: 'out', note: "65' 교체 아웃" },
      { id: 'ohHG',    status: 'out', note: "74' 교체 아웃" },
    ],
    subsLeft: 0,
  },
};

// ---------- 남아공 (장면별 관련 선수만, 조작 불가) ----------
export const OPP_SCENE = {
  conceded: [
    { no: 12, name: '마세코',  x: 56, y: 83 },
    { no: 8,  name: '모레미',  x: 10, y: 74 },
    { no: 17, name: '막고파',  x: 45, y: 70 },
    { no: 10, name: '모포켕',  x: 64, y: 66 },
  ],
  chance: [
    { no: 1,  name: '윌리엄스', x: 50, y: 5, gk: true },
    { no: 20, name: '무다우',   x: 30, y: 10 },
    { no: 21, name: '오콘',     x: 42, y: 9 },
    { no: 14, name: '음보카지', x: 56, y: 9 },
    { no: 6,  name: '모디바',   x: 70, y: 11 },
    { no: 5,  name: '음바타',   x: 45, y: 20 },
    { no: 13, name: '시툴레',   x: 62, y: 22 },
  ],
};

// ---------- 장면 정의 (xG 존, 라벨) ----------
export const SCENES = {
  conceded: {
    label: "실점 장면 리와인드 · 63'", clock: '63:00',
    baseXG: 0.34, actualXG: 0.34,
    zoneMain: { x: 56, y: 84, r: 11, color: 0xef5350, lbl: '마세코 슈팅 지점' },
    zoneCross: { x: 11, y: 76, r: 8, color: 0xef5350, lbl: '모레미 크로스' },
    xgLabel: '남아공 슈팅 xG', lowerIsBetter: true,
    gaugeTitle: '이 장면의 실점 위험 (xG)',
  },
  chance: {
    label: "득점 기회 리와인드 · 90'+3", clock: '90:00 +3',
    baseXG: 0.07, actualXG: 0.07,
    zoneMain: { x: 47, y: 11, r: 10, color: 0x34e07a, lbl: '헤더 낙하 지점' },
    zoneCross: { x: 87, y: 19, r: 8, color: 0x34e07a, lbl: '카스트로프 크로스' },
    xgLabel: '대한민국 찬스 xG', lowerIsBetter: false,
    gaugeTitle: '이 장면의 득점 기대 (xG)',
  },
};

// ---------- 포메이션 슬롯 (아웃필드 10명, role은 자동배정 기준) ----------
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
