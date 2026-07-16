import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { PitchScene } from '../three/PitchScene';
import { useGameState, useGameActions } from '../state/GameContext';
import { buildChanceSequence } from '../engine/playSequence';
import { OPP_LINEUP } from '../data/squad';

const CAM_LABELS = [
  ['broadcast', '중계 캠'],
  ['manager', '감독 시점'],
  ['top', '탑뷰'],
];
const SPEEDS = [[0.5, '1x'], [1.5, '2x'], [4, '4x']];
const BANNER_MS = 3000;
const LOG_VISIBLE = 4; // 라이브 로그에 보이는 최근 이벤트 수

const PitchBoard = forwardRef(function PitchBoard(
  { feed = [], speed = 0, onSetSpeed = () => {}, controlsDisabled = false }, ref
) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const pitchRef = useRef(null);
  const prevPlayersRef = useRef({});
  const bannerTimer = useRef(null);
  const state = useGameState();
  const stateRef = useRef(state); stateRef.current = state;
  const { selectPlayer, movePlayer } = useGameActions();
  const [activeCam, setActiveCam] = useState('broadcast');
  const [banner, setBanner] = useState(null);

  function showBanner(text, cls) {
    clearTimeout(bannerTimer.current);
    setBanner({ text, cls });
    bannerTimer.current = setTimeout(() => setBanner(null), BANNER_MS);
  }

  useEffect(() => {
    const pitch = new PitchScene(canvasRef.current, {
      onSelectPlayer: (id) => selectPlayer(id),
      onDragPlayer: (id, x, y) => {
        pitch.syncPlayerWorldPos(id, x, y);
        movePlayer(id, x, y);
      },
    });
    pitchRef.current = pitch;
    pitch.spawnOpp(OPP_LINEUP);
    pitch.resize();
    pitch.setCamPreset('broadcast');

    const ro = new ResizeObserver(() => pitch.resize());
    ro.observe(wrapRef.current);
    return () => {
      clearTimeout(bannerTimer.current);
      ro.disconnect();
      pitch.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pitch = pitchRef.current;
    if (!pitch || state.playing) return;
    const prev = prevPlayersRef.current;
    const curr = state.players;
    for (const id in prev) if (!curr[id]) pitch.removePlayer(id);
    for (const id in curr) {
      const p = curr[id];
      const before = prev[id];
      if (!before) pitch.spawnPlayer(id, p);
      else if (before.prime !== p.prime) pitch.rebuildPlayer(id, p);
      else if (before.x !== p.x || before.y !== p.y) pitch.movePlayerTarget(id, p.x, p.y);
    }
    prevPlayersRef.current = curr;
  }, [state.players, state.playing]);

  useEffect(() => {
    if (!state.playing) pitchRef.current?.setSelected(state.selected);
  }, [state.selected, state.playing]);

  function handleCamClick(name) {
    setActiveCam(name);
    pitchRef.current?.setCamPreset(name);
  }

  useImperativeHandle(ref, () => ({
    setEditable(v) { pitchRef.current && (pitchRef.current.editable = v); },
    setLiveAmbient(v) { pitchRef.current && (pitchRef.current.liveAmbient = v); },
    swapOpp(idx, name, no) { pitchRef.current?.swapOppPlayer(idx, name, no); },
    resetKickoff() {
      const pitch = pitchRef.current;
      if (!pitch) return;
      pitch.stopSequence();
      pitch.clearFlash();
      pitch.clearPlayers();
      pitch.spawnOpp(OPP_LINEUP);
      pitch.resetBallCenter();
      prevPlayersRef.current = {};
      setBanner(null);
    },
    playChance(chance, goal, onDone) {
      const pitch = pitchRef.current;
      const g = stateRef.current;
      if (!pitch) { onDone(); return; }
      const oppPositions = OPP_LINEUP.map(o => ({ ...o }));
      const seq = buildChanceSequence(chance.side, g.players, oppPositions, chance.zones, goal);
      pitch.flashZones(chance.zones, chance.side === 'kor' ? 0x34e07a : 0xef5350);
      pitch.playSequence(seq, Object.keys(g.players), {
        followBall: true,
        onComplete: () => {
          pitch.clearFlash();
          const isGood = chance.side === 'kor' ? goal : !goal;
          showBanner(
            goal
              ? (chance.side === 'kor' ? '⚽ 골!' : '⚽ 실점')
              : (chance.side === 'kor' ? '😬 기회 무산' : '🧤 막아냈다!'),
            isGood ? 'good' : 'bad'
          );
          pitch.returnToAnchors(g.players, OPP_LINEUP);
          pitch.resetBallCenter();
          onDone();
        },
      });
    },
  }), []);

  const recentFeed = feed.slice(-LOG_VISIBLE);

  return (
    <div className="gl-wrap" id="glWrap" ref={wrapRef}>
      <canvas className="gl-canvas" ref={canvasRef} />

      {/* 카메라 프리셋 — 좌상단 */}
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

      {/* 조작 힌트 — 우상단 */}
      {!banner && (
        <div className="gl-hint glass">
          {state.editable ? '선수 드래그 배치 · 빈 곳 드래그 회전 · 휠 줌' : '경기 중 — ⏸ 후 전술 조정'}
        </div>
      )}

      {/* 라이브 매치 로그 — 하단 중앙 글래스 */}
      <div className="live-log glass">
        {recentFeed.length === 0 && <div className="log-empty">킥오프 대기 중 — ▶ 로 경기 시작</div>}
        {recentFeed.map((e, i) => (
          <div className={`log-item ${e.type || ''}`} key={feed.length - recentFeed.length + i}>
            <span className="lmin num">{e.min}'</span>
            <span className="ltext">{e.text}</span>
          </div>
        ))}
      </div>

      {/* 배속 컨트롤러 — 우하단 */}
      <div className="speed-hud glass">
        <button
          className={`spd-btn ${speed === 0 ? 'on' : ''}`}
          disabled={controlsDisabled}
          onClick={() => onSetSpeed(0)}
        >⏸</button>
        {SPEEDS.map(([v, label]) => (
          <button
            key={label}
            className={`spd-btn ${speed === v ? 'on' : ''}`}
            disabled={controlsDisabled}
            onClick={() => onSetSpeed(v)}
          >▶{label}</button>
        ))}
      </div>

      {/* 줌 — 좌하단 */}
      <div className="zoom-hud">
        <button className="zoom-btn glass" onClick={() => pitchRef.current?.zoom(-12)}>＋</button>
        <button className="zoom-btn glass" onClick={() => pitchRef.current?.zoom(12)}>－</button>
      </div>

      {banner && <div className={`outcome-banner ${banner.cls}`}>{banner.text}</div>}
    </div>
  );
});

export default PitchBoard;
