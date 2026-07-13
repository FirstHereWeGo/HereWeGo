export default function SceneSelect({ onPick, onBack }) {
  return (
    <section className="view-scene">
      <div className="section-label">SCENE SELECT</div>
      <h2 className="section-title">어느 순간으로 돌아가시겠습니까?</h2>
      <div className="scene-cards">
        <button className="scene-card" onClick={() => onPick('conceded')}>
          <span className="scene-tag conceded">실점 장면 · REWIND</span>
          <div className="scene-time num">후반 18분 (63')</div>
          <div className="scene-name">마세코 결승골</div>
          <p className="scene-desc">
            교체 투입 1분 만에 모레미가 왼쪽에서 크로스, 마세코가 원터치 슈팅으로 마무리.
            수비 간격이 벌어진 그 순간.
          </p>
          <div className="scene-goal">▸ 수비 배치를 조정해 실점 확률을 낮춰보세요</div>
          <div className="scene-squadnote">
            63' 시점 스쿼드 — 전반 종료 후 손흥민·김진규·카스트로프 투입 완료 · 남은 교체 카드{' '}
            <b className="num">2</b>장 (박진섭, 조규성 대기)
          </div>
        </button>
        <button className="scene-card" onClick={() => onPick('chance')}>
          <span className="scene-tag chance">득점 기회 장면 · REWIND</span>
          <div className="scene-time num">추가시간 3분 (90'+3)</div>
          <div className="scene-name">박진섭 헤더 무산</div>
          <p className="scene-desc">
            카스트로프의 오른쪽 크로스, 박진섭이 솟구쳤지만 헤더는 골문을 외면. 동점까지 단 몇
            센티미터.
          </p>
          <div className="scene-goal">▸ 배치와 전성기 소환으로 득점 확률을 끌어올리세요</div>
          <div className="scene-squadnote">
            90'+3 시점 스쿼드 — 5장 교체 모두 사용, 교체 카드 <b className="num">소진</b> · 총공세
            배치 상태에서 시작
          </div>
        </button>
      </div>
      <button className="btn-ghost" style={{ marginTop: '2rem' }} onClick={onBack}>
        ← 처음으로
      </button>
    </section>
  );
}
