import { useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { jerseyNumber } from '../utils/playerDisplay';

// 포지션 코드(GK|CB|FB|WB|DM|CM|AM|WG|ST) 기준 필터 그룹 - GK는 어느 그룹에도 없어서
// 필터를 해제(전체 보기)했을 때만 후보 명단에 나타난다.
const POSITION_GROUPS = [
  { key: 'attack', label: '공격', positions: ['ST', 'WG'] },
  { key: 'mid', label: '중앙', positions: ['AM', 'CM', 'DM'] },
  { key: 'defense', label: '수비', positions: ['CB', 'FB', 'WB'] },
];

export default function BenchList() {
  const state = useGameState();
  const { makeSub, viewPlayer } = useGameActions();
  const [showPrime, setShowPrime] = useState(false);
  const [posFilter, setPosFilter] = useState(null); // null = 전체, 아니면 POSITION_GROUPS의 key

  function matchesFilter(positions) {
    if (!posFilter) return true;
    const group = POSITION_GROUPS.find(g => g.key === posFilter);
    return (positions ?? []).some(p => group.positions.includes(p));
  }

  function handleSub(benchId) {
    makeSub(benchId);
  }

  const selectedPlayer = state.selected ? state.players[state.selected] : null;
  const isOutGk = !!selectedPlayer && selectedPlayer.data.positions.includes('GK');
  // 프라임/현역 각각 "자기 자신"이 이미 피치에 있을 때만 목록에서 숨긴다 - 반대쪽(현역이 나가 있을 때
  // 프라임 옵션)은 계속 보여야 교체가 가능하다. 다른 자리에 같은 선수가 중복되는 건 MAKE_SUB이 정리한다.
  const bench = state.team ? state.team.players.filter(p => !state.players[p.id]) : [];
  const primePlayers = state.team ? state.primePlayers.filter(p => p.teamId === state.team.id && !state.players[p.id]) : [];
  const selectedBaseId = state.selected ? state.selected.replace(/^prime/, '') : null;

  const filteredBench = bench.filter(d => matchesFilter(d.positions));
  // PrimePlayer 자체엔 positions가 없어서 기준 선수(basePlayer)에서 가져와 필터링한다.
  const filteredPrime = primePlayers
    .map(d => ({ d, basePlayer: state.team.players.find(p => p.id === d.id.replace(/^prime/, '')) }))
    .filter(({ basePlayer }) => matchesFilter(basePlayer?.positions));

  return (
    <div className="bench">
      <div className="bench-head">
        <div className="bench-pos-filter">
          {POSITION_GROUPS.map(g => (
            <button
              key={g.key}
              type="button"
              className={`bench-pos-btn ${posFilter === g.key ? 'on' : ''}`}
              onClick={() => setPosFilter(f => (f === g.key ? null : g.key))}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`btn-prime-toggle ${showPrime ? 'on' : ''}`}
          onClick={() => setShowPrime(v => !v)}
        >
          ⭐ 프라임 선수
        </button>
      </div>
      <div className="bench-hint">
        {showPrime ? (
          state.selected ? (
            <span>✅ 선택한 선수의 <b style={{ color: 'var(--gold)' }}>프라임</b>만 교체할 수 있습니다.</span>
          ) : (
            <span>피치 위의 선수를 먼저 선택한 뒤 그 선수의 <b style={{ color: 'var(--gold)' }}>프라임</b>을 교체하세요.</span>
          )
        ) : state.selected ? (
          isOutGk ? (
            <span>🧤 <b style={{ color: '#38bdf8' }}>골키퍼</b> 교체 대상 선택 중...</span>
          ) : (
            <span>🏃‍♂️ <b style={{ color: 'var(--green-bright)' }}>필드 선수</b> 교체 대상 선택 중...</span>
          )
        ) : (
          <span>피치 위의 선수를 먼저 선택한 뒤 <b style={{ color: 'var(--green-bright)' }}>교체</b>를 누르세요.</span>
        )}
      </div>
      {showPrime ? (
        <div>
          {filteredPrime.map(({ d, basePlayer }) => {
            const basePlayerId = d.id.replace(/^prime/, '');
            const canSub = state.editable && !!state.selected && selectedBaseId === basePlayerId;

            return (
              <div
                className={`bench-item ${state.viewedId === d.id ? 'viewed' : ''}`}
                key={d.id}
                onClick={() => viewPlayer(d.id)}
              >
                <div className="bdisc num prime">{jerseyNumber(d.id)}</div>
                <div className="bname">
                  {d.name}
                  <div className="bstatus">{basePlayer?.positions?.[0] ?? ''} · {d.height}cm · {d.label}</div>
                </div>
                <button
                  className="btn-sub"
                  disabled={!canSub}
                  onClick={(e) => { e.stopPropagation(); handleSub(d.id); }}
                  title={
                    !state.selected ? '피치 위에서 교체할 선수를 먼저 클릭하세요.' :
                    !canSub ? `${basePlayer?.name ?? d.name} 선수가 선택되어 있을 때만 프라임으로 교체할 수 있습니다.` : ''
                  }
                >
                  {canSub ? '교체' : '불가'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          {filteredBench.map(d => {
            const isInGk = d.positions.includes('GK');
            const isGkMismatch = state.selected ? (isOutGk !== isInGk) : false;
            // 이 선수의 프라임이 이미 다른 자리에 나가 있으면, 그 자리를 선택했을 때만 되돌릴 수 있다.
            const primeSlotId = `prime${d.id}`;
            const primeElsewhere = !!state.players[primeSlotId] && state.selected !== primeSlotId;
            const canSub = state.editable && !!state.selected && !isGkMismatch && !primeElsewhere;
            const blocked = isGkMismatch || primeElsewhere;

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
                    isGkMismatch ? (isOutGk ? '골키퍼는 골키퍼끼리만 교체할 수 있습니다!' : '필드 선수를 골키퍼와 교체할 수 없습니다!') :
                    primeElsewhere ? `${d.name} 선수의 프라임이 이미 나가 있습니다. 그 자리를 선택해야 되돌릴 수 있습니다.` : ''
                  }
                >
                  {blocked && state.selected ? '불가' : '교체'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
