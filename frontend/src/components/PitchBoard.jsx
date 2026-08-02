import { useEffect, useRef, useState } from 'react';
import { PitchScene } from '../three/PitchScene';
import { useGameState, useGameActions } from '../state/GameContext';
import { layoutFormation, GK_COORD } from '../data/formationLayout';
import { jerseyNumber } from '../utils/playerDisplay';
import WinProbabilityPanel from './WinProbabilityPanel';
import TacticPreviewPitch from './TacticPreviewPitch';
import CoachButton from './CoachButton';

const CAM_LABELS = [
  ['broadcast', '중계 캠'],
  ['manager', '감독 시점'],
  ['top', '탑뷰'],
];

/** 상대팀 기본 선발을 우리 팀과 마주보도록(y 반전) 배치한다. */
function buildOppLineup(oppTeam, oppTacticPreset, formations) {
  const formation = formations.find(f => f.id === oppTacticPreset.formationId);
  if (!formation) return [];
  const playersById = Object.fromEntries(oppTeam.players.map(p => [p.id, p]));
  const coords = layoutFormation(formation);
  const lineup = [];

  const gk = playersById[oppTacticPreset.goalkeeperId];
  if (gk) lineup.push({ id: gk.id, x: GK_COORD.x, y: 100 - GK_COORD.y, gk: true, no: jerseyNumber(gk.id) });

  oppTacticPreset.startingPlayerIds.forEach((id, i) => {
    const p = playersById[id];
    if (!p) return;
    lineup.push({ id: p.id, x: coords[i].x, y: 100 - coords[i].y, gk: false, no: jerseyNumber(p.id) });
  });
  return lineup;
}

export default function PitchBoard({
  winProb, prevWinProb, predicting, predictError, onCalculateWinProbability, tacticPreviewKey,
  aiSuggestion, aiLoading, aiError, onRequestAiSuggestion,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pitchRef = useRef(null);
  const prevPlayersRef = useRef({});
  const state = useGameState();
  const stateRef = useRef(state);
  stateRef.current = state;
  const { selectPlayer, viewPlayer, deselectPlayer, swapPlayers } = useGameActions();
  const [activeCam, setActiveCam] = useState('broadcast');

  function handlePlayerClick(id, isOpp) {
    if (isOpp) { viewPlayer(id); return; }
    const { selected } = stateRef.current;
    if (selected === id) { deselectPlayer(); return; }
    if (selected) { swapPlayers(selected, id); return; }
    selectPlayer(id);
  }

  useEffect(() => {
    const pitch = new PitchScene(canvasRef.current, {
      myTeamId: state.team.id,
      oppTeamId: state.oppTeam.id,
      myManagerName: state.team.manager,
      oppManagerName: state.oppTeam.manager,
      onSelectPlayer: (id, isOpp) => handlePlayerClick(id, isOpp),
    });
    pitchRef.current = pitch;
    pitch.resize();
    pitch.setCamPreset('broadcast');
    pitch.spawnOpp(buildOppLineup(state.oppTeam, state.oppTacticPreset, state.formations));

    const ro = new ResizeObserver(() => pitch.resize());
    ro.observe(wrapRef.current);
    return () => {
      ro.disconnect();
      pitch.dispose();
      // StrictMode 등으로 PitchScene이 재생성될 때 다음 렌더에서 전원 재스폰되도록 초기화
      prevPlayersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch) return;
    const prev = prevPlayersRef.current;
    const curr = state.players;
    for (const id in prev) if (!curr[id]) pitch.removePlayer(id);
    for (const id in curr) {
      const p = curr[id];
      const before = prev[id];
      if (!before) pitch.spawnPlayer(id, p);
      else if (before.x !== p.x || before.y !== p.y) pitch.movePlayerTarget(id, p.x, p.y);
    }
    prevPlayersRef.current = curr;
  }, [state.players]);

  useEffect(() => {
    pitchRef.current?.setSelected(state.selected);
  }, [state.selected]);

  function handleCamClick(name) {
    setActiveCam(name);
    pitchRef.current?.setCamPreset(name);
  }

  return (
    <div className="gl-wrap" id="glWrap" ref={wrapRef}>
      <canvas className="gl-canvas" ref={canvasRef} />

      <div className="prob-hud">
        <WinProbabilityPanel
          myTeamName={state.team.name}
          oppTeamName={state.oppTeam.name}
          winProb={winProb}
          prevWinProb={prevWinProb}
          predicting={predicting}
          predictError={predictError}
          onCalculate={onCalculateWinProbability}
        />
      </div>

      <div className="cam-hud">
        {CAM_LABELS.map(([key, label]) => (
          <button
            key={key}
            className={`cam-btn glass ${activeCam === key ? 'on' : ''}`}
            onClick={() => handleCamClick(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="gl-hint glass">
        선수 클릭 후 다른 선수 클릭 시 위치 교체 · 빈 곳 드래그 회전 · 휠 줌
      </div>

      {tacticPreviewKey && (
        <div className="tpp-flyout">
          <TacticPreviewPitch
            activeKey={tacticPreviewKey}
            formation={state.formations.find(f => f.id === state.formationId)}
            oppFormation={state.formations.find(f => f.id === state.oppTacticPreset.formationId)}
          />
        </div>
      )}

      <CoachButton
        suggestion={aiSuggestion}
        loading={aiLoading}
        error={aiError}
        disabled={!winProb}
        onRequest={onRequestAiSuggestion}
      />
    </div>
  );
}
