import { useGameState, useGameActions } from '../state/GameContext';
import { SQUAD, ROLE_KR } from '../data/squad';

export default function BenchList() {
  const state = useGameState();
  const { makeSub } = useGameActions();

  function handleSub(benchId) {
    makeSub(benchId);
  }

  const selected = state.selected ? state.players[state.selected] : null;

  return (
    <div className="bench">
      <h4>벤치 · SUBSTITUTES</h4>
      <div className="subs-left">
        {state.subsLeft > 0 ? `남은 교체 카드: ${state.subsLeft}장` : '교체 카드 소진 — 교체 불가'}
      </div>
      <div className="bench-hint">
        필드 선수를 선택한 뒤 <b style={{ color: 'var(--green-bright)' }}>교체</b>를 누르면 즉시
        투입됩니다.
      </div>
      <div>
        {state.benchState.map(b => {
          const d = SQUAD[b.id];
          const canSub =
            b.status === 'ok' &&
            state.subsLeft > 0 &&
            state.editable &&
            selected &&
            !selected.data.pref.includes('GK');
          const statusTxt =
            b.status === 'ok'
              ? `${ROLE_KR[d.pref[0]]} · ${d.h}cm · ${d.age}세`
              : b.status === 'in'
              ? '투입 완료'
              : b.note || '교체 아웃';
          return (
            <div className={`bench-item ${b.status !== 'ok' ? 'subbed' : ''}`} key={b.id}>
              <div className="bdisc num">{d.no}</div>
              <div className="bname">
                {d.star ? <span className="star">★ </span> : null}
                {d.name}
                <div className="bstatus">{statusTxt}</div>
              </div>
              <button className="btn-sub" disabled={!canSub} onClick={() => handleSub(b.id)}>
                교체
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
