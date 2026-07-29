import { useEffect, useState } from 'react';
import { getTeams, getTactics, getFormations } from '../api/client';
import { describeTeamStyle } from '../utils/teamStyle';

export default function TeamSelect({ onStartTournament }) {
  const [teams, setTeams] = useState([]);
  const [tacticByTeam, setTacticByTeam] = useState({});
  const [formationById, setFormationById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [allTeams, tactics, formations] = await Promise.all([getTeams(), getTactics(), getFormations()]);
        // 전술 프리셋(기본 선발/포메이션)이 없는 팀은 토너먼트에 낼 수 없으므로 제외
        const presetById = Object.fromEntries(tactics.map(t => [t.teamId, t]));
        const selectable = allTeams.filter(t => presetById[t.id]);
        setTeams(selectable);
        setTacticByTeam(presetById);
        setFormationById(Object.fromEntries(formations.map(f => [f.id, f])));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedTeam = teams.find(t => t.id === selectedId);
  const selectedPreset = selectedId ? tacticByTeam[selectedId] : null;
  const selectedFormation = selectedPreset ? formationById[selectedPreset.formationId] : null;

  if (loading) {
    return (
      <section className="view-teamselect">
        <div className="board-loading">불러오는 중...</div>
      </section>
    );
  }
  if (error) {
    return (
      <section className="view-teamselect">
        <div className="board-loading">데이터를 불러오지 못했습니다: {error}</div>
      </section>
    );
  }

  return (
    <section className="view-teamselect">
      <div className="teamselect-inner">
        <div className="landing-eyebrow">TOURNAMENT ENTRY</div>
        <h2 className="section-title">국가를 선택하세요</h2>

        <div className="country-desc">
          {selectedTeam ? (
            <>
              <div className="country-desc-team">{selectedTeam.name}</div>
              <div className="country-desc-style">{describeTeamStyle(selectedPreset.tacticConfig)}</div>
              {selectedFormation && <div className="country-desc-formation">대표 포메이션 {selectedFormation.name}</div>}
            </>
          ) : (
            <div className="country-desc-placeholder">국기를 선택하면 팀 스타일이 표시됩니다</div>
          )}
        </div>

        <div className="country-row">
          {teams.map(t => (
            <button
              key={t.id}
              className={`country-btn ${selectedId === t.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(t.id)}
            >
              <img
                className="country-btn-flag"
                src={`/flags/${t.id}.png`}
                alt={t.name}
                onError={(e) => { e.target.style.visibility = 'hidden'; }}
              />
              <span className="country-btn-name">{t.name}</span>
            </button>
          ))}
        </div>

        <button
          className="cta"
          disabled={!selectedId}
          onClick={() => onStartTournament(selectedId)}
        >
          토너먼트 시작
        </button>
      </div>
    </section>
  );
}
