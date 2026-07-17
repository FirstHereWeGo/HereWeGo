import { useGameState, useGameActions } from '../state/GameContext';
import { ROLE_KR } from '../data/positionLabels';
import { jerseyNumber } from '../utils/playerDisplay';

export default function BenchList() {
  const state = useGameState();
  const { makeSub } = useGameActions();

  function handleSub(benchId) {
    makeSub(benchId);
  }

  const selectedPlayer = state.selected ? state.players[state.selected] : null;
  const isOutGk = !!selectedPlayer && selectedPlayer.data.positions.includes('GK');
  const playersById = state.team ? Object.fromEntries(state.team.players.map(p => [p.id, p])) : {};

  return (
    <div className="bench">
      <h4>벤치 · SUBSTITUTES</h4>
      <div className="subs-left">
        {state.subsLeft > 0 ? `남은 교체 카드: ${state.subsLeft}장` : '교체 카드 소진 — 교체 불가'}
      </div>
      <div className="bench-hint">
        {state.selected ? (
          isOutGk ? (
            <span>🧤 <b style={{ color: '#38bdf8' }}>골키퍼</b> 교체 대상 선택 중...</span>
          ) : (
            <span>🏃‍♂️ <b style={{ color: 'var(--green-bright)' }}>필드 선수</b> 교체 대상 선택 중...</span>
          )
        ) : (
          <span>피치 위의 선수를 먼저 선택한 뒤 <b style={{ color: 'var(--green-bright)' }}>교체</b>를 누르세요.</span>
        )}
      </div>
      <div>
        {state.benchState.map(b => {
          const d = playersById[b.id];
          if (!d) return null;

          const isInGk = d.positions.includes('GK');
          const isGkMismatch = state.selected ? (isOutGk !== isInGk) : false;

          const canSub =
            b.status === 'ok' &&
            state.subsLeft > 0 &&
            state.editable &&
            state.selected &&
            !isGkMismatch;

          const statusTxt =
            b.status === 'ok'
              ? `${ROLE_KR[d.positions[0]] || d.positions[0]} · ${d.height}cm · ${d.age}세`
              : b.status === 'in'
              ? '투입 완료'
              : b.note || '교체 아웃';

          return (
            <div className={`bench-item ${b.status !== 'ok' ? 'subbed' : ''}`} key={b.id}>
              <div className="bdisc num">{jerseyNumber(d.id)}</div>
              <div className="bname">
                {d.name}
                <div className="bstatus">{statusTxt}</div>
              </div>
              <button
                className="btn-sub"
                disabled={!canSub}
                onClick={() => handleSub(b.id)}
                title={
                  !state.selected ? '피치 위에서 교체할 선수를 먼저 클릭하세요.' :
                  isGkMismatch ? (isOutGk ? '골키퍼는 골키퍼끼리만 교체할 수 있습니다!' : '필드 선수를 골키퍼와 교체할 수 없습니다!') : ''
                }
              >
                {b.status !== 'ok' ? '완료' : isGkMismatch && state.selected ? '불가' : '교체'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
