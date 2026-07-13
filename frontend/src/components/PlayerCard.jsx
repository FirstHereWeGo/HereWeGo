import { useGameState, useGameActions } from '../state/GameContext';
import { effStats, roleInfo } from '../engine/stats';
import { STAT_NAMES, KEY_STATS, ROLE_KR } from '../data/squad';

export default function PlayerCard() {
  const state = useGameState();
  const { togglePrime, recalc } = useGameActions();
  const id = state.selected;
  const p = id ? state.players[id] : null;

  if (!p) {
    return (
      <div className="pcard">
        <div className="pcard-empty">
          필드의 선수를 선택하면
          <br />
          능력치 카드가 표시됩니다
        </div>
      </div>
    );
  }

  const es = effStats(p);
  const { role, fit } = roleInfo(p);
  const keyIdx = new Set(KEY_STATS[p.data.pref[0]] || []);

  const fitChip =
    fit === 'ok' ? (
      <span className="bio-chip fit-ok">현재 {ROLE_KR[role]} · 적합</span>
    ) : fit === 'off' ? (
      <span className="bio-chip fit-bad">현재 {ROLE_KR[role]} · 부적응 −8%</span>
    ) : (
      <span className="bio-chip fit-bad">포지션 오류 −20%</span>
    );

  function handleTogglePrime() {
    togglePrime();
    setTimeout(recalc, 0);
  }

  return (
    <div className={`pcard ${p.prime ? 'prime-active' : ''}`}>
      <div className="pcard-head">
        <div className="pcard-name">
          {p.data.star ? <span className="star">★ </span> : null}
          {p.data.name}
        </div>
        <div className="pcard-pos">
          NO.{p.data.no} · 선호 {p.data.pref.map(r => ROLE_KR[r]).join('/')}
        </div>
      </div>
      <div className="bio-row">
        <span className="bio-chip">{p.data.h}cm</span>
        <span className="bio-chip">
          {p.data.age}세{p.prime ? ' → 피크 27세' : ''}
        </span>
        {fitChip}
        {p.prime ? <span className="bio-chip prime-chip">★ 전성기 +15%</span> : null}
      </div>
      <div className="stat-grid">
        {STAT_NAMES.map((name, i) => (
          <div key={name} className={`statline ${keyIdx.has(i) ? 'keystat' : ''} ${p.prime ? 'boosted' : ''}`}>
            <span className="sname">{name}</span>
            <div className="sbar">
              <div className="sfill" style={{ width: `${es[i]}%` }} />
            </div>
            <span className="sval num">{es[i]}</span>
          </div>
        ))}
      </div>
      <button
        className={`btn-prime ${p.prime ? 'on' : ''}`}
        disabled={!p.data.star}
        onClick={handleTogglePrime}
      >
        {p.data.star ? (p.prime ? '★ 전성기 모드 ON' : '전성기 소환') : '전성기 소환 불가'}
      </button>
    </div>
  );
}
