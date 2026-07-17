import { useEffect, useState } from 'react';
import { getTeams, getTactics } from '../api/client';

export default function TeamSelect({ onConfirm }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myTeamId, setMyTeamId] = useState(null);
  const [oppTeamId, setOppTeamId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [allTeams, tactics] = await Promise.all([getTeams(), getTactics()]);
        // 전술 프리셋(기본 선발/포메이션)이 없는 팀은 라인업을 구성할 수 없으므로 제외
        const presetTeamIds = new Set(tactics.map(t => t.teamId));
        const selectable = allTeams.filter(t => presetTeamIds.has(t.id));
        setTeams(selectable);
        if (selectable.length >= 2) {
          setMyTeamId(selectable[0].id);
          setOppTeamId(selectable[1].id);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleConfirm() {
    if (!myTeamId || !oppTeamId || myTeamId === oppTeamId) return;
    onConfirm(myTeamId, oppTeamId);
  }

  // 상대팀에서 이미 고른 팀을 내 팀으로(또는 그 반대로) 클릭하면 두 슬롯을 맞바꾼다.
  function selectMyTeam(id) {
    if (id === oppTeamId) setOppTeamId(myTeamId);
    setMyTeamId(id);
  }
  function selectOppTeam(id) {
    if (id === myTeamId) setMyTeamId(oppTeamId);
    setOppTeamId(id);
  }

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
        <div className="landing-eyebrow">TEAM SELECT</div>
        <h2 className="section-title">내 팀과 상대 팀을 선택하세요</h2>

        <div className="teamselect-cols">
          <div className="teamselect-col">
            <div className="sb-heading">내 팀</div>
            {teams.map(t => (
              <button
                key={t.id}
                className={`fm-btn wide ${myTeamId === t.id ? 'on' : ''}`}
                onClick={() => selectMyTeam(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="teamselect-col">
            <div className="sb-heading">상대 팀</div>
            {teams.map(t => (
              <button
                key={t.id}
                className={`fm-btn wide ${oppTeamId === t.id ? 'on' : ''}`}
                onClick={() => selectOppTeam(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <button
          className="cta"
          disabled={!myTeamId || !oppTeamId || myTeamId === oppTeamId}
          onClick={handleConfirm}
        >
          전술 짜러 가기
        </button>
      </div>
    </section>
  );
}
