import { useEffect, useState } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { postWinProbability, postAiSuggestion } from '../api/client';
import { buildMyTeamConfig, buildTeamConfig } from '../utils/matchPayload';
import Sidebar from './Sidebar';
import PitchBoard from './PitchBoard';
import PlayerCard from './PlayerCard';
import BenchList from './BenchList';
import TeamAnalyticsBoard from './TeamAnalyticsBoard';

export default function TacticalBoard({ myTeamId, oppTeamId, onHome, onChangeTeams, onTournament }) {
  const state = useGameState();
  const { loadMatch } = useGameActions();
  const [winProb, setWinProb] = useState(null);
  const [prevWinProb, setPrevWinProb] = useState(null);
  // 분석 화면의 "전술 정체성" 배지가 상대 팀 쪽 styleLabel/styleFit도 필요로 해서 같이 들고 있는다.
  const [oppWinProb, setOppWinProb] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  // 전술 옵션 호버 프리뷰 전용 상태 — GameContext의 실제 tacticConfig는 건드리지 않는 순수 UI 상태다.
  const [tacticPreviewKey, setTacticPreviewKey] = useState(null);

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
      setPrevWinProb(winProb);
      setWinProb(result.teamA);
      setOppWinProb(result.teamB);
    } catch (err) {
      setPredictError(err.message);
    } finally {
      setPredicting(false);
    }
  }

  async function requestAiSuggestion() {
    const myConfig = buildMyTeamConfig(state);
    if (!myConfig || !winProb) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const result = await postAiSuggestion({
        teamA: myConfig,
        teamB: buildTeamConfig(
          state.oppTeam.id,
          state.oppTacticPreset.formationId,
          state.oppTacticPreset.goalkeeperId,
          state.oppTacticPreset.startingPlayerIds,
          state.oppTacticPreset.tacticConfig,
        ),
        winProb,
      });
      setAiSuggestion(result.suggestion);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
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

        <div className="score-card">
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
          {showAnalytics ? (
            <button className="btn-ghost" onClick={() => setShowAnalytics(false)}>← 포메이션으로</button>
          ) : (
            <button className="btn-ghost" onClick={() => setShowAnalytics(true)}>분석</button>
          )}
          <button className="btn-ghost" onClick={onTournament}>토너먼트로</button>
          <button className="btn-ghost" onClick={onChangeTeams}>팀 변경</button>
        </div>
      </div>

      {showAnalytics ? (
        <TeamAnalyticsBoard
          team={state.team}
          oppTeam={state.oppTeam}
          oppTacticPreset={state.oppTacticPreset}
          players={state.players}
          formations={state.formations}
          formationId={state.formationId}
          winProb={winProb}
          oppWinProb={oppWinProb}
          prevWinProb={prevWinProb}
          predicting={predicting}
          predictError={predictError}
          onCalculateWinProbability={calculateWinProbability}
        />
      ) : (
        <div className="board-body">
          <Sidebar
            onPreviewEnter={setTacticPreviewKey}
            onPreviewLeave={() => setTacticPreviewKey(null)}
          />
          <PitchBoard
            winProb={winProb}
            prevWinProb={prevWinProb}
            predicting={predicting}
            predictError={predictError}
            onCalculateWinProbability={calculateWinProbability}
            tacticPreviewKey={tacticPreviewKey}
            aiSuggestion={aiSuggestion}
            aiLoading={aiLoading}
            aiError={aiError}
            onRequestAiSuggestion={requestAiSuggestion}
          />
          <aside className="rightbar glass">
            <PlayerCard />
            <BenchList />
          </aside>
        </div>
      )}
    </section>
  );
}
