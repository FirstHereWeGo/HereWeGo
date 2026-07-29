/**
 * "구간(하이드레이션 브레이크)별 순간 우세도" 모멘텀 차트. model이 그 구간의 strength로
 * 편향시킨 분당 모멘텀 값(-1=팀B 우세 ~ 1=팀A 우세)을 주므로, 중심선 기준 위(팀A)/
 * 아래(팀B)로 채워진 영역 차트로 그린다. 득점은 실제 events(minute)로 마커 표시.
 */
const W = 260;
const H = 100;
const PAD_X = 8;
const PAD_TOP = 6;
const PAD_BOTTOM = 16;
const PLOT_H = H - PAD_TOP - PAD_BOTTOM;
const CENTER_Y = PAD_TOP + PLOT_H / 2;
const HALF_H = PLOT_H / 2 - 2;

function areaPath(points, maxMinute, side) {
  const xy = points.map((p) => {
    const x = PAD_X + (p.minute / Math.max(maxMinute, 1)) * (W - PAD_X * 2);
    const v = side === 'top' ? Math.max(p.value, 0) : Math.min(p.value, 0);
    return [x, CENTER_Y - v * HALF_H];
  });
  const [x0] = xy[0];
  const [xn] = xy[xy.length - 1];
  const line = xy.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return `M${x0.toFixed(1)},${CENTER_Y.toFixed(1)} ${line} L${xn.toFixed(1)},${CENTER_Y.toFixed(1)} Z`;
}

export default function StatMomentumSpark({ momentum, events, colorA, colorB, mineIsA = true }) {
  if (!momentum || momentum.length < 2) {
    return <div className="momentum-empty">구간이 더 진행되면 추이가 표시됩니다</div>;
  }
  const maxMinute = Math.max(...momentum.map(p => p.minute), 90);

  return (
    <svg className="momentum-svg" viewBox={`0 0 ${W} ${H}`} width="100%">
      <line x1={PAD_X} y1={CENTER_Y} x2={W - PAD_X} y2={CENTER_Y} className="momentum-mid" />
      <path d={areaPath(momentum, maxMinute, 'top')} fill={colorA} className="momentum-area" />
      <path d={areaPath(momentum, maxMinute, 'bottom')} fill={colorB} className="momentum-area" />
      {events?.map((e, i) => {
        const x = PAD_X + (e.minute / Math.max(maxMinute, 1)) * (W - PAD_X * 2);
        const color = e.team === 'teamA' ? colorA : colorB;
        const isMine = mineIsA ? e.team === 'teamA' : e.team === 'teamB';
        return <circle key={i} cx={x} cy={isMine ? PAD_TOP + 4 : H - PAD_TOP - 4} r="3" fill={color} className="momentum-goal" />;
      })}
    </svg>
  );
}
