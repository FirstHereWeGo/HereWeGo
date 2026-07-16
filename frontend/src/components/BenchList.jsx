import { useGameState, useGameActions } from '../state/GameContext';
import { SQUAD, ROLE_KR } from '../data/squad';

export default function BenchList() {
  const state = useGameState();
  const { makeSub } = useGameActions();

  function handleSub(benchId) {
    makeSub(benchId);
  }

  // 1. 피치 위에서 현재 선택된 선수 가져오기
  const selected = state.selected ? state.players[state.selected] : null;

  // ⭐ 2. 선택된 선수가 골키퍼인지 확인 (선택 안 했으면 false)
  const isOutGk = selected ? selected.data.pref.includes('GK') : false;

  return (
    <div className="bench">
      <h4>벤치 · SUBSTITUTES</h4>
      <div className="subs-left">
        {state.subsLeft > 0 ? `남은 교체 카드: ${state.subsLeft}장` : '교체 카드 소진 — 교체 불가'}
      </div>
      <div className="bench-hint">
        {selected ? (
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
          const d = SQUAD[b.id];
          if (!d) return null;

          // ⭐ 3. 벤치에 있는 후보 선수가 골키퍼인지 확인
          const isInGk = d.pref.includes('GK');

          // ⭐ 4. 포지션 미스매치 검사 (둘 중 하나만 골키퍼이면 true -> 교체 불가)
          const isGkMismatch = selected ? (isOutGk !== isInGk) : false;

          // ⭐ 5. 최종 교체 가능 여부 조건 (골키퍼 미스매치가 아닐 때만 가능!)
          const canSub =
            b.status === 'ok' &&
            state.subsLeft > 0 &&
            state.editable &&
            selected &&
            !isGkMismatch;

          const statusTxt =
            b.status === 'ok'
              ? `${ROLE_KR[d.pref[0]] || d.pref[0]} · ${d.h}cm · ${d.age}세`
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
              <button 
                className="btn-sub" 
                disabled={!canSub} 
                onClick={() => handleSub(b.id)}
                /* ⭐ 6. 왜 교체가 안 되는지 마우스 올렸을 때 툴팁으로 설명해 주기 */
                title={
                  !selected ? '피치 위에서 교체할 선수를 먼저 클릭하세요.' :
                  isGkMismatch ? (isOutGk ? '골키퍼는 골키퍼끼리만 교체할 수 있습니다!' : '필드 선수를 골키퍼와 교체할 수 없습니다!') : ''
                }
              >
                {b.status !== 'ok' ? '완료' : isGkMismatch && selected ? '불가' : '교체'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}