import { useGameState } from '../state/GameContext';
import { ATTRIBUTE_LABELS, KEY_ATTRS, ROLE_KR } from '../data/positionLabels';
import { jerseyNumber } from '../utils/playerDisplay';

export default function PlayerCard() {
  const state = useGameState();
  const id = state.viewedId;
  const d = id ? (state.players[id]?.data ?? state.team?.players.find(p => p.id === id)) : null;

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

  const no = jerseyNumber(d.id);
  const isGk = d.positions.includes('GK');
  const keySet = new Set(KEY_ATTRS[d.positions[0]] || []);

  return (
    <div className="pcard">
      <div className="pcard-top">
        <div className="photo-ph" style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#111' }}>
          <span className="photo-no num">{no}</span>
          <span className="photo-note">PHOTO</span>
          <img
            key={d.id}
            src={`/players/${d.id}.png`}
            alt={d.name}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              objectFit: 'cover', zIndex: 999, backgroundColor: '#1a1a1a',
            }}
            onLoad={(e) => { e.target.style.display = 'block'; }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>

        <div className="pcard-head">
          <div className="pcard-name">{d.name}</div>
          <div className="pcard-pos">
            NO.{no} · {d.positions.map(r => ROLE_KR[r]).join('/')}
          </div>
          <div className="bio-row">
            <span className="bio-chip">{d.height}cm</span>
            <span className="bio-chip">{d.age}세</span>
          </div>
        </div>
      </div>

      {isGk ? (
        <div className="stat-grid">
          <div className="statline keystat">
            <span className="sname">종합 능력치</span>
            <div className="sbar">
              <div className="sfill" style={{ width: `${(d.attributes.overall / 20) * 100}%` }} />
            </div>
            <span className="sval num">{d.attributes.overall}</span>
          </div>
        </div>
      ) : (
        <div className="stat-grid">
          {ATTRIBUTE_LABELS.map(([key, name]) => (
            <div key={key} className={`statline ${keySet.has(key) ? 'keystat' : ''}`}>
              <span className="sname">{name}</span>
              <div className="sbar">
                <div className="sfill" style={{ width: `${(d.attributes[key] / 20) * 100}%` }} />
              </div>
              <span className="sval num">{d.attributes[key]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
