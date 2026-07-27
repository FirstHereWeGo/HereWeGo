import { layoutFormation, GK_COORD } from './formationLayout';

/**
 * 전술 옵션 호버 프리뷰용 데이터.
 *
 * 좌표계: x, y 모두 0~100(%). x는 왼쪽(0)→오른쪽(100), y는 우리 진영 골라인(0)→상대 진영 골라인(100).
 * layoutFormation()은 실제 경기 시작 배치용이라 두 팀이 겹치지 않도록 우리 진영 절반 안에만
 * 선수를 두지만(GK~최전방 라인이 좁은 범위에 몰림), 이 프리뷰는 상대팀이 없는 단독 미니 피치라
 * 그럴 필요가 없다 — buildBaseSlots에서 그 좁은 범위를 피치 전체(0~100)로 늘려 편다.
 *
 * 슬롯은 고정된 이름(cb1/lb 등)이 아니라 실제 선택된 포메이션의 role(GK/CB/FB/WB/DM/CM/AM/WG/ST)과
 * 좌표를 그대로 쓴다 — 포메이션이 바뀌면 프리뷰의 기본 배치도 그 포메이션 모양으로 함께 바뀐다.
 * 전술 옵션 오버라이드도 "왼쪽 풀백" 같은 고정 슬롯이 아니라 role/좌우 위치로 대상을 찾기 때문에
 * 어떤 포메이션(백3/4/5, 윙어 유무 등)이 선택돼 있어도 동작한다.
 */

/** 포메이션 데이터가 아직 없을 때만 쓰는 대체용 기본 배치(4-3-3 형태). */
export const FALLBACK_BASE_SLOTS = [
  { role: 'GK', x: 50, y: 5 },
  { role: 'CB', x: 38, y: 20 }, { role: 'CB', x: 62, y: 20 },
  { role: 'FB', x: 15, y: 32 }, { role: 'FB', x: 85, y: 32 },
  { role: 'CM', x: 35, y: 50 }, { role: 'CM', x: 50, y: 45 }, { role: 'CM', x: 65, y: 50 },
  { role: 'WG', x: 18, y: 75 }, { role: 'WG', x: 82, y: 75 },
  { role: 'ST', x: 50, y: 85 },
];

const PITCH_MARGIN = 4; // 골라인에 점이 딱 붙어 잘려 보이지 않도록 위아래로 살짝 여백

/** rawY(작을수록 전방)를 GK~최전방 라인 범위 기준으로 0~100 전체 피치 깊이에 펴서 매핑한다. */
function stretchY(rawY, rawMin, rawMax) {
  const span = rawMax - rawMin;
  const advancement = span > 0 ? (rawMax - rawY) / span : 0.5; // 0=GK(최후방), 1=최전방 라인
  return PITCH_MARGIN + advancement * (100 - 2 * PITCH_MARGIN);
}

