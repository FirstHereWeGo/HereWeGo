import { useGameState, useGameActions } from '../state/GameContext';
import { jerseyNumber } from '../utils/playerDisplay';

export default function BenchList() {
  const state = useGameState();
  const { makeSub, viewPlayer } = useGameActions();

  function handleSub(benchId) {
    makeSub(benchId);
  }

  const selectedPlayer = state.selected ? state.players[state.selected] : null;
  const isOutGk = !!selectedPlayer && selectedPlayer.data.positions.includes('GK');
  const bench = state.team ? state.team.players.filter(p => !state.players[p.id]) : [];

  return (
    <div className="bench">
      <h4>벤치 · 후보 명단</h4>
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
        {bench.map(d => {
          const isInGk = d.positions.includes('GK');
          const isGkMismatch = state.selected ? (isOutGk !== isInGk) : false;
          const canSub = state.editable && !!state.selected && !isGkMismatch;

          return (
            <div
              className={`bench-item ${state.viewedId === d.id ? 'viewed' : ''}`}
              key={d.id}
              onClick={() => viewPlayer(d.id)}
            >
              <div className="bdisc num">{jerseyNumber(d.id)}</div>
              <div className="bname">
                {d.name}
                <div className="bstatus">{d.positions[0]} · {d.height}cm · {d.age}세</div>
              </div>
              <button
                className="btn-sub"
                disabled={!canSub}
                onClick={(e) => { e.stopPropagation(); handleSub(d.id); }}
                title={
                  !state.selected ? '피치 위에서 교체할 선수를 먼저 클릭하세요.' :
                  isGkMismatch ? (isOutGk ? '골키퍼는 골키퍼끼리만 교체할 수 있습니다!' : '필드 선수를 골키퍼와 교체할 수 없습니다!') : ''
                }
              >
                {isGkMismatch && state.selected ? '불가' : '교체'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
