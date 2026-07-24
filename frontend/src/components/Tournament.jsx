import { useEffect, useRef, useState } from 'react';
import { useGameState } from '../state/GameContext';
import { getTactics, getTeams, postMatchSimulation, postMatchStats } from '../api/client';
import { buildMyTeamConfig, buildPresetTeamConfig } from '../utils/matchPayload';
import {
  buildInitialBracket,
  losersFromMatches,
  nextRoundPairs,
  simulatePenalties,
  MATCH_PHASES,
  EXTRA_TIME_PHASES,
  mergeMatchStats,
  clampShotsToGoals,
} from '../utils/tournament';
import BracketLines from './BracketLines';
import LiveMatchDashboard from './LiveMatchDashboard';

// 대시보드는 실제 유니폼 색 대신, 국가 조합에 따라 우연히 색이 겹쳐도(예: 둘 다 빨강 계열)
// 항상 구분되도록 "내 팀=초록/상대=빨강" 고정 팔레트를 쓴다 - WinProbabilityPanel의
// .mine/.opp 점 색상과 동일한 값이다.
const MY_COLOR = '#34e07a';
const OPP_COLOR = '#ef5350';

const STAGE_TITLE = { qf: 'QUARTER-FINALS', sf: 'SEMI-FINALS', final: 'FINAL', done: 'CHAMPION' };

/** 구간 하나(하이드레이션 브레이크 사이)의 스코어/통계를 함께 시뮬레이션한다. */
async function simulatePhase(teamA, teamB, phaseDef) {
  const [sim, stats] = await Promise.all([
    postMatchSimulation({ teamA, teamB, durationMinutes: phaseDef.duration, minuteOffset: phaseDef.offset }),
    postMatchStats({ teamA, teamB, durationMinutes: phaseDef.duration }),
  ]);
  return { sim, stats };
}

function continueLabel(lm, stage, myTeamId) {
  if (lm.finished) {
    const winnerId = lm.pso
      ? (lm.pso.scoreA > lm.pso.scoreB ? lm.match.home.id : lm.match.away.id)
      : (lm.scoreA > lm.scoreB ? lm.match.home.id : lm.match.away.id);
    const iWon = winnerId === myTeamId;
    if (stage === 'qf') return iWon ? '4강으로' : '다음 경기로';
    if (stage === 'sf') return iWon ? '결승으로' : '3,4위전으로';
    return '다음 경기로';
  }
  const atEndOfRegular = lm.phaseIndex === MATCH_PHASES.length - 1 && lm.phases.length === MATCH_PHASES.length;
  if (atEndOfRegular && lm.scoreA === lm.scoreB) return '연장전 시작';
  return '계속 진행';
}

/** a:b를 각자 절반 트랙 기준 채움 비율(%)로 바꾼다 — "7:3이면 끝을 10으로 본 7:3 비율". */
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

