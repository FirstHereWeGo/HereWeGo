import { useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { assignFormation } from '../engine/formation';

const FORMATION_LIST = ['3-4-2-1', '4-2-3-1', '4-3-3', '4-4-2', '3-5-2'];
const LINE_LABEL = { low: '낮은 블록', mid: '중간 블록', high: '높은 라인' };
const BAL_LABEL = { defensive: '수비적', balanced: '균형', dominant: '공격적' };

const TOGGLES = [
  { key: 'press', title: '공을 빼앗겼을 때', opts: [['counterpress', '역압박'], ['regroup', '재정비']] },
  { key: 'transition', title: '공을 가지고 있을 때', opts: [['counter', '역습'], ['hold', '진형 유지']] },
  { key: 'tempo', title: '템포', opts: [['fast', '빠르게'], ['slow', '신중하게']] },
];

export default function Sidebar() {
  const state = useGameState();
  const { setPlayerPosBulk, restoreHome, setInst, setLineVal, setBalanceVal } = useGameActions();
  const [activeFm, setActiveFm] = useState('__start__');
  const locked = !state.editable;

  function applyFormation(name) {
    if (locked) return;
    setActiveFm(name);
    if (name === '__start__') restoreHome();
    else setPlayerPosBulk(assignFormation(state.players, name));
  }

  return (
    <aside className="sidebar glass">
      {locked && <div className="lock-note">⏸ 일시정지 중에만 전술 수정 가능</div>}

      <div className="sb-heading">포메이션</div>
      <div className="formation-grid">
        <button
          className={`fm-btn wide ${activeFm === '__start__' ? 'on' : ''}`}
          disabled={locked}
          onClick={() => applyFormation('__start__')}
        >
          ↺ 선발 기본 배치
        </button>
        {FORMATION_LIST.map(fm => (
          <button
            key={fm}
            className={`fm-btn ${fm === '3-5-2' ? 'wide' : ''} ${activeFm === fm ? 'on' : ''}`}
            disabled={locked}
            onClick={() => applyFormation(fm)}
          >
            {fm}
          </button>
        ))}
      </div>

      <div className="sb-heading">전술 성향</div>

      <div className="slider-group">
        <div className="slider-head">
          <span>수비 라인 높이</span>
          <span className="slider-val">{LINE_LABEL[state.inst.line]}</span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={state.lineVal}
          disabled={locked}
          onChange={e => setLineVal(Number(e.target.value))}
        />
        <div className="slider-scale"><span>내려섬</span><span>중간</span><span>높음</span></div>
      </div>

      <div className="slider-group">
        <div className="slider-head">
          <span>공격 / 수비 비중</span>
          <span className="slider-val">{BAL_LABEL[state.mentality]}</span>
        </div>
        <input
          type="range" min="0" max="100" step="1"
          value={state.balanceVal}
          disabled={locked}
          onChange={e => setBalanceVal(Number(e.target.value))}
        />
        <div className="slider-scale"><span>수비</span><span>균형</span><span>공격</span></div>
      </div>

      {TOGGLES.map(gr => (
        <div className="inst-group" key={gr.key}>
          <h4>{gr.title}</h4>
          <div className="inst-opts">
            {gr.opts.map(([val, label]) => (
              <button
                key={val}
                className={`inst-btn ${state.inst[gr.key] === val ? 'on' : ''}`}
                disabled={locked}
                onClick={() => setInst(gr.key, val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
