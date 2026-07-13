import { useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { assignFormation } from '../engine/formation';

const FORMATION_LIST = ['3-4-2-1', '4-2-3-1', '4-3-3', '4-4-2', '3-5-2'];

const FX = {
  line: {
    high: '뒷공간 리스크 <b>+12%</b> · 세컨볼 회수 <b>+4%</b>',
    mid: '보정 없음 (기준값)',
    low: '박스 보호 — 실점 위험 <b>-10%</b>',
  },
  press: {
    counterpress: '크로스 차단 — 실점 위험 <b>-5%</b>',
    regroup: '실점 위험 +3%, 체력 안정',
  },
  transition: {
    counter: '득점 기대 <b>+5%</b>',
    hold: '보정 없음, 안정 유지',
  },
  tempo: {
    fast: '득점 기대 <b>+6%</b>',
    slow: '보정 없음 (기준값)',
  },
};

const INST_GROUPS = [
  { key: 'line', title: '수비 라인', opts: [['high', '높은 수비 라인'], ['mid', '중간 블록'], ['low', '낮은 블록']] },
  { key: 'press', title: '공을 빼앗겼을 때', opts: [['counterpress', '역압박'], ['regroup', '재정비']] },
  { key: 'transition', title: '공을 가지고 있을 때', opts: [['counter', '역습'], ['hold', '진형 유지']] },
  { key: 'tempo', title: '템포', opts: [['fast', '빠르게'], ['slow', '신중하게']] },
];

export default function Sidebar() {
  const state = useGameState();
  const { setPlayerPosBulk, restoreHome, setInst, setMentality, recalc } = useGameActions();
  const [activeFm, setActiveFm] = useState('__scene__');

  function applyFormation(name) {
    setActiveFm(name);
    if (name === '__scene__') {
      restoreHome();
    } else {
      const updates = assignFormation(state.players, name);
      setPlayerPosBulk(updates);
    }
    // 상태 반영 후 재계산 (다음 tick)
    setTimeout(recalc, 0);
  }

  function onInstClick(group, val) {
    setInst(group, val);
    setTimeout(recalc, 0);
  }

  return (
    <aside className="sidebar">
      <div className="sb-heading">포메이션</div>
      <div className="formation-grid">
        <button
          className={`fm-btn wide ${activeFm === '__scene__' ? 'on' : ''}`}
          onClick={() => applyFormation('__scene__')}
        >
          ↺ 장면 기본 배치
        </button>
        {FORMATION_LIST.map((fm, i) => (
          <button
            key={fm}
            className={`fm-btn ${fm === '3-5-2' ? 'wide' : ''} ${activeFm === fm ? 'on' : ''}`}
            onClick={() => applyFormation(fm)}
          >
            {fm}
          </button>
        ))}
      </div>

      <div className="sb-heading">전술 성향</div>
      <select
        className="mentality"
        value={state.mentality}
        onChange={e => { setMentality(e.target.value); setTimeout(recalc, 0); }}
      >
        <option value="balanced">균형형</option>
        <option value="dominant">지배형</option>
        <option value="counter">역습형</option>
        <option value="defensive">수비형</option>
      </select>

      {INST_GROUPS.map(g => (
        <div className="inst-group" key={g.key}>
          <h4><span className="dot" />{g.title}</h4>
          <div className="inst-opts">
            {g.opts.map(([val, label]) => (
              <button
                key={val}
                className={`inst-btn ${state.inst[g.key] === val ? 'on' : ''}`}
                onClick={() => onInstClick(g.key, val)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="inst-effect"
            dangerouslySetInnerHTML={{ __html: FX[g.key][state.inst[g.key]] }}
          />
        </div>
      ))}
    </aside>
  );
}