export default function Tournament({ myTeamId, onBack, onHome }) {
  const state = useGameState();
  const [pool, setPool] = useState(null); // { teams, tactics }
  const [bracket, setBracket] = useState(null);
  const [stage, setStage] = useState('qf'); // qf | sf | final | done
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [liveMatch, setLiveMatch] = useState(null); // 사용자 팀 경기가 구간별로 진행 중일 때만 값이 있음
  const [pendingOthers, setPendingOthers] = useState([]); // 같은 라운드의 다른 경기 결과 - 내 경기가 끝나야 대진표에 함께 반영

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

  function currentStageMatches() {
    if (stage === 'qf') return bracket.qf;
    if (stage === 'sf') return bracket.sf ?? [];
    if (stage === 'final') return [bracket.final, bracket.bronze].filter(Boolean);
    return [];
  }

  /** matches(현재 라운드 원래 순서) + 이미 끝난 결과들로 다음 라운드의 bracket/stage를 계산한다(상태는 바꾸지 않는 순수 함수). */
  function computeNextRound(curBracket, curStage, matches, mineResult, othersPlayed) {
    const played = matches.map(m => {
      if (mineResult && m.home.id === mineResult.home.id && m.away.id === mineResult.away.id) return mineResult;
      return othersPlayed.find(o => o.home.id === m.home.id && o.away.id === m.away.id);
    });

    if (curStage === 'qf') {
      return { bracket: { ...curBracket, qf: played, sf: nextRoundPairs(played) }, stage: 'sf' };
    }
    if (curStage === 'sf') {
      const [loserA, loserB] = losersFromMatches(played);
      return {
        bracket: { ...curBracket, sf: played, final: nextRoundPairs(played)[0], bronze: { home: loserA, away: loserB, result: null } },
        stage: 'final',
      };
    }
    if (curStage === 'final') {
      const [finalPlayed, bronzePlayed] = played;
      return { bracket: { ...curBracket, final: finalPlayed, bronze: bronzePlayed }, stage: 'done' };
    }
    return { bracket: curBracket, stage: curStage };
  }

  /** matches(현재 라운드 원래 순서) + 이미 끝난 결과들로 대진표를 갱신하고 다음 라운드로 넘어간다. */
  function finalizeRound(matches, mineResult, othersPlayed) {
    const next = computeNextRound(bracket, stage, matches, mineResult, othersPlayed);
    setBracket(next.bracket);
    setStage(next.stage);
  }

  /** 내가 이미 탈락한 상태 - 남은 라운드(들)를 우승팀이 나올 때까지 자동으로 전부 시뮬레이션한다. */
  async function simulateRemainingRounds(matches, othersPlayed) {
    let curBracket = bracket;
    let curStage = stage;
    let curMatches = matches;
    let curPlayed = othersPlayed;

    while (true) {
      const next = computeNextRound(curBracket, curStage, curMatches, null, curPlayed);
      curBracket = next.bracket;
      curStage = next.stage;
      if (curStage === 'done') break;

      curMatches = curStage === 'qf' ? curBracket.qf
        : curStage === 'sf' ? (curBracket.sf ?? [])
        : [curBracket.final, curBracket.bronze].filter(Boolean);
      curPlayed = await Promise.all(curMatches.map(simulateOneMatch));
    }

    setBracket(curBracket);
    setStage(curStage);
  }

  /** "경기 시작" - 내 경기가 아닌 매치는 기존처럼 즉시 끝내고, 내 경기는 구간별 진행을 시작한다. */
  async function handleStartMatch() {
    if (!bracket || simulating || liveMatch) return;
    const matches = currentStageMatches();
    const mine = matches.find(m => m.home.id === myTeamId || m.away.id === myTeamId);
    const others = matches.filter(m => m !== mine);

    setSimulating(true);
    setError(null);
    try {
      const playedOthers = await Promise.all(others.map(simulateOneMatch));

      if (!mine) {
        // 내가 이번 라운드에 없음(이미 탈락) - 우승팀이 나올 때까지 남은 라운드를 전부 자동 진행
        await simulateRemainingRounds(matches, playedOthers);
        return;
      }

      setPendingOthers(playedOthers);
      const teamA = configFor(mine.home);
      const teamB = configFor(mine.away);
      const { sim, stats } = await simulatePhase(teamA, teamB, MATCH_PHASES[0]);
      const clampedStats = clampShotsToGoals(stats, sim.scoreA, sim.scoreB);
      setLiveMatch({
        match: mine,
        phases: MATCH_PHASES,
        phaseIndex: 0,
        scoreA: sim.scoreA,
        scoreB: sim.scoreB,
        events: sim.events,
        stats: clampedStats,
        finished: false,
        pso: null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  /** 브레이크 화면의 "계속 진행"/"연장전 시작" - 다음 구간만 그 시점 최신 전술로 새로 계산한다. */
  async function continueLiveMatch() {
    if (!liveMatch || simulating) return;
    setSimulating(true);
    setError(null);
    try {
      let { match, phases, phaseIndex, scoreA, scoreB, events, stats } = liveMatch;
      const atEndOfRegular = phaseIndex === MATCH_PHASES.length - 1 && phases.length === MATCH_PHASES.length;
      if (atEndOfRegular && scoreA === scoreB) {
        phases = [...MATCH_PHASES, ...EXTRA_TIME_PHASES];
      }
      const nextIndex = phaseIndex + 1;

      const teamA = configFor(match.home);
      const teamB = configFor(match.away);
      const { sim, stats: deltaStats } = await simulatePhase(teamA, teamB, phases[nextIndex]);
      const newScoreA = scoreA + sim.scoreA;
      const newScoreB = scoreB + sim.scoreB;
      const newEvents = [...events, ...sim.events];
      const newStats = clampShotsToGoals(mergeMatchStats(stats, deltaStats, phases[nextIndex].offset), newScoreA, newScoreB);

      const isLastPhase = nextIndex === phases.length - 1;
      const wentToExtraTime = phases.length > MATCH_PHASES.length;
      let finished = false;
      let pso = null;
      if (isLastPhase) {
        if (wentToExtraTime) {
          if (newScoreA === newScoreB) pso = simulatePenalties();
          finished = true;
        } else if (newScoreA !== newScoreB) {
          finished = true;
        }
      }

      setLiveMatch({
        match, phases, phaseIndex: nextIndex,
        scoreA: newScoreA, scoreB: newScoreB, events: newEvents, stats: newStats,
        finished, pso,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSimulating(false);
    }
  }

  /** 브레이크 화면의 "다음 경기로" - 내 경기 결과를 확정하고 대진표를 갱신한다. */
  function finishLiveMatch() {
    const { match, scoreA, scoreB, events, pso } = liveMatch;
    const winnerId = pso
      ? (pso.scoreA > pso.scoreB ? match.home.id : match.away.id)
      : (scoreA > scoreB ? match.home.id : match.away.id);
    const mineResult = { ...match, result: { scoreA, scoreB, events, pso, winnerId } };
    const matches = currentStageMatches();
    setLiveMatch(null);
    finalizeRound(matches, mineResult, pendingOthers);
    setPendingOthers([]);
  }

  /** 아직 열리지 않은(result 없는) 현재 라운드의 내 경기 상대 id — 탈락했거나 우승했으면 null. */
  function myUpcomingOpponentId() {
    const stageMatches = stage === 'qf' ? bracket.qf : stage === 'sf' ? (bracket.sf ?? []) : stage === 'final' ? [bracket.final] : [];
    const mine = stageMatches.find(m => m && !m.result && (m.home.id === myTeamId || m.away.id === myTeamId));
    if (!mine) return null;
    return mine.home.id === myTeamId ? mine.away.id : mine.home.id;
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
  const homeIsMine = liveMatch?.match.home.id === myTeamId;
  const homeGoals = liveMatch?.events.filter(e => e.team === 'teamA') ?? [];
  const awayGoals = liveMatch?.events.filter(e => e.team === 'teamB') ?? [];

  return (
    <section className="view-board">
      <div className="topbar">
        <div className="topbar-side left">
          <div className="brand" role="button" onClick={onHome}>PRIME<span>REWIND</span></div>
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
            <button className="cta" disabled={!upcomingOpponentId} onClick={() => onBack(upcomingOpponentId)}>
              전술 수정
            </button>
            <button className="cta" disabled={simulating || !!liveMatch} onClick={handleStartMatch}>
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

      {liveMatch && (
        <div className="modal-backdrop">
          <div className="modal-card glass livematch-card" onClick={(e) => e.stopPropagation()}>
            <div className="livematch-scoreboard">
              <div className={`livematch-scoreboard-team ${homeIsMine ? 'mine' : 'opp'}`}>{liveMatch.match.home.name}</div>
              <div className="livematch-scoreboard-score num">{liveMatch.scoreA} : {liveMatch.scoreB}</div>
              <div className={`livematch-scoreboard-team ${homeIsMine ? 'opp' : 'mine'}`}>{liveMatch.match.away.name}</div>
            </div>
            {liveMatch.events.length === 0 ? (
              <div className="timeline-panel modal-timeline"><div className="timeline-empty">득점 기록 없음</div></div>
            ) : (
              <div className="livematch-goals">
                <div className="livematch-goals-col home">
                  {homeGoals.map((e, i) => (
                    <div key={i} className={`timeline-chip ${homeIsMine ? 'mine' : 'opp'}`}>{e.minute}' ⚽ {e.scorer}</div>
                  ))}
                </div>
                <div className="livematch-goals-col away">
                  {awayGoals.map((e, i) => (
                    <div key={i} className={`timeline-chip ${homeIsMine ? 'opp' : 'mine'}`}>{e.minute}' ⚽ {e.scorer}</div>
                  ))}
                </div>
              </div>
            )}
            <div className="livematch-phase-label">{liveMatch.phases[liveMatch.phaseIndex].breakLabel}</div>
            {liveMatch.pso && (
              <div className="modal-pso">승부차기 {liveMatch.pso.scoreA} : {liveMatch.pso.scoreB}</div>
            )}

            <LiveMatchDashboard
              stats={liveMatch.stats}
              events={liveMatch.events}
              momentum={liveMatch.stats.momentum}
              colorA={liveMatch.match.home.id === myTeamId ? MY_COLOR : OPP_COLOR}
              colorB={liveMatch.match.away.id === myTeamId ? MY_COLOR : OPP_COLOR}
              teamAName={liveMatch.match.home.name}
              teamBName={liveMatch.match.away.name}
              mineIsA={homeIsMine}
            />

            <div className="livematch-actions">
              {!liveMatch.finished && (
                <button
                  className="cta"
                  onClick={() => onBack(liveMatch.match.home.id === myTeamId ? liveMatch.match.away.id : liveMatch.match.home.id)}
                >
                  전술 수정
                </button>
              )}
              <button
                className="cta"
                disabled={simulating}
                onClick={liveMatch.finished ? finishLiveMatch : continueLiveMatch}
              >
                {simulating ? '계산 중...' : continueLabel(liveMatch, stage, myTeamId)}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

