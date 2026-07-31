import { useGameState } from '../state/GameContext';
import { ATTRIBUTE_LABELS, GK_ATTRIBUTE_LABELS, KEY_ATTRS } from '../data/positionLabels';
import { jerseyNumber } from '../utils/playerDisplay';
import FootRating from './FootRating';

export default function PlayerCard() {
  const state = useGameState();
  const id = state.viewedId;
  const primeMatch = id ? state.primePlayers.find(p => p.id === id) : null;
  const d = id
    ? (state.players[id]?.data
      ?? state.team?.players.find(p => p.id === id)
      ?? state.oppTeam?.players.find(p => p.id === id)
      ?? primeMatch)
    : null;

  if (!d) {
    return (
      <div className="pcard">
        <div className="pcard-empty">
          피치 또는 벤치의 선수를 클릭하면
          <br />
          상세 정보가 표시됩니다
        </div>
      </div>
    );
  }

  const isPrime = !!primeMatch;
  // PrimePlayer에는 positions가 없어서 기준이 된 원래 선수(teams.py의 kor-7 등)에서 가져온다.
  const basePlayer = isPrime
    ? (state.team?.players.find(p => p.id === d.id.replace(/^prime/, ''))
      ?? state.oppTeam?.players.find(p => p.id === d.id.replace(/^prime/, '')))
    : null;
  const positions = isPrime ? (basePlayer?.positions ?? []) : d.positions;
  // prime 선수는 전용 사진(/players/{prime id}.png)을 우선 쓰고, 없으면 기준 선수 사진으로 대체한다.
  const photoId = d.id;
  const photoFallbackId = isPrime ? d.id.replace(/^prime/, '') : null;

  const no = jerseyNumber(d.id);
  const isGk = positions.includes('GK');
  const keySet = new Set(KEY_ATTRS[positions[0]] || []);

  return (
    <div className={`pcard ${isPrime ? 'prime-active' : ''}`}>
      <div className="pcard-top">
        <div className="photo-ph" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
          <span className="photo-no num">{no}</span>
          <span className="photo-note">PHOTO</span>
          <img
            key={photoId}
            src={`/players/${photoId}.png`}
            alt={d.name}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 999, backgroundColor: '#1a1a1a',
            }}
            onLoad={(e) => { e.target.style.display = 'block'; }}
            onError={(e) => {
              if (photoFallbackId && !e.target.dataset.fallback) {
                e.target.dataset.fallback = '1';
                e.target.src = `/players/${photoFallbackId}.png`;
                return;
              }
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="pcard-head">
          <div className="pcard-name">{d.name}</div>
          <div className="pcard-pos">
            NO.{no} · {positions.join('/')}
          </div>
          <div className="bio-row">
            {isPrime && <span className="bio-chip prime">⭐ {d.label}</span>}
            <span className="bio-chip">{d.height}cm</span>
            <span className="bio-chip">{d.age}세</span>
          </div>
          <FootRating leftFoot={d.leftFoot} rightFoot={d.rightFoot} />
        </div>
      </div>

      {isGk ? (
        <div className="stat-grid">
          {GK_ATTRIBUTE_LABELS.map(([key, name]) => (
            <div key={key} className="statline">
              <span className="sname">{name}</span>
              <div className="sbar">
                <div className="sfill" style={{ width: `${(d.attributes[key] / 100) * 100}%` }} />
              </div>
              <span className="sval num">{d.attributes[key]}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-grid">
          {ATTRIBUTE_LABELS.map(([key, name]) => (
            <div key={key} className={`statline ${keySet.has(key) ? 'keystat' : ''}`}>
              <span className="sname">{name}</span>
              <div className="sbar">
                <div className="sfill" style={{ width: `${(d.attributes[key] / 100) * 100}%` }} />
              </div>
              <span className="sval num">{d.attributes[key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
