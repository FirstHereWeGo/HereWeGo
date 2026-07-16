import { useGameState, useGameActions } from '../state/GameContext';
import { effStats, roleInfo } from '../engine/stats';
import { STAT_NAMES, KEY_STATS, ROLE_KR } from '../data/squad';

export default function PlayerCard() {
  const state = useGameState();
  const { togglePrime } = useGameActions();
  const id = state.selected;
  const p = id ? state.players[id] : null;

  if (!p) {
    return (
      <div className="pcard">
        <div className="pcard-empty">
          피치 위의 선수를 클릭하면
          <br />
          상세 정보가 표시됩니다
        </div>
      </div>
    );
  }

  const es = effStats(p);
  const { role, fit } = roleInfo(p);
  const keyIdx = new Set(KEY_STATS[p.data.pref[0]] || []);

  const fitChip =
    fit === 'ok' ? (
      <span className="bio-chip fit-ok">{ROLE_KR[role]} · 적합</span>
    ) : fit === 'off' ? (
      <span className="bio-chip fit-bad">{ROLE_KR[role]} · 부적응 −8%</span>
    ) : (
      <span className="bio-chip fit-bad">포지션 오류 −20%</span>
    );

  return (
    <div className={`pcard ${p.prime ? 'prime-active' : ''}`}>
      <div className="pcard-top">
       {/* ⭐ 프로필 사진 적용 영역 (완벽 해결 코드!) */}
        <div className="photo-ph" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
          <span className="photo-no num">{p.data.no}</span>
          <span className="photo-note">PHOTO</span>

          <img 
            key={p.data.no} // ⭐ [핵심 1] 선수가 바뀔 때마다 숨김 상태가 초기화된 새 태그를 생성!
            src={`/players/${p.data.no}.png`} 
            alt={p.data.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 999,
              backgroundColor: '#1a1a1a'
            }}
            /* ⭐ [핵심 2] 사진을 성공적으로 불러오면 무조건 화면에 띄움 (숨김 상태 해제!) */
            onLoad={(e) => { e.target.style.display = 'block'; }}
            /* 사진이 없는 선수일 경우에만 숨김 처리 */
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        </div>

        <div className="pcard-head">
          <div className="pcard-name">
            {p.data.star ? <span className="star">★ </span> : null}
            {p.data.name}
          </div>
          <div className="pcard-pos">
            NO.{p.data.no} · {p.data.pref.map(r => ROLE_KR[r]).join('/')}
          </div>
          <div className="bio-row">
            <span className="bio-chip">{p.data.h}cm</span>
            <span className="bio-chip">{p.data.age}세{p.prime ? '→27' : ''}</span>
            {fitChip}
          </div>
        </div>
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
        disabled={!p.data.star || !state.editable}
        onClick={() => togglePrime()}
      >
        {p.data.star ? (p.prime ? '★ 전성기 모드 ON' : '⚡ 전성기 소환') : '전성기 소환 불가'}
      </button>
    </div>
  );
}