export default function Landing({ onEnter }) {
  return (
    <section className="view-landing">
      <div className="landing-inner">
        <div className="landing-eyebrow">2026 FIFA WORLD CUP · INTERACTIVE TACTICS SIM</div>
        <h1 className="landing-title">
          PRIME <span className="rewind">REWIND</span>
        </h1>
        <p className="landing-sub">
          2026 월드컵 조별리그 최종전, 대한민국 0-1 남아공.
          <br />
          그 90분을 처음부터 다시 지휘하는 <b>실시간 3D 전술 시뮬레이션</b>입니다.
          <br />
          포메이션·교체·전성기 소환 — 당신의 선택이 xG와 승률로 증명됩니다.
        </p>
        <div className="scoreline glass">
          <div>
            <div className="team">대한민국</div>
            <div className="meta">3-4-2-1 · 홍명보</div>
          </div>
          <div className="score num">0 : 1</div>
          <div>
            <div className="team">남아공</div>
            <div className="meta">4-2-3-1 · 브루스</div>
          </div>
          <div className="scoreline-div" />
          <div className="meta left">
            2026. 6. 25 · FT
            <br />
            마세코 63'
          </div>
        </div>
        <button className="cta" onClick={onEnter}>
          시작하기
        </button>
        <div className="landing-foot">시작하면 양 팀 선발 라인업과 전술을 확인할 수 있습니다</div>
      </div>
    </section>
  );
}
