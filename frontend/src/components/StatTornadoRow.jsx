/**
 * "[값][막대◀][라벨][막대▶][값]" 한 줄짜리 지표 대결 행.
 * a/b 비율이 50:50에서 크게 벗어난(=격차가 유의미한) 행만 배경/색을 강조하고,
 * 격차가 작은 행은 톤을 낮춰 화면 전체 지표가 눈에 덜 부딪히게 한다.
 */
const SIGNIFICANT_DELTA = 12; // 50%를 기준으로 이 이상 벌어지면 "유의미"로 본다 (퍼센트포인트)

function splitPct(a, b) {
  const total = a + b;
  if (total <= 0) return { left: 50, right: 50 };
  return { left: (a / total) * 100, right: (b / total) * 100 };
}

export default function StatTornadoRow({ label, a, b, unit = '', colorA, colorB }) {
  const { left, right } = splitPct(a, b);
  const leaning = left >= right ? 'a' : 'b';
  const significant = Math.abs(left - 50) >= SIGNIFICANT_DELTA;

  return (
    <div className={`tornado-row ${significant ? 'significant' : ''}`}>
      <span className={`tornado-val ${significant && leaning === 'a' ? 'lead' : ''}`} style={{ color: significant && leaning === 'a' ? colorA : undefined }}>
        {a}{unit}
      </span>
      <div className="tornado-bar">
        <div className="tornado-half left">
          <div className="tornado-fill" style={{ width: `${left}%`, background: colorA, opacity: significant && leaning === 'a' ? 1 : 0.45 }} />
        </div>
        <span className="tornado-label">{label}</span>
        <div className="tornado-half right">
          <div className="tornado-fill" style={{ width: `${right}%`, background: colorB, opacity: significant && leaning === 'b' ? 1 : 0.45 }} />
        </div>
      </div>
      <span className={`tornado-val ${significant && leaning === 'b' ? 'lead' : ''}`} style={{ color: significant && leaning === 'b' ? colorB : undefined }}>
        {b}{unit}
      </span>
    </div>
  );
}
