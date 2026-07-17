import { useGameState, useGameActions } from '../state/GameContext';
import { assignFormation } from '../utils/autoAssign';

export default function Sidebar() {
  const state = useGameState();
  const { setPlayerPosBulk, restoreHome, applyFormation } = useGameActions();
  const locked = !state.editable;

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
    </aside>
  );
}