/** 실제 Formation({id, positions})을 프리뷰용 슬롯 배열({role,x,y}[])로 변환한다. */
export function buildBaseSlots(formation) {
  const coords = layoutFormation(formation);
  const rawYs = [GK_COORD.y, ...coords.map(c => c.y)];
  const rawMin = Math.min(...rawYs);
  const rawMax = Math.max(...rawYs);
  const slots = formation.positions.map((role, i) => ({
    role,
    x: coords[i].x,
    y: stretchY(coords[i].y, rawMin, rawMax),
  }));
  slots.unshift({ role: 'GK', x: GK_COORD.x, y: stretchY(GK_COORD.y, rawMin, rawMax) });
  return slots;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/** slots 중 target과 같은 객체(참조)만 patch를 덮어써서 교체한 새 배열을 반환한다. */
function mapSlot(slots, target, patch) {
  if (!target) return slots;
  return slots.map(s => (s === target ? { ...s, ...patch(s) } : s));
}

const WIDE_DEFENDER = new Set(['FB', 'WB']);
const CENTRAL_MID = new Set(['DM', 'CM', 'AM']);

function widePlayer(slots, side, roles) {
  const pool = slots.filter(s => roles.has(s.role) && (side === 'L' ? s.x < 50 : s.x > 50));
  if (!pool.length) return null;
  return side === 'L' ? pool.reduce((a, b) => (a.x < b.x ? a : b)) : pool.reduce((a, b) => (a.x > b.x ? a : b));
}

/** 크로스 담당 기준 선수 — 윙어가 있으면 윙어, 없으면(백3/4-3-1-2 등) 그 자리를 대신하는 풀백/윙백. */
function wideCrossRef(slots, side) {
  return widePlayer(slots, side, new Set(['WG'])) || widePlayer(slots, side, WIDE_DEFENDER);
}

function deepestCentralMid(slots) {
  const pool = slots.filter(s => CENTRAL_MID.has(s.role));
  if (!pool.length) return null;
  return pool.reduce((a, b) => (a.y < b.y ? a : b));
}

function applyOverlap(slots, side) {
  const fb = widePlayer(slots, side, WIDE_DEFENDER);
  if (!fb) return slots;
  const dirWide = side === 'L' ? -1 : 1;
  let s = mapSlot(slots, fb, m => ({ x: clamp(m.x + dirWide * 3, 2, 98), y: clamp(m.y + 26, 2, 98) }));
  const wg = widePlayer(slots, side, new Set(['WG']));
  if (wg) {
    const dirIn = side === 'L' ? 1 : -1;
    s = mapSlot(s, wg, m => ({ x: clamp(m.x + dirIn * 8, 2, 98) }));
  }
  return s;
}

function applyCross(slots, { advance, widen = 0, stAdvance = 0 }) {
  const left = wideCrossRef(slots, 'L');
  const right = wideCrossRef(slots, 'R');
  let s = mapSlot(slots, left, m => ({ x: clamp(m.x - widen, 2, 98), y: clamp(m.y + advance, 2, 98) }));
  s = mapSlot(s, right, m => ({ x: clamp(m.x + widen, 2, 98), y: clamp(m.y + advance, 2, 98) }));
  const st = slots.find(sl => sl.role === 'ST');
  if (st) s = mapSlot(s, st, m => ({ y: clamp(m.y + stAdvance, 2, 98) }));
  return s;
}

/** 중앙(x=50) 기준으로 모든 필드 플레이어를 factor배 만큼 벌리거나(>1) 좁힌다(<1). GK는 그대로. */
function applyWidth(slots, factor) {
  return slots.map(sl => {
    if (sl.role === 'GK') return sl;
    return { ...sl, x: clamp(50 + (sl.x - 50) * factor, 3, 97) };
  });
}

/** GK를 제외한 필드 플레이어들의 y 분포(라인 간격/순서는 유지)를 [targetMin,targetMax] 구간에 다시 맞춘다. */
function compressToBand(slots, targetMin, targetMax) {
  const outfield = slots.filter(sl => sl.role !== 'GK');
  const ys = outfield.map(sl => sl.y);
  const curMin = Math.min(...ys);
  const curMax = Math.max(...ys);
  const curSpan = curMax - curMin || 1;
  const targetSpan = targetMax - targetMin;
  return slots.map(sl => {
    if (sl.role === 'GK') return sl;
    const t = (sl.y - curMin) / curSpan;
    return { ...sl, y: targetMin + t * targetSpan };
  });
}

/**
 * 전술 옵션 key -> { description, transform(baseSlots) }.
 * transform은 baseSlots를 받아 일부 슬롯의 x/y만 바꾼 새 배열을 반환하는 순수 함수다.
 * 새 항목(템포/압박/오프사이드 트랩 등)을 추가할 땐 이 객체에 같은 패턴으로 key를 늘리기만 하면 된다.
 */
export const TACTIC_PREVIEWS = {
  // ── 빌드업 방식 ──────────────────────────────
  'buildup-short': {
    description: '짧은 패스로 후방부터 안전하게 볼을 운반합니다.',
    transform: (slots) => {
      let s = slots.map(sl => {
        if (sl.role === 'CB') {
          const dir = sl.x <= 50 ? -1 : 1;
          return { ...sl, x: clamp(sl.x + dir * 7, 3, 97), y: clamp(sl.y - 3, 2, 98) };
        }
        if (WIDE_DEFENDER.has(sl.role)) {
          const dir = sl.x <= 50 ? 1 : -1;
          return { ...sl, x: clamp(sl.x + dir * 8, 3, 97), y: clamp(sl.y - 5, 2, 98) };
        }
        return sl;
      });
      const dm = deepestCentralMid(s);
      s = mapSlot(s, dm, m => ({ x: 50, y: clamp(m.y - 7, 2, 98) }));
      return s;
    },
  },
  'buildup-mixed': {
    description: '상황에 따라 짧은 패스와 롱볼을 섞어 사용합니다.',
    transform: (slots) => {
      const dm = deepestCentralMid(slots);
      return mapSlot(slots, dm, m => ({ y: clamp(m.y - 4, 2, 98) }));
    },
  },
  'buildup-direct': {
    description: '수비 라인에서 최전방으로 빠르게 롱볼을 연결합니다.',
    transform: (slots) => slots.map(sl => {
      if (sl.role === 'CB') return { ...sl, y: clamp(sl.y + 3, 2, 98) };
      if (CENTRAL_MID.has(sl.role)) return { ...sl, y: clamp(sl.y + 4, 2, 98) };
      if (sl.role === 'WG') return { ...sl, y: clamp(sl.y + 6, 2, 98) };
      if (sl.role === 'ST') return { ...sl, y: clamp(sl.y - 5, 2, 98) };
      return sl;
    }),
  },

  // ── 오버래핑 ────────────────────────────────
  'overlapL-on': {
    description: '왼쪽 풀백이 높이 전진해 측면 공격을 지원합니다.',
    transform: (slots) => applyOverlap(slots, 'L'),
  },
  'overlapL-off': {
    description: '왼쪽 풀백이 수비 위치를 유지합니다.',
    transform: (slots) => slots,
  },
  'overlapR-on': {
    description: '오른쪽 풀백이 높이 전진해 측면 공격을 지원합니다.',
    transform: (slots) => applyOverlap(slots, 'R'),
  },
  'overlapR-off': {
    description: '오른쪽 풀백이 수비 위치를 유지합니다.',
    transform: (slots) => slots,
  },

  // ── 크로스 방식 ──────────────────────────────
  'cross-low': {
    description: '측면 깊숙한 곳에서 낮고 빠른 크로스를 올립니다.',
    transform: (slots) => applyCross(slots, { advance: 17, widen: 6, stAdvance: 3 }),
  },
  'cross-mixed': {
    description: '상황에 맞춰 낮은 크로스와 높은 크로스를 혼용합니다.',
    transform: (slots) => applyCross(slots, { advance: 9, stAdvance: 2 }),
  },
  'cross-high': {
    description: '박스 안으로 높은 크로스를 올려 타겟을 노립니다.',
    transform: (slots) => applyCross(slots, { advance: 6, widen: -6, stAdvance: 6 }),
  },

  // ── 수비 대형 ──────────────────────────────
  'shape-narrow': {
    description: '수비 대형을 좁혀 중앙 공간을 단단하게 지킵니다.',
    transform: (slots) => applyWidth(slots, 0.6),
  },
  'shape-normal': {
    description: '기본적인 폭으로 균형 잡힌 수비 대형을 유지합니다.',
    transform: (slots) => slots,
  },
  'shape-wide': {
    description: '수비 대형을 넓게 벌려 측면 공간까지 커버합니다.',
    transform: (slots) => applyWidth(slots, 1.35),
  },

  // ── 압박 시작 라인 ──────────────────────────
  'pressline-low': {
    description: '수비 라인을 낮춰 우리 진영 깊숙한 곳에서 블록을 형성합니다.',
    transform: (slots) => compressToBand(slots, 18, 48),
  },
  'pressline-mid': {
    description: '하프라인 부근에서 균형 잡힌 압박 라인을 유지합니다.',
    transform: (slots) => slots,
  },
  'pressline-high': {
    description: '수비 라인을 끌어올려 상대 진영에서부터 강하게 압박합니다.',
    transform: (slots) => compressToBand(slots, 45, 94),
  },
};

/** baseSlots에 key의 transform을 적용한 슬롯 배열을 반환. key가 없으면 baseSlots 그대로. */
export function getPreviewSlots(baseSlots, key) {
  const preview = TACTIC_PREVIEWS[key];
  return preview ? preview.transform(baseSlots) : baseSlots;
}

export function getPreviewDescription(key) {
  return TACTIC_PREVIEWS[key]?.description ?? null;
}
