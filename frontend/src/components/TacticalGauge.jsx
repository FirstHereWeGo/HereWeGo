import { useGameState } from '../state/GameContext';
import { SCENES } from '../data/squad';

export default function TacticalGauge() {
  const state = useGameState();
  if (!state.scene) return null;
  const sc = SCENES[state.scene];
  const xg = state.lastXG?.xg ?? sc.actualXG;
  const good = sc.lowerIsBetter ? xg < sc.actualXG : xg > sc.actualXG;
  const delta = xg - sc.actualXG;
  const w = state.lastXG?.w ?? 0.33, d = state.lastXG?.d ?? 0.33, l = state.lastXG?.l ?? 0.34;

  return (
    <>
      <div className="gauge-box">
        <h4>{sc.gaugeTitle}</h4>
        <div className="xg-row">
          <span className="lbl">{sc.xgLabel}</span>
          <span>
            <span className={`val num ${good ? 'good' : 'bad'}`}>{xg.toFixed(2)}</span>
            <span className="xg-delta">{delta >= 0 ? '+' : ''}{delta.toFixed(2)}</span>
          </span>
        </div>
        <div className="xg-row">
          <span className="lbl">실제 장면 xG</span>
          <span className="val num" style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>
            {sc.actualXG.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="gauge-box">
        <h4>재계산된 경기 승률 (시뮬레이션)</h4>
        <div className="prob-bar">
          <div className="seg w" style={{ width: `${w * 100}%` }}>{Math.round(w * 100)}%</div>
          <div className="seg d" style={{ width: `${d * 100}%` }}>{Math.round(d * 100)}%</div>
          <div className="seg l" style={{ width: `${l * 100}%` }}>{Math.round(l * 100)}%</div>
        </div>
        <div className="prob-legend">
          <span>■ 승</span><span>무</span><span>패 ■</span>
        </div>
      </div>
    </>
  );
}
