import { useEffect, useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { postWinProbability } from '../api/client';
import { buildMyTeamConfig, buildTeamConfig } from '../utils/matchPayload';
import Sidebar from './Sidebar';
import PitchBoard from './PitchBoard';
import PlayerCard from './PlayerCard';
import BenchList from './BenchList';
import TacticsPanel from './TacticsPanel';

const TABS = [
  ['formation', '포메이션'],
  ['tactics', '전술'],
];

export default function TacticalBoard({ myTeamId, oppTeamId, onHome, onChangeTeams, onStartTournament }) {
  const state = useGameState();
  const { loadMatch } = useGameActions();
  const [tab, setTab] = useState('formation');
  const [winProb, setWinProb] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);

  useEffect(() => {
    // 토너먼트 페이지에 다녀와도 이미 로드된 같은 매치업이면 다시 불러오지 않는다 —
    // 그렇지 않으면 내가 짜둔 라인업/전술이 기본 프리셋으로 초기화된다.
    if (state.team?.id === myTeamId && state.oppTeam?.id === oppTeamId) return;
    loadMatch(myTeamId, oppTeamId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function calculateWinProbability() {
    const myConfig = buildMyTeamConfig(state);
    if (!myConfig) return;

    setPredicting(true);
    setPredictError(null);
    try {
      const result = await postWinProbability({
        teamA: myConfig,
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
          <div className="sim-card glass">
            <button className="btn-ghost" onClick={onStartTournament}>
              경기 시뮬레이션
            </button>
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
