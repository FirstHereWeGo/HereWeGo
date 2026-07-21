/**
 * axes: [{key, label}] · series: [{name, color, values: {[key]: number}}]
 * 축 1개당 하나의 점, series가 1개면 각 꼭짓점에 수치를 직접 라벨링하고
 * 2개면(선수 비교) 꼭짓점 라벨 없이 범례로 구분한다 — 겹침 방지.
 */
export default function RadarChart({ axes, series, max, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 46;
  const n = axes.length;
  const angleFor = i => -Math.PI / 2 + i * ((2 * Math.PI) / n);
  const pointFor = (i, value) => {
    const r = Math.max(0, Math.min(1, value / max)) * maxR;
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  return (
    <svg className="radar-chart" viewBox={`0 0 ${size} ${size}`} width="100%" height={size}>
      {[0.33, 0.66, 1].map((f, ri) => (
        <polygon
          key={ri}
          className="radar-grid"
          points={axes.map((_, i) => {
            const a = angleFor(i);
            return `${cx + f * maxR * Math.cos(a)},${cy + f * maxR * Math.sin(a)}`;
          }).join(' ')}
        />
      ))}
      {axes.map((_, i) => {
        const a = angleFor(i);
        return (
          <line
            key={i} className="radar-spoke"
            x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)}
          />
        );
      })}
      {series.map((s, si) => (
        <polygon
          key={si}
          points={axes.map((ax, i) => pointFor(i, s.values[ax.key] ?? 0).join(',')).join(' ')}
          fill={s.color} fillOpacity="0.22" stroke={s.color} strokeWidth="2"
        />
      ))}
      {series.length === 1 && axes.map((ax, i) => {
        const [x, y] = pointFor(i, series[0].values[ax.key] ?? 0);
        return <circle key={i} cx={x} cy={y} r="3.5" fill={series[0].color} />;
      })}
      {axes.map((ax, i) => {
        const a = angleFor(i);
        const lx = cx + (maxR + 16) * Math.cos(a);
        const ly = cy + (maxR + 16) * Math.sin(a);
        const cos = Math.cos(a);
        const anchor = cos > 0.2 ? 'start' : cos < -0.2 ? 'end' : 'middle';
        const value = series.length === 1 ? Math.round(series[0].values[ax.key] ?? 0) : null;
        return (
          <text key={i} x={lx} y={ly} textAnchor={anchor} className="radar-axis-label">
            {ax.label}{value != null ? ` (${value})` : ''}
          </text>
        );
      })}
    </svg>
  );
}
