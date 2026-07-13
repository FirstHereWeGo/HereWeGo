export default function Landing({ onEnter }) {
  return (
    <section className="view-landing">
      <div className="landing-eyebrow">2026 FIFA WORLD CUP · GROUP STAGE</div>
      <h1 className="landing-title">
        PRIME <span className="rewind">REWIND</span>
      </h1>
      <p className="landing-sub">
        그날, 전성기의 그가 있었다면.
        <br />
        실제 경기 데이터로 그 순간을 되감고, 감독이 되어 다시 지휘하세요.
        <br />
        당신의 선택은 <b style={{ color: 'var(--green-bright)' }}>xG와 승률</b>로 증명됩니다.
      </p>
      <div className="scoreline">
        <div>
          <div className="team">대한민국</div>
          <div className="meta">KOR · 3-4-2-1</div>
        </div>
        <div className="score num">0 : 1</div>
        <div>
          <div className="team">남아공</div>
          <div className="meta">RSA · 4-2-3-1</div>
        </div>
        <div style={{ width: 1, height: 44, background: 'var(--line)' }} />
        <div className="meta" style={{ textAlign: 'left' }}>
          2026. 6. 25
          <br />
          조별리그 최종전
          <br />
          FT · 마세코 63'
        </div>
      </div>
      <button className="cta" onClick={onEnter}>
        감독으로 입장하기 →
      </button>
    </section>
  );
}
