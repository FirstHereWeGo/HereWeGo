import { useGameState } from '../state/GameContext';
import { SCENES } from '../data/squad';

function buildVerdict(w, d, l) {
  if (w >= 0.45) {
    return {
      label: '승리 유력',
      cls: 'sim-v',
      msg: `당신의 전술이라면 승리 확률 <b>${Math.round(w * 100)}%</b>. 실제의 0-1 패배가 뒤집혔을 가능성이 높습니다. 그날 벤치에 당신이 있었다면 — 역사는 달라졌을지도 모릅니다.`,
    };
  }
  if (w + d >= 0.55) {
    return {
      label: '무승부 이상 우세',
      cls: 'sim-v',
      msg: `무승부 이상을 가져올 확률이 <b>${Math.round((w + d) * 100)}%</b>. 최소한 승점 1점, 조별리그의 운명이 달라지는 숫자입니다.`,
    };
  }
  return {
    label: '아직 부족합니다',
    cls: 'lose',
    msg: `현재 배치로는 패배 확률이 <b>${Math.round(l * 100)}%</b>. 수비 커버를 더 촘촘히 하거나, ★ 선수의 전성기 소환을 활용해 보세요.`,
  };
}

export default function ResultView({ onRetry, onPickScene, onHome }) {
  const state = useGameState();
  const lastXG = state.lastXG;
  if (!lastXG) return null;
  const { xgA, xgB, w, d, l } = lastXG;
  const verdict = buildVerdict(w, d, l);

  return (
    <section className="view-result">
      <div className="section-label">FULL TIME COMPARISON</div>
      <h2 className="section-title">실제 결과 vs 당신의 시뮬레이션</h2>
      <div className="result-grid">
        <div className="result-card">
          <h3>실제 결과 · 2026. 6. 25</h3>
          <div className="big-score num">0 : 1</div>
          <div className="verdict lose">패배</div>
          <div className="mini-stats">
            <div className="mini-row"><span className="k">실점 장면 xG (마세코)</span><span className="num">{SCENES.conceded.actualXG.toFixed(2)}</span></div>
            <div className="mini-row"><span className="k">득점 기회 xG (박진섭)</span><span className="num">{SCENES.chance.actualXG.toFixed(2)}</span></div>
            <div className="mini-row"><span className="k">결과</span><span>조별리그 최종전 0-1 패</span></div>
          </div>
        </div>
        <div className="result-card sim">
          <h3>당신의 시뮬레이션</h3>
          <div className="big-score num">{Math.round(w * 100)}%</div>
          <div className={`verdict ${verdict.cls}`}>{verdict.label}</div>
          <div className="mini-stats">
            <div className="mini-row"><span className="k">조정된 실점 장면 xG</span><span className="num">{xgA.toFixed(2)}</span></div>
            <div className="mini-row"><span className="k">조정된 득점 기회 xG</span><span className="num">{xgB.toFixed(2)}</span></div>
            <div className="mini-row"><span className="k">승 / 무 / 패</span><span className="num">{Math.round(w * 100)} / {Math.round(d * 100)} / {Math.round(l * 100)}</span></div>
          </div>
        </div>
      </div>
      <p className="result-msg" dangerouslySetInnerHTML={{ __html: verdict.msg }} />
      <div className="result-actions">
        <button className="btn-result" onClick={onRetry}>이 장면 재도전</button>
        <button className="btn-ghost" onClick={onPickScene}>다른 장면 선택</button>
        <button className="btn-ghost" onClick={onHome}>처음으로</button>
      </div>
    </section>
  );
}
