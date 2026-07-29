import { ZONE_LABELS } from '../utils/liveMatchStats';

/**
 * "패스 성공" 존 그래프. PitchZoneMap과 같은 이유로(실좌표 없음) "전방/중간/후방 받은
 * 패스 수"를 가로 3개 밴드(위→아래로 전방·중간·후방)의 막대로 표현한다 — 밴드 = 존,
 * 막대는 밴드 가운데(세로 중앙선)에서 시작해 값만큼 좌우로 자란다. 내 팀은 항상 왼쪽,
 * 상대는 항상 오른쪽에 그린다.
 */
const W = 220;
const H = 100;
const TOP = 8;
const BOTTOM = H - 8;
const BAND_H = (BOTTOM - TOP) / 3;
const BAR_H = 8;
const MAX_HALF_W = W / 2 - 14;
const MIN_HALF_LEN = 6; // 값이 0보다 크면 막대가 보일 최소 반너비

export default function PassZoneMap({ zones, colorA, colorB, mineIsA = true }) {
  const mineVals = mineIsA ? zones.a : zones.b; // [전방, 중간, 후방]
  const oppVals = mineIsA ? zones.b : zones.a;
  const mineColor = mineIsA ? colorA : colorB;
  const oppColor = mineIsA ? colorB : colorA;
  const max = Math.max(1, ...zones.a, ...zones.b);

  const halfLen = (v) => (v > 0 ? Math.max(MIN_HALF_LEN, (v / max) * MAX_HALF_W) : 0);

  return (
    <div className="zonemap-wrap">
      <svg className="zonemap-svg" viewBox={`0 0 ${W} ${H}`} width="100%">
        <rect x="4" y="4" width={W - 8} height={H - 8} rx="6" className="zonemap-outline" />
        <line x1={W / 2} y1={TOP} x2={W / 2} y2={BOTTOM} className="zonemap-box" />

        {ZONE_LABELS.map((_, i) => {
          const y = TOP + (i + 0.5) * BAND_H;
          const mineLen = halfLen(mineVals[i]);
          const oppLen = halfLen(oppVals[i]);
          return (
            <g key={i}>
              {i > 0 && <line x1="4" y1={TOP + i * BAND_H} x2={W - 4} y2={TOP + i * BAND_H} className="zonemap-lane-div" />}
              {mineLen > 0 && (
                <rect x={W / 2 - mineLen} y={y - BAR_H / 2} width={mineLen} height={BAR_H} rx="3" fill={mineColor} className="zonemap-arrow" />
              )}
              {oppLen > 0 && (
                <rect x={W / 2} y={y - BAR_H / 2} width={oppLen} height={BAR_H} rx="3" fill={oppColor} className="zonemap-arrow" />
              )}
            </g>
          );
        })}
      </svg>
      <div className="zonemap-legend">
        {ZONE_LABELS.map((label, i) => (
          <div key={label} className="zonemap-legend-item">
            <span className="zonemap-legend-vals">
              <b style={{ color: colorA }}>{zones.a[i]}</b> : <b style={{ color: colorB }}>{zones.b[i]}</b>
            </span>
            <span className="zonemap-legend-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
