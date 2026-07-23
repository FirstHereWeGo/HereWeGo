/**
 * xG 모멘텀 대신 "구간(하이드레이션 브레이크)별 점유율 추이" 스파크라인.
 * model이 슛 단위 xG나 좌표를 안 줘서 5분 단위 xG 곡선은 만들 수 없고,
 * 대신 프런트가 실제로 구간마다 받는 누적 점유율(history)로 실데이터 기반 추이를 보여준다.
 * 득점은 실제 events(minute)로 마커 표시.
 */
const W = 260;
const H = 92;
const PAD = 8;

function pathFor(points, keyOf, maxMinute) {
  return points
    .map((p, i) => {
      const x = PAD + (p.minute / Math.max(maxMinute, 1)) * (W - PAD * 2);
      const y = PAD + (1 - keyOf(p) / 100) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function StatMomentumSpark({ history, events, colorA, colorB }) {
  if (!history || history.length < 2) {
    return <div className="momentum-empty">구간이 더 진행되면 추이가 표시됩니다</div>;
  }
  const maxMinute = Math.max(...history.map(p => p.minute), 90);

  return (
    <svg className="momentum-svg" viewBox={`0 0 ${W} ${H}`} width="100%">
      <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} className="momentum-mid" />
      <path d={pathFor(history, p => p.possessionA, maxMinute)} fill="none" stroke={colorA} strokeWidth="2" />
      <path d={pathFor(history, p => p.possessionB, maxMinute)} fill="none" stroke={colorB} strokeWidth="2" />
      {events?.map((e, i) => {
        const x = PAD + (e.minute / Math.max(maxMinute, 1)) * (W - PAD * 2);
        const color = e.team === 'teamA' ? colorA : colorB;
        return <circle key={i} cx={x} cy={e.team === 'teamA' ? PAD + 6 : H - PAD - 6} r="3" fill={color} className="momentum-goal" />;
      })}
    </svg>
  );
}
