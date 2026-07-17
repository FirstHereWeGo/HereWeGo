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
  const { selectPlayer, movePlayer } = useGameActions();
  const [activeCam, setActiveCam] = useState('broadcast');

  useEffect(() => {
    const pitch = new PitchScene(canvasRef.current, {
      onSelectPlayer: (id) => selectPlayer(id),
      onDragPlayer: (id, x, y) => {
        pitch.syncPlayerWorldPos(id, x, y);
        movePlayer(id, x, y);
      },
    });
    pitchRef.current = pitch;
    pitch.resize();
    pitch.setCamPreset('broadcast');
    pitch.editable = true;

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
        선수 드래그 배치 · 빈 곳 드래그 회전 · 휠 줌
      </div>

      <div className="zoom-hud">
        <button className="zoom-btn glass" onClick={() => pitchRef.current?.zoom(-12)}>＋</button>
        <button className="zoom-btn glass" onClick={() => pitchRef.current?.zoom(12)}>－</button>
      </div>
    </div>
  );
}
