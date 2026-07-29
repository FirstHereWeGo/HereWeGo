export default function Landing({ onEnter }) {
  return (
    <section className="view-landing">
      <div className="landing-inner">
        <div className="landing-eyebrow">TACTICS PREDICTOR</div>
        <h1 className="landing-title">
          PRIME <span className="rewind">REWIND</span>
        </h1>
        <p className="landing-sub">
          내 팀과 상대 팀을 고르고, 포메이션과 전술을 직접 구성해보세요.
          <br />
          라인업·교체·전술 성향을 바꾼 뒤 <b>예측 승률</b>을 확인할 수 있습니다.
        </p>
        <button className="cta" onClick={onEnter}>
          시작하기
        </button>
        <div className="landing-foot">시작하면 먼저 내 팀과 상대 팀을 선택합니다</div>
      </div>
    </section>
  );
}
