import { useId } from 'react';
import { CHANNEL_LABELS } from '../utils/liveMatchStats';

/**
 * "공간" 패널의 피치 시각화. 실제 슈팅 좌표/xG가 없어서(model 미제공) 개별 점을 찍는
 * 대신, 실제로 있는 "최종 3선 진입" 5채널(왼→오) 횟수를 세로 5개 레인의 화살표 길이로
 * 표현한다 — 레인 폭 = 채널, 화살표 길이 = 그 채널로 들어간 횟수, 방향 = 그 팀의 공격 방향
 * (위 팀은 아래로, 아래 팀은 위로 — 서로의 진영에서 중앙을 향해 뻗어나간다).
 */
const W = 220;
const H = 280;
const LANE_W = W / 5;
const TOP = 18;
const BOTTOM = H - 18;
const LANE_H = BOTTOM - TOP;
const MIN_LEN = 10; // 값이 0보다 크면 화살표머리가 보일 최소 길이

export default function PitchZoneMap({ channels, colorA, colorB }) {
  const uid = useId();
  const max = Math.max(1, ...channels.a, ...channels.b);
  const markerA = `zonemap-arrow-a-${uid}`;
  const markerB = `zonemap-arrow-b-${uid}`;

  return (
    <div className="zonemap-wrap">
      <svg className="zonemap-svg" viewBox={`0 0 ${W} ${H}`} width="100%">
        <defs>
          <marker id={markerA} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L0,8 L7,4 Z" fill={colorA} />
          </marker>
          <marker id={markerB} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L0,8 L7,4 Z" fill={colorB} />
          </marker>
        </defs>

        <rect x="4" y="4" width={W - 8} height={H - 8} rx="6" className="zonemap-outline" />
        <rect x={W / 2 - 34} y="4" width="68" height="30" className="zonemap-box" />
        <circle cx={W / 2} cy={H / 2} r="26" className="zonemap-box" fill="none" />
        <line x1="4" y1={H / 2} x2={W - 4} y2={H / 2} className="zonemap-box" />

        {CHANNEL_LABELS.map((_, i) => {
          const x = i * LANE_W + LANE_W / 2;
          const lenA = channels.a[i] > 0 ? Math.max(MIN_LEN, (channels.a[i] / max) * (LANE_H / 2 - 10)) : 0;
          const lenB = channels.b[i] > 0 ? Math.max(MIN_LEN, (channels.b[i] / max) * (LANE_H / 2 - 10)) : 0;
          return (
            <g key={i}>
              {i > 0 && <line x1={i * LANE_W} y1={TOP} x2={i * LANE_W} y2={BOTTOM} className="zonemap-lane-div" />}
              {lenA > 0 && (
                <line
                  x1={x} y1={TOP} x2={x} y2={TOP + lenA}
                  stroke={colorA} strokeWidth="3.5" strokeLinecap="butt"
                  markerEnd={`url(#${markerA})`} className="zonemap-arrow"
                />
              )}
              {lenB > 0 && (
                <line
                  x1={x} y1={BOTTOM} x2={x} y2={BOTTOM - lenB}
                  stroke={colorB} strokeWidth="3.5" strokeLinecap="butt"
                  markerEnd={`url(#${markerB})`} className="zonemap-arrow"
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="zonemap-legend">
        {CHANNEL_LABELS.map((label, i) => (
          <div key={label} className="zonemap-legend-item">
            <span className="zonemap-legend-vals">
              <b style={{ color: colorA }}>{channels.a[i]}</b> : <b style={{ color: colorB }}>{channels.b[i]}</b>
            </span>
            <span className="zonemap-legend-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
