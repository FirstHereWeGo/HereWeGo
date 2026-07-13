import { useEffect, useRef, useState } from 'react';
import { PitchScene } from '../three/PitchScene';
import { useGameState, useGameActions } from '../state/GameContext';

const CAM_LABELS = [
  ['broadcast', '중계 캠'],
  ['manager', '감독 시점'],
  ['top', '탑뷰'],
];

export default function PitchBoard() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pitchRef = useRef(null);
  const prevPlayersRef = useRef({});
  const state = useGameState();
  const { selectPlayer, movePlayer, recalc } = useGameActions();
  const [activeCam, setActiveCam] = useState('broadcast');

  // ---- 마운트: PitchScene 생성 ----
  useEffect(() => {
    const pitch = new PitchScene(canvasRef.current, {
      onSelectPlayer: (id) => selectPlayer(id),
      onDragPlayer: (id, x, y) => {
        pitch.syncPlayerWorldPos(id, x, y); // 즉시 시각적 반영 (지연 없음)
        movePlayer(id, x, y);
        recalc();
      },
    });
    pitchRef.current = pitch;
    pitch.resize();

    const ro = new ResizeObserver(() => pitch.resize());
    ro.observe(wrapRef.current);

    return () => {
      ro.disconnect();
      pitch.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 장면 시작: 상대팀/존/공 리셋 + 카메라 프리셋 ----
  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch || !state.scene) return;
    pitch.clearPlayers();
    prevPlayersRef.current = {};
    pitch.resetOppAndZones(state.scene);
    const tz = state.scene === 'conceded' ? 18 : -18;
    pitch.setCamPreset('broadcast', tz);
    setActiveCam('broadcast');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.scene]);

  // ---- 선수 로스터/포지션/전성기 동기화 ----
  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch || !state.scene) return;
    const prev = prevPlayersRef.current;
    const curr = state.players;

    for (const id in prev) {
      if (!curr[id]) pitch.removePlayer(id);
    }
    for (const id in curr) {
      const p = curr[id];
      const before = prev[id];
      if (!before) {
        pitch.spawnPlayer(id, p);
      } else if (before.prime !== p.prime) {
        pitch.rebuildPlayer(id, p);
      } else if (before.x !== p.x || before.y !== p.y) {
        pitch.movePlayerTarget(id, p.x, p.y);
      }
    }
    prevPlayersRef.current = curr;
  }, [state.players, state.scene]);

  // ---- 선택 하이라이트 동기화 ----
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
      <div className="cam-hud">
        {CAM_LABELS.map(([key, label]) => (
          <button
            key={key}
            className={`cam-btn ${activeCam === key ? 'on' : ''}`}
            onClick={() => handleCamClick(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="zoom-hud">
        <button className="zoom-btn" onClick={() => pitchRef.current?.zoom(-12)}>＋</button>
        <button className="zoom-btn" onClick={() => pitchRef.current?.zoom(12)}>－</button>
      </div>
      <div className="gl-hint">드래그: 카메라 회전 · 선수 잡고 이동 · 휠/버튼: 줌</div>
    </div>
  );
}
