import { useEffect, useRef, useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { postWinProbability } from '../api/client';
import { slotOrderPlayerIds } from '../utils/autoAssign';
import Sidebar from './Sidebar';
import PitchBoard from './PitchBoard';
import PlayerCard from './PlayerCard';
import BenchList from './BenchList';

const DEBOUNCE_MS = 600;

function buildTeamConfig(teamId, formationId, goalkeeperId, playerIds, tacticConfig) {
  return {
    teamId,
    startingXI: { formationId, goalkeeperId, playerIds },
    tacticConfig,
    playerOverrides: [],
  };
}

export default function TacticalBoard({ onHome }) {
  const state = useGameState();
  const { loadMatch } = useGameActions();
  const [winProb, setWinProb] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    loadMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.loading || state.error) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const formation = state.formations.find(f => f.id === state.formationId);
      if (!formation) return;
      const goalkeeperId = Object.keys(state.players).find(id => state.players[id].data.positions.includes('GK'));
      const outfield = Object.fromEntries(
        Object.entries(state.players).filter(([id]) => id !== goalkeeperId)
      );
      const playerIds = slotOrderPlayerIds(outfield, formation);
      if (!goalkeeperId || !playerIds) return;

      setPredicting(true);
      setPredictError(null);
      try {
        const result = await postWinProbability({
          teamA: buildTeamConfig('kor', formation.id, goalkeeperId, playerIds, state.tacticConfig),
          teamB: buildTeamConfig(
            'rsa',
            state.oppTacticPreset.formationId,
            state.oppTacticPreset.goalkeeperId,
            state.oppTacticPreset.startingPlayerIds,
            state.oppTacticPreset.tacticConfig,
          ),
        });
        setWinProb(result.teamA);
      } catch (err) {
        setPredictError(err.message);
      } finally {
        setPredicting(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading, state.error, state.formationId, state.tacticConfig, JSON.stringify(
    Object.entries(state.players).map(([id, p]) => [id, Math.round(p.x), Math.round(p.y)])
  )]);

  if (state.loading) {
    return (
      <section className="view-board">
        <div className="board-loading">불러오는 중...</div>
      </section>
    );
  }
  if (state.error) {
    return (
      <section className="view-board">
        <div className="board-loading">데이터를 불러오지 못했습니다: {state.error}</div>
      </section>
    );
  }

  return (
    <section className="view-board">
      <div className="topbar">
        <div className="brand">PRIME<span>REWIND</span></div>
        <div className="score-card glass">
          <div className="tteam kor"><span className="tname">{state.team.name}</span></div>
          <div className="score-mid"><div className="clock num">{state.formationId}</div></div>
          <div className="tteam rsa"><span className="tname">{state.oppTeam.name}</span></div>
        </div>
        <div className="prob-card glass">
          <div className="prob-title">예측 승률{predicting ? ' · 계산 중' : ''}</div>
          {winProb ? (
            <div className="prob-bar">
              <div className="seg w" style={{ width: `${winProb.win * 100}%` }}>{Math.round(winProb.win * 100)}%</div>
              <div className="seg d" style={{ width: `${winProb.draw * 100}%` }}>{Math.round(winProb.draw * 100)}%</div>
              <div className="seg l" style={{ width: `${winProb.loss * 100}%` }}>{Math.round(winProb.loss * 100)}%</div>
            </div>
          ) : (
            <div className="prob-bar">{predictError ? `예측 실패: ${predictError}` : '계산 중...'}</div>
          )}
        </div>
        <div className="topbar-right">
          <button className="btn-ghost" onClick={onHome}>처음으로</button>
        </div>
      </div>

      <div className="board-body">
        <Sidebar />
        <PitchBoard />
        <aside className="rightbar glass">
          <PlayerCard />
          <BenchList />
        </aside>
      </div>
    </section>
  );
}
