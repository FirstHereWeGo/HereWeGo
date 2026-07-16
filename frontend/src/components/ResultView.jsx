/** 풀타임 결과 — 시뮬레이션 스코어 vs 실제 결과(0-1) */
export default function ResultView({ summary, onRestart, onHome }) {
  if (!summary) return null;
  const { score, xgSum } = summary;
  const win = score.kor > score.rsa, draw = score.kor === score.rsa;
  const verdict = win ? '승리!' : draw ? '무승부' : '패배';
  const verdictCls = win || draw ? 'sim-v' : 'lose';
  const msg = win
    ? `실제 역사는 0-1 패배였지만, 당신의 지휘 아래 대한민국은 <b>${score.kor}-${score.rsa}</b>로 승리했습니다. 그날 벤치에 당신이 있었다면 — 역사는 달라졌을 겁니다.`
    : draw
      ? `당신의 시뮬레이션은 <b>${score.kor}-${score.rsa}</b> 무승부. 실제의 패배보다 승점 1점을 더 가져왔습니다. 조별리그의 계산이 달라지는 결과입니다.`
      : `이번 시뮬레이션은 <b>${score.kor}-${score.rsa}</b>로 마무리. 실제 역사를 바꾸지 못했습니다. 전술 지시와 전성기 소환을 다르게 조합해 다시 도전해 보세요.`;

  return (
    <section className="view-result">
      <div className="section-label">FULL TIME</div>
      <h2 className="section-title">시뮬레이션 종료 — 실제 결과와 비교</h2>
      <div className="result-grid">
        <div className="result-card">
          <h3>실제 결과 · 2026. 6. 25</h3>
          <div className="big-score num">0 : 1</div>
          <div className="verdict lose">패배</div>
          <div className="mini-stats">
            <div className="mini-row"><span className="k">결승골</span><span>마세코 63'</span></div>
            <div className="mini-row"><span className="k">아쉬운 순간</span><span>90'+3 헤더 무산</span></div>
            <div className="mini-row"><span className="k">결과</span><span>조별리그 최종전 0-1 패</span></div>
          </div>
        </div>
        <div className="result-card sim">
          <h3>당신의 시뮬레이션</h3>
          <div className="big-score num">{score.kor} : {score.rsa}</div>
          <div className={`verdict ${verdictCls}`}>{verdict}</div>
          <div className="mini-stats">
            <div className="mini-row"><span className="k">누적 xG (대한민국)</span><span className="num">{xgSum.kor.toFixed(2)}</span></div>
            <div className="mini-row"><span className="k">누적 xG (남아공)</span><span className="num">{xgSum.rsa.toFixed(2)}</span></div>
            <div className="mini-row"><span className="k">주요 이벤트</span><span>{summary.feed.filter(f => (f.type || '').startsWith('goal')).length}골 · 피드 {summary.feed.length}건</span></div>
          </div>
        </div>
      </div>
      <p className="result-msg" dangerouslySetInnerHTML={{ __html: msg }} />
      <div className="result-actions">
        <button className="btn-result" onClick={onRestart}>↺ 다시 지휘하기</button>
        <button className="btn-ghost" onClick={onHome}>처음으로</button>
      </div>
    </section>
  );
}
