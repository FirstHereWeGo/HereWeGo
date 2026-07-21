const STAT_LABEL = { win: '승', draw: '무', loss: '패' };

function deltaTone(diff) {
  if (diff > 0.0005) return 'up';
  if (diff < -0.0005) return 'down';
  return 'flat';
}

function deltaArrow(tone) {
  if (tone === 'up') return '▲';
  if (tone === 'down') return '▼';
  return '–';
}

export default function WinProbabilityPanel({ myTeamName, oppTeamName, winProb, prevWinProb, predicting, predictError, onCalculate, bare = false }) {
  const showDelta = !!(winProb && prevWinProb);

  return (
    <div className={bare ? 'prob-panel' : 'prob-card glass'}>
      <div className="prob-header-row">
        <span className="prob-team-label mine"><i className="dot" />{myTeamName}</span>
        {winProb ? (
          <button
            className={`prob-recalc-btn ${predicting ? 'spinning' : ''}`}
            disabled={predicting}
            onClick={onCalculate}
            title="승률 재계산"
            aria-label="승률 재계산"
          >
            ↻
          </button>
        ) : (
          <button className="btn-ghost prob-calc-btn" disabled={predicting} onClick={onCalculate}>
            {predicting ? '계산 중...' : '승률 계산'}
          </button>
        )}
        <span className="prob-team-label opp">{oppTeamName}<i className="dot" /></span>
      </div>

      {winProb ? (
        <div className="prob-bar">
          <div className="seg w" style={{ width: `${winProb.win * 100}%` }}>{Math.round(winProb.win * 100)}%</div>
          <div className="seg d" style={{ width: `${winProb.draw * 100}%` }}>{Math.round(winProb.draw * 100)}%</div>
          <div className="seg l" style={{ width: `${winProb.loss * 100}%` }}>{Math.round(winProb.loss * 100)}%</div>
        </div>
      ) : (
        <div className="prob-bar">
          <div className="prob-bar-empty">{predictError ? `예측 실패: ${predictError}` : '아직 계산 전'}</div>
        </div>
      )}

      {showDelta && (
        <div className="prob-delta-row">
          <span className="prob-delta-label">이전 대비</span>
          {['win', 'draw', 'loss'].map(key => {
            const diff = winProb[key] - prevWinProb[key];
            const tone = deltaTone(diff);
            const pct = Math.round(diff * 100);
            const sign = pct > 0 ? '+' : '';
            return (
              <span key={key} className={`prob-delta-item ${tone}`}>
                {deltaArrow(tone)} {STAT_LABEL[key]} {tone === 'flat' ? '0' : `${sign}${pct}`}%p
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
