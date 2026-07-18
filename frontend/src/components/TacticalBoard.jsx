import { useEffect, useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { postWinProbability } from '../api/client';
import { slotOrderPlayerIds } from '../utils/autoAssign';
import Sidebar from './Sidebar';
import PitchBoard from './PitchBoard';
import PlayerCard from './PlayerCard';
import BenchList from './BenchList';
import TacticsPanel from './TacticsPanel';

const TABS = [
  ['formation', '포메이션'],
  ['tactics', '전술'],
];

function buildTeamConfig(teamId, formationId, goalkeeperId, playerIds, tacticConfig) {
  return {
    teamId,
    startingXI: { formationId, goalkeeperId, playerIds },
    tacticConfig,
    playerOverrides: [],
  };
}

export default function TacticalBoard({ myTeamId, oppTeamId, onHome, onChangeTeams }) {
  const state = useGameState();
  const { loadMatch } = useGameActions();
  const [tab, setTab] = useState('formation');
  const [winProb, setWinProb] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);

  useEffect(() => {
    loadMatch(myTeamId, oppTeamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function calculateWinProbability() {
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
        teamA: buildTeamConfig(state.team.id, formation.id, goalkeeperId, playerIds, state.tacticConfig),
        teamB: buildTeamConfig(
          state.oppTeam.id,
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
  }

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
        <div className="topbar-side left">
          <div className="brand" role="button" onClick={onHome}>PRIME<span>REWIND</span></div>
        </div>

        <div className="score-card glass">
          <div className="tteam home">
            <img className="tflag" src={`/flags/${state.team.id}.png`} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="tname">{state.team.name}</span>
          </div>
          <div className="score-mid"><div className="score num">0 : 0</div></div>
          <div className="tteam away">
            <img className="tflag" src={`/flags/${state.oppTeam.id}.png`} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="tname">{state.oppTeam.name}</span>
          </div>
        </div>

        <div className="topbar-side right">
          <div className="prob-card glass">
            <div className="prob-title">예측 승률</div>
            <div className="prob-row">
              {winProb ? (
                <div className="prob-bar">
                  <div className="seg w" style={{ width: `${winProb.win * 100}%` }}>{Math.round(winProb.win * 100)}%</div>
                  <div className="seg d" style={{ width: `${winProb.draw * 100}%` }}>{Math.round(winProb.draw * 100)}%</div>
                  <div className="seg l" style={{ width: `${winProb.loss * 100}%` }}>{Math.round(winProb.loss * 100)}%</div>
                </div>
              ) : (
                <div className="prob-bar">{predictError ? `예측 실패: ${predictError}` : '아직 계산 전'}</div>
              )}
              <button className="btn-ghost" disabled={predicting} onClick={calculateWinProbability}>
                {predicting ? '계산 중...' : '승률 계산'}
              </button>
            </div>
          </div>
          <div className="view-tabs">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                className={`tab-btn ${tab === key ? 'on' : ''}`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={onChangeTeams}>팀 변경</button>
        </div>
      </div>

      {tab === 'formation' ? (
        <div className="board-body">
          <Sidebar />
          <PitchBoard />
          <aside className="rightbar glass">
            <PlayerCard />
            <BenchList />
          </aside>
        </div>
      ) : (
        <TacticsPanel />
      )}
    </section>
  );
}
