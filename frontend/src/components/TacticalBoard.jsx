import { useEffect, useRef, useReducer, useCallback, useSyncExternalStore } from 'react';
import { useGameState, useGameActions } from '../state/GameContext';
import { OPP_LINEUP, OPP_SUBS, ANCHOR_ZONES } from '../data/squad';
import {
  MATCH_END, HALF_TIME, computeRates, rollChanceAt, sampleChanceXG,
  anchorAt, anchorXG, liveWDL, randomChanceZones, chanceLabel,
} from '../engine/matchEngine';
import { rollOutcome } from '../engine/outcome';
import { subscribeBridge, getBridgeState, drainServerFeed } from '../state/liveBridge';
import Sidebar from './Sidebar';
import PitchBoard from './PitchBoard';
import PlayerCard from './PlayerCard';
import BenchList from './BenchList';

const initMatch = {
  phase: 'pre',
  minute: 0,
  speed: 0,
  score: { kor: 0, rsa: 0 },
  xgSum: { kor: 0, rsa: 0 },
  feed: [],
  anchorsDone: { maseko63: false, header90: false },
  oppSubIdx: 0,
  halftimeShown: false,
  pendingChance: null,
};

function matchReducer(m, a) {
  switch (a.type) {
    case 'RESET': return { ...initMatch };
    case 'SET_SPEED': return { ...m, speed: a.speed, phase: m.phase === 'pre' && a.speed > 0 ? 'live' : m.phase };
    case 'TICK': return { ...m, minute: a.minute };
    case 'FEED': return { ...m, feed: [...m.feed, { min: a.min ?? Math.floor(m.minute), text: a.text, type: a.eventType }] };
    case 'CHANCE_START':
      return { ...m, phase: 'chance', pendingChance: a.chance, anchorsDone: a.anchor ? { ...m.anchorsDone, [a.anchor]: true } : m.anchorsDone };
    case 'CHANCE_RESOLVE': {
      const side = m.pendingChance.side;
      const score = { ...m.score };
      if (a.goal) score[side] += 1;
      const xgSum = { ...m.xgSum, [side]: m.xgSum[side] + m.pendingChance.xg };
      return { ...m, phase: 'live', score, xgSum, pendingChance: null };
    }
    case 'MINOR_CHANCE': {
      const xgSum = { ...m.xgSum, [a.side]: m.xgSum[a.side] + a.xg };
      return { ...m, xgSum };
    }
    case 'HALFTIME': return { ...m, halftimeShown: true, speed: 0 };
    case 'OPP_SUB': return { ...m, oppSubIdx: m.oppSubIdx + 1 };
    case 'FULLTIME': return { ...m, phase: 'ft', speed: 0, minute: MATCH_END };
    default: return m;
  }
}

