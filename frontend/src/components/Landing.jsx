export default function Landing({ onEnter }) {
  return (
    <section className="view-landing">
      <div className="landing-inner">
        <div className="landing-eyebrow">2026 FIFA WORLD CUP · TACTICS PREDICTOR</div>
        <h1 className="landing-title">
          PRIME <span className="rewind">REWIND</span>
        </h1>
        <p className="landing-sub">
          대한민국 대표팀의 포메이션과 전술을 직접 구성해보세요.
          <br />
          라인업·교체·전술 성향을 바꿀 때마다 <b>예측 승률</b>이 실시간으로 갱신됩니다.
        </p>
        <div className="scoreline glass">
          <div>
            <div className="team">대한민국</div>
          </div>
          <div>
            <div className="team">남아공</div>
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
