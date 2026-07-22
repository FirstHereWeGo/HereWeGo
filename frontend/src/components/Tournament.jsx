import { useEffect, useRef, useState } from 'react';
import { useGameState } from '../state/GameContext';
import { getTactics, getTeams, postMatchSimulation } from '../api/client';
import { buildMyTeamConfig, buildPresetTeamConfig } from '../utils/matchPayload';
import { buildInitialBracket, losersFromMatches, nextRoundPairs, simulatePenalties } from '../utils/tournament';
import BracketLines from './BracketLines';

const STAGE_TITLE = { qf: 'QUARTER-FINALS', sf: 'SEMI-FINALS', final: 'FINAL', done: 'CHAMPION' };

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

export default function Tournament({ myTeamId, onBack }) {
  const state = useGameState();
  const [pool, setPool] = useState(null); // { teams, tactics }
  const [bracket, setBracket] = useState(null);
  const [stage, setStage] = useState('qf'); // qf | sf | final | done
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const gridRef = useRef(null);
  const qfRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const sfRefs = [useRef(null), useRef(null)];
  const finalRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [teams, tactics] = await Promise.all([getTeams(), getTactics()]);
        setPool({ teams, tactics });
        setBracket(buildInitialBracket(teams, myTeamId));
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [myTeamId]);

  function configFor(team) {
    if (team.id === myTeamId) {
      const mine = buildMyTeamConfig(state);
      if (mine) return mine;
    }
    return buildPresetTeamConfig(team.id, pool.tactics);
  }

  async function simulateOneMatch(match) {
    const teamA = configFor(match.home);
    const teamB = configFor(match.away);

    const reg = await postMatchSimulation({ teamA, teamB });
    let scoreA = reg.scoreA;
    let scoreB = reg.scoreB;
    let events = reg.events;
    let pso = null;

    if (scoreA === scoreB) {
      const et = await postMatchSimulation({ teamA, teamB, durationMinutes: 30, minuteOffset: 90 });
      scoreA += et.scoreA;
      scoreB += et.scoreB;
      events = [...events, ...et.events];
    }

    let winnerId;
    if (scoreA === scoreB) {
      pso = simulatePenalties();
      winnerId = pso.scoreA > pso.scoreB ? match.home.id : match.away.id;
    } else {
      winnerId = scoreA > scoreB ? match.home.id : match.away.id;
    }
    return { ...match, result: { scoreA, scoreB, events, pso, winnerId } };
  }

  /** 현재 라운드를 시뮬레이션하고, 그 라운드에서 내 팀이 뛴 경기를 반환한다(탈락 후엔 null). */
  async function playRound() {
    if (!bracket || simulating) return null;
    setSimulating(true);
    setError(null);
    try {
      let roundMatches = [];
      if (stage === 'qf') {
        const played = await Promise.all(bracket.qf.map(simulateOneMatch));
        setBracket(b => ({ ...b, qf: played, sf: nextRoundPairs(played) }));
        setStage('sf');
        roundMatches = played;
      } else if (stage === 'sf') {
        const played = await Promise.all(bracket.sf.map(simulateOneMatch));
        const [loserA, loserB] = losersFromMatches(played);
        setBracket(b => ({ ...b, sf: played, final: nextRoundPairs(played)[0], bronze: { home: loserA, away: loserB, result: null } }));
        setStage('final');
        roundMatches = played;
      } else if (stage === 'final') {
        const [finalPlayed, bronzePlayed] = await Promise.all([
          simulateOneMatch(bracket.final),
          simulateOneMatch(bracket.bronze),
        ]);
        setBracket(b => ({ ...b, final: finalPlayed, bronze: bronzePlayed }));
        setStage('done');
        roundMatches = [finalPlayed, bronzePlayed];
      }
      return roundMatches.find(m => m.home.id === myTeamId || m.away.id === myTeamId) ?? null;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSimulating(false);
    }
  }

  /** 아직 열리지 않은(result 없는) 현재 라운드의 내 경기 상대 id — 탈락했거나 우승했으면 null. */
  function myUpcomingOpponentId() {
    const stageMatches = stage === 'qf' ? bracket.qf : stage === 'sf' ? (bracket.sf ?? []) : stage === 'final' ? [bracket.final] : [];
    const mine = stageMatches.find(m => m && !m.result && (m.home.id === myTeamId || m.away.id === myTeamId));
    if (!mine) return null;
    return mine.home.id === myTeamId ? mine.away.id : mine.home.id;
  }

  async function handleStartMatch() {
    await playRound(); // 대진표만 갱신 — 화면 전환은 "전술 수정" 버튼에서만 한다
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
  const upcomingOpponentId = myUpcomingOpponentId();

  return (
    <section className="view-board">
      <div className="topbar">
        <div className="topbar-side left">
          <div className="brand">PRIME<span>REWIND</span></div>
        </div>
      </div>

      <div className="bracket-header">
        <div className="bracket-header-eyebrow">WORLD CUP</div>
        <div className="bracket-header-title">{STAGE_TITLE[stage]}</div>
      </div>

      {error && <div className="timeline-panel glass timeline-error">시뮬레이션 실패: {error}</div>}

      <div className="bracket-wrap">
        <div className="bracket-grid" ref={gridRef}>
          <BracketLines containerRef={gridRef} qfRefs={qfRefs} sfRefs={sfRefs} finalRef={finalRef} watch={bracket} />

          <div className="bracket-col">
            <div ref={qfRefs[0]}><MatchBox match={bracket.qf[0]} onOpenDetail={setDetail} /></div>
            <div ref={qfRefs[1]}><MatchBox match={bracket.qf[1]} onOpenDetail={setDetail} /></div>
          </div>
          <div className="bracket-col bracket-col-mid">
            <div ref={sfRefs[0]}><MatchBox match={bracket.sf?.[0]} onOpenDetail={setDetail} /></div>
          </div>
          <div className="bracket-col bracket-col-center">
            <div className="bracket-trophy">🏆</div>
            <div className="bracket-title">WORLD CHAMPION</div>
            <div ref={finalRef}><MatchBox match={bracket.final} onOpenDetail={setDetail} /></div>
            <div className="bracket-bronze-label">BRONZE FINAL</div>
            <MatchBox match={bracket.bronze} onOpenDetail={setDetail} />
          </div>
          <div className="bracket-col bracket-col-mid">
            <div ref={sfRefs[1]}><MatchBox match={bracket.sf?.[1]} onOpenDetail={setDetail} /></div>
          </div>
          <div className="bracket-col">
            <div ref={qfRefs[2]}><MatchBox match={bracket.qf[2]} onOpenDetail={setDetail} /></div>
            <div ref={qfRefs[3]}><MatchBox match={bracket.qf[3]} onOpenDetail={setDetail} /></div>
          </div>
        </div>
      </div>

      <div className="bracket-bottom-bar">
        {stage !== 'done' ? (
          <>
            <button className="btn-ghost" disabled={!upcomingOpponentId} onClick={() => onBack(upcomingOpponentId)}>
              전술 수정
            </button>
            <button className="cta" disabled={simulating} onClick={handleStartMatch}>
              {simulating ? '시뮬레이션 중...' : '경기 시작'}
            </button>
          </>
        ) : (
          <div className="bracket-champion-banner">🏆 {championTeam.name} 우승</div>
        )}
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
