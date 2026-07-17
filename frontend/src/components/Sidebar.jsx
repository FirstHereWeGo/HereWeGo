import { useGameState, useGameActions } from '../state/GameContext';
import { assignFormation } from '../utils/autoAssign';

const LINE_LABEL = { low: '낮은 블록', mid: '중간 블록', high: '높은 라인' };
const APPROACH_LABEL = { defensive: '수비적', balanced: '균형', attacking: '공격적' };

function withTactic(tacticConfig, updater) {
  const next = structuredClone(tacticConfig);
  updater(next);
  return next;
}

export default function Sidebar() {
  const state = useGameState();
  const { setPlayerPosBulk, restoreHome, applyFormation, setTacticConfig } = useGameActions();
  const locked = !state.editable;
  const tactic = state.tacticConfig;

  function handleApplyFormation(formationId) {
    if (locked) return;
    applyFormation(formationId);
    const formation = state.formations.find(f => f.id === formationId);
    if (!formation) return;
    const outfield = Object.fromEntries(
      Object.entries(state.players).filter(([, p]) => !p.data.positions.includes('GK'))
    );
    setPlayerPosBulk(assignFormation(outfield, formation));
  }

  function pressingLineFor(v) {
    return v < 35 ? 'low' : v > 65 ? 'high' : 'mid';
  }

  function setLineVal(v) {
    if (locked) return;
    setTacticConfig(withTactic(tactic, t => {
      t.outOfPossession.defensiveLineHeight = v;
      t.outOfPossession.pressingLine = pressingLineFor(v);
    }));
  }

  function setApproach(approach) {
    if (locked) return;
    setTacticConfig(withTactic(tactic, t => { t.style.approach = approach; }));
  }

  function setPressAfterLoss(v) {
    if (locked) return;
    setTacticConfig(withTactic(tactic, t => { t.transitions.pressAfterLoss = v; }));
  }

  function setCounterAfterWin(v) {
    if (locked) return;
    setTacticConfig(withTactic(tactic, t => { t.transitions.counterAfterWin = v; }));
  }

  function setTempo(v) {
    if (locked) return;
    setTacticConfig(withTactic(tactic, t => { t.inPossession.tempo = v; }));
  }

  if (!tactic) return null;

  return (
    <aside className="sidebar glass">
      {locked && <div className="lock-note">불러오는 중...</div>}

      <div className="sb-heading">포메이션</div>
      <div className="formation-grid">
        <button
          className={`fm-btn wide ${state.formationId === state.tacticPreset?.formationId ? 'on' : ''}`}
          disabled={locked}
          onClick={() => { applyFormation(state.tacticPreset.formationId); restoreHome(); }}
        >
          ↺ 선발 기본 배치
        </button>
        {state.formations.map(fm => (
          <button
            key={fm.id}
            className={`fm-btn ${state.formationId === fm.id ? 'on' : ''}`}
            disabled={locked}
            onClick={() => handleApplyFormation(fm.id)}
          >
            {fm.name}
          </button>
        ))}
      </div>

      <div className="sb-heading">전술 성향</div>

      <div className="slider-group">
        <div className="slider-head">
          <span>수비 라인 높이</span>
          <span className="slider-val">{LINE_LABEL[tactic.outOfPossession.pressingLine]}</span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={tactic.outOfPossession.defensiveLineHeight}
          disabled={locked}
          onChange={e => setLineVal(Number(e.target.value))}
        />
        <div className="slider-scale"><span>내려섬</span><span>중간</span><span>높음</span></div>
      </div>

      <div className="slider-group">
        <div className="slider-head">
          <span>템포</span>
          <span className="slider-val">{tactic.inPossession.tempo >= 50 ? '빠르게' : '신중하게'}</span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={tactic.inPossession.tempo}
          disabled={locked}
          onChange={e => setTempo(Number(e.target.value))}
        />
        <div className="slider-scale"><span>신중</span><span>보통</span><span>빠름</span></div>
      </div>

      <div className="inst-group">
        <h4>공격/수비 비중</h4>
        <div className="inst-opts">
          {Object.entries(APPROACH_LABEL).map(([val, label]) => (
            <button
              key={val}
              className={`inst-btn ${tactic.style.approach === val ? 'on' : ''}`}
              disabled={locked}
              onClick={() => setApproach(val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="inst-group">
        <h4>공을 빼앗겼을 때</h4>
        <div className="inst-opts">
          <button className={`inst-btn ${tactic.transitions.pressAfterLoss ? 'on' : ''}`} disabled={locked} onClick={() => setPressAfterLoss(true)}>역압박</button>
          <button className={`inst-btn ${!tactic.transitions.pressAfterLoss ? 'on' : ''}`} disabled={locked} onClick={() => setPressAfterLoss(false)}>재정비</button>
        </div>
      </div>

      <div className="inst-group">
        <h4>공을 가지고 있을 때</h4>
        <div className="inst-opts">
          <button className={`inst-btn ${tactic.transitions.counterAfterWin ? 'on' : ''}`} disabled={locked} onClick={() => setCounterAfterWin(true)}>역습</button>
          <button className={`inst-btn ${!tactic.transitions.counterAfterWin ? 'on' : ''}`} disabled={locked} onClick={() => setCounterAfterWin(false)}>진형 유지</button>
        </div>
      </div>
    </aside>
  );
}
