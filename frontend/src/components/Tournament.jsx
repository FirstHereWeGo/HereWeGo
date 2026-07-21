import { useEffect, useState } from 'react';
import { useGameState } from '../state/GameContext';
import { getTactics, getTeams, postMatchSimulation } from '../api/client';
import { buildMyTeamConfig, buildPresetTeamConfig } from '../utils/matchPayload';
import { buildInitialBracket, losersFromMatches, nextRoundPairs, simulatePenalties } from '../utils/tournament';

const STAGE_LABEL = { qf: '8강 시작', sf: '4강 시작', final: '결승 & 3위전 시작' };

function TeamRow({ team, won, score }) {
  return (
    <div className={`bracket-team ${won ? 'winner' : ''}`}>
      <img className="bracket-flag" src={`/flags/${team.id}.png`} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
      <span className="bracket-tname">{team.name}</span>
      <span className="bracket-score">{score ?? ''}</span>
    </div>
  );
}

function MatchBox({ match, onOpenDetail }) {
  if (!match) return <div className="bracket-match bracket-match-empty">?</div>;
  const { home, away, result } = match;
  return (
    <div className={`bracket-match ${result ? 'played' : ''}`} onClick={() => result && onOpenDetail(match)}>
      <TeamRow team={home} won={!!result && result.winnerId === home.id} score={result?.scoreA} />
      <TeamRow team={away} won={!!result && result.winnerId === away.id} score={result?.scoreB} />
      {result?.pso && <div className="bracket-pso">승부차기 {result.pso.scoreA} : {result.pso.scoreB}</div>}
    </div>
  );
}

export default function Tournament({ myTeamId, oppTeamId, onBack }) {
  const state = useGameState();
  const [pool, setPool] = useState(null); // { teams, tactics }
  const [bracket, setBracket] = useState(null);
  const [stage, setStage] = useState('qf'); // qf | sf | final | done
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [teams, tactics] = await Promise.all([getTeams(), getTactics()]);
        setPool({ teams, tactics });
        setBracket(buildInitialBracket(teams, myTeamId, oppTeamId));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [myTeamId, oppTeamId]);

  function configFor(team) {
    if (team.id === myTeamId) {
      const mine = buildMyTeamConfig(state);
      if (mine) return mine;
    }
    return buildPresetTeamConfig(team.id, pool.tactics);
  }

  async function simulateOneMatch(match) {
    const sim = await postMatchSimulation({ teamA: configFor(match.home), teamB: configFor(match.away) });
    let pso = null;
    let winnerId;
    if (sim.scoreA === sim.scoreB) {
      pso = simulatePenalties();
      winnerId = pso.scoreA > pso.scoreB ? match.home.id : match.away.id;
    } else {
      winnerId = sim.scoreA > sim.scoreB ? match.home.id : match.away.id;
    }
    return { ...match, result: { scoreA: sim.scoreA, scoreB: sim.scoreB, events: sim.events, pso, winnerId } };
  }

  async function playRound() {
    if (!bracket || simulating) return;
    setSimulating(true);
    setError(null);
    try {
      if (stage === 'qf') {
        const played = await Promise.all(bracket.qf.map(simulateOneMatch));
        setBracket({ ...bracket, qf: played, sf: nextRoundPairs(played) });
        setStage('sf');
      } else if (stage === 'sf') {
        const played = await Promise.all(bracket.sf.map(simulateOneMatch));
        const [loserA, loserB] = losersFromMatches(played);
        setBracket({ ...bracket, sf: played, final: nextRoundPairs(played)[0], bronze: { home: loserA, away: loserB, result: null } });
        setStage('final');
      } else if (stage === 'final') {
        const [finalPlayed, bronzePlayed] = await Promise.all([
          simulateOneMatch(bracket.final),
          simulateOneMatch(bracket.bronze),
        ]);
        setBracket({ ...bracket, final: finalPlayed, bronze: bronzePlayed });
        setStage('done');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  if (error && !bracket) {
    return (
      <section className="view-board">
        <div className="board-loading">토너먼트 데이터를 불러오지 못했습니다: {error}</div>
      </section>
    );
  }
  if (!bracket) {
    return (
      <section className="view-board">
        <div className="board-loading">불러오는 중...</div>
      </section>
    );
  }

  const championTeam = stage === 'done'
    ? (bracket.final.result.winnerId === bracket.final.home.id ? bracket.final.home : bracket.final.away)
    : null;

  return (
    <section className="view-board">
      <div className="topbar">
        <div className="topbar-side left">
          <div className="brand" role="button" onClick={onBack}>PRIME<span>REWIND</span></div>
        </div>
        <div className="topbar-side right">
          {stage !== 'done' ? (
            <button className="btn-ghost bracket-play-btn" disabled={simulating} onClick={playRound}>
              {simulating ? '시뮬레이션 중...' : STAGE_LABEL[stage]}
            </button>
          ) : (
            <div className="bracket-champion-banner">🏆 {championTeam.name} 우승</div>
          )}
          <button className="btn-ghost" onClick={onBack}>포메이션으로</button>
        </div>
      </div>

      {error && <div className="timeline-panel glass timeline-error">시뮬레이션 실패: {error}</div>}

      <div className="bracket-wrap">
        <div className="bracket-grid">
          <div className="bracket-col">
            <MatchBox match={bracket.qf[0]} onOpenDetail={setDetail} />
            <MatchBox match={bracket.qf[1]} onOpenDetail={setDetail} />
          </div>
          <div className="bracket-col bracket-col-mid">
            <MatchBox match={bracket.sf?.[0]} onOpenDetail={setDetail} />
          </div>
          <div className="bracket-col bracket-col-center">
            <div className="bracket-title">WORLD CHAMPION</div>
            <MatchBox match={bracket.final} onOpenDetail={setDetail} />
            <div className="bracket-bronze-label">BRONZE FINAL</div>
            <MatchBox match={bracket.bronze} onOpenDetail={setDetail} />
          </div>
          <div className="bracket-col bracket-col-mid">
            <MatchBox match={bracket.sf?.[1]} onOpenDetail={setDetail} />
          </div>
          <div className="bracket-col">
            <MatchBox match={bracket.qf[2]} onOpenDetail={setDetail} />
            <MatchBox match={bracket.qf[3]} onOpenDetail={setDetail} />
          </div>
        </div>
      </div>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal-card glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {detail.home.name} {detail.result.scoreA} : {detail.result.scoreB} {detail.away.name}
            </div>
            {detail.result.pso && (
              <div className="modal-pso">승부차기 {detail.result.pso.scoreA} : {detail.result.pso.scoreB}</div>
            )}
            <div className="timeline-panel modal-timeline">
              {detail.result.events.length === 0 && <div className="timeline-empty">득점 기록 없음</div>}
              {detail.result.events.map((e, i) => (
                <div key={i} className={`timeline-chip ${e.team === 'teamA' ? 'home' : 'away'}`}>
                  {e.minute}' ⚽ {e.scorer} ({e.team === 'teamA' ? detail.home.id.toUpperCase() : detail.away.id.toUpperCase()})
                </div>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => setDetail(null)}>닫기</button>
          </div>
        </div>
      )}
    </section>
  );
}