export default function TacticalBoard({ onFinish }) {
  const g = useGameState();
  const { setEditable, startPlayback, endPlayback, resetMatch } = useGameActions();
  const [m, dm] = useReducer(matchReducer, initMatch);
  const pitchRef = useRef(null);
  const mRef = useRef(m); mRef.current = m;
  const gRef = useRef(g); gRef.current = g;
  const lastWholeMin = useRef(-1);

  // 백엔드 브리지 구독 — 서버가 승률을 보내면 그것을 우선 사용
  const bridge = useSyncExternalStore(subscribeBridge, getBridgeState, getBridgeState);
  useEffect(() => {
    const items = drainServerFeed();
    items.forEach(f => dm({ type: 'FEED', min: f.min, text: f.text, eventType: f.type || 'info' }));
  }, [bridge]);

  const rates = computeRates(g.players, g.inst, g.mentality);
  const ratesRef = useRef(rates); ratesRef.current = rates;
  const wdl = bridge.serverWdl
    ? bridge.serverWdl
    : m.phase === 'ft'
      ? (m.score.kor > m.score.rsa ? { w: 1, d: 0, l: 0 } : m.score.kor === m.score.rsa ? { w: 0, d: 1, l: 0 } : { w: 0, d: 0, l: 1 })
      : liveWDL(m.score, m.minute, rates);

  const editable = m.phase === 'pre' || (m.phase === 'live' && m.speed === 0);
  useEffect(() => { setEditable(editable); }, [editable, setEditable]);
  useEffect(() => { pitchRef.current?.setEditable(editable); }, [editable]);
  useEffect(() => { pitchRef.current?.setLiveAmbient(m.phase === 'live' && m.speed > 0); }, [m.phase, m.speed]);

  const fireChance = useCallback((chance, anchorKey) => {
    dm({ type: 'CHANCE_START', chance, anchor: anchorKey });
    dm({ type: 'FEED', text: `${chance.label} (xG ${chance.xg.toFixed(2)})`, eventType: chance.side });
    startPlayback();
    const goal = rollOutcome(chance.xg);
    pitchRef.current?.playChance(chance, goal, () => {
      dm({ type: 'CHANCE_RESOLVE', goal });
      if (goal) {
        dm({ type: 'FEED', text: chance.side === 'kor' ? '⚽ 대한민국 득점!' : '⚽ 남아공 득점', eventType: chance.side === 'kor' ? 'goal-kor' : 'goal-rsa' });
      } else {
        dm({ type: 'FEED', text: chance.side === 'kor' ? '기회 무산' : '위기 해소', eventType: 'miss' });
      }
      endPlayback();
    });
  }, [startPlayback, endPlayback]);

  useEffect(() => {
    let raf, prev = performance.now();
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const mm = mRef.current;
      if (mm.phase !== 'live' || mm.speed <= 0) return;

      const nextMin = mm.minute + dt * mm.speed;
      dm({ type: 'TICK', minute: nextMin });

      const whole = Math.floor(nextMin);
      if (whole === lastWholeMin.current) {
        if (nextMin >= MATCH_END) dm({ type: 'FULLTIME' });
        return;
      }
      lastWholeMin.current = whole;
      const gg = gRef.current;
      const rr = ratesRef.current;

      if (whole >= HALF_TIME && !mm.halftimeShown) {
        dm({ type: 'HALFTIME' });
        dm({ type: 'FEED', text: '하프타임 — 전술 조정이 가능합니다 (▶ 로 재개)', eventType: 'info' });
        return;
      }
      if (mm.oppSubIdx < OPP_SUBS.length && whole >= OPP_SUBS[mm.oppSubIdx].minute) {
        const sub = OPP_SUBS[mm.oppSubIdx];
        const idx = OPP_LINEUP.findIndex(o => o.name === sub.outName);
        pitchRef.current?.swapOpp(idx, sub.inName, sub.inNo);
        dm({ type: 'OPP_SUB' });
        dm({ type: 'FEED', text: `남아공 교체: ${sub.inName} IN (${sub.outName} OUT)`, eventType: 'info' });
      }
      const anchor = anchorAt(whole, mm.anchorsDone);
      if (anchor) {
        const xg = anchorXG(anchor, gg.players, gg.inst, gg.mentality);
        const side = anchor === 'maseko63' ? 'rsa' : 'kor';
        fireChance({
          side, xg,
          zones: { cross: ANCHOR_ZONES[anchor].cross, target: ANCHOR_ZONES[anchor].target },
          label: ANCHOR_ZONES[anchor].label,
          anchorEvent: true,
        }, anchor);
        return;
      }
      const side = rollChanceAt(rr);
      if (side) {
        const xg = sampleChanceXG(side, rr);
        const big = xg >= 0.15;
        const animate = big || mm.speed <= 0.6;
        if (animate) {
          fireChance({
            side, xg,
            zones: randomChanceZones(side),
            label: `${side === 'kor' ? '대한민국' : '남아공'} ${chanceLabel(side)}`,
          }, null);
        } else {
          const goal = rollOutcome(xg);
          if (goal) {
            fireChance({
              side, xg,
              zones: randomChanceZones(side),
              label: `${side === 'kor' ? '대한민국' : '남아공'} ${chanceLabel(side)}`,
            }, null);
          } else {
            dm({ type: 'MINOR_CHANCE', side, xg });
            dm({ type: 'FEED', text: `${side === 'kor' ? '대한민국' : '남아공'} ${chanceLabel(side)} — 무산 (xG ${xg.toFixed(2)})`, eventType: 'minor' });
          }
        }
      }
      if (nextMin >= MATCH_END) dm({ type: 'FULLTIME' });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fireChance]);

  useEffect(() => {
    if (m.phase !== 'ft') return;
    dm({ type: 'FEED', text: `경기 종료 — 대한민국 ${m.score.kor} : ${m.score.rsa} 남아공`, eventType: 'info' });
    const timer = setTimeout(() => {
      onFinish({ score: m.score, xgSum: m.xgSum, feed: m.feed });
    }, 2600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.phase]);

  const clockText = (() => {
    const min = Math.min(Math.floor(m.minute), 90);
    const extra = m.minute > 90 ? `+${Math.floor(m.minute - 90)}` : '';
    return `${String(min).padStart(2, '0')}'${extra}`;
  })();

  const busy = g.playing;
  const phaseText =
    m.phase === 'pre' ? '킥오프 대기 — 선발 라인업과 전술을 확인하세요'
    : m.phase === 'ft' ? '경기 종료'
    : m.speed === 0 ? '작전 타임 — 배치/교체/전술 조정 가능'
    : '경기 진행 중';

  return (
    <section className="view-board">
      {/* ===== 상단 바: 스코어보드 카드 + 실시간 승률 ===== */}
      <div className="topbar">
        <div className="brand">PRIME<span>REWIND</span></div>
        <div className="score-card glass">
          <div className="tteam kor"><span className="tname">대한민국</span><span className="tsub">KOR</span></div>
          <div className="score-mid">
            <div className="score num">{m.score.kor} : {m.score.rsa}</div>
            <div className="clock num">{clockText}</div>
          </div>
          <div className="tteam rsa"><span className="tname">남아공</span><span className="tsub">RSA</span></div>
        </div>
        <div className="prob-card glass">
          <div className="prob-title">실시간 승률{bridge.serverWdl ? ' · LIVE(서버)' : ''}</div>
          <div className="prob-bar">
            <div className="seg w" style={{ width: `${wdl.w * 100}%` }}>{Math.round(wdl.w * 100)}%</div>
            <div className="seg d" style={{ width: `${wdl.d * 100}%` }}>{Math.round(wdl.d * 100)}%</div>
            <div className="seg l" style={{ width: `${wdl.l * 100}%` }}>{Math.round(wdl.l * 100)}%</div>
          </div>
          <div className="xg-mini num">xG {m.xgSum.kor.toFixed(2)} : {m.xgSum.rsa.toFixed(2)}</div>
        </div>
        <div className="topbar-right">
          <div className="phase-text">{phaseText}</div>
          <button
            className="btn-ghost"
            disabled={busy}
            onClick={() => { resetMatch(); dm({ type: 'RESET' }); lastWholeMin.current = -1; pitchRef.current?.resetKickoff(); }}
          >↺ 재시작</button>
        </div>
      </div>

      <div className="board-body">
        <Sidebar />
        <PitchBoard
          ref={pitchRef}
          feed={m.feed}
          speed={m.speed}
          onSetSpeed={(v) => dm({ type: 'SET_SPEED', speed: v })}
          controlsDisabled={busy || m.phase === 'ft'}
        />
        <aside className="rightbar glass">
          <PlayerCard />
          <BenchList />
        </aside>
      </div>
    </section>
  );
}
