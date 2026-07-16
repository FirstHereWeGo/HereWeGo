/**
 * 임의 찬스(공격 측/존)에 대한 11v11 절차적 재생 시퀀스 생성.
 * - 크로서/피니셔는 공격 측에서 존과의 근접도로 동적으로 선정 → 이벤트 지점으로 정확히 이동
 * - 나머지 20명은 거리 가중으로 플레이 방향에 반응
 */
function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function lerp(a, b, f) { return a + (b - a) * f; }
function lerpPt(p, target, w) { return { x: lerp(p.x, target.x, w), y: lerp(p.y, target.y, w) }; }
function proximityWeight(p, focal, maxDist, minW, maxW) {
  const d = dist(p.x, p.y, focal.x, focal.y);
  const t = Math.max(0, Math.min(1, 1 - d / maxDist));
  return minW + (maxW - minW) * t;
}

/**
 * @param side 'kor' | 'rsa' 공격 측
 * @param korPlayers { id: {data,x,y,prime} }
 * @param oppPositions [{x,y,gk,name,no}] (현재 남아공 배치)
 * @param zones { cross:{x,y}, target:{x,y} }
 * @param outcome true=골
 */
export function buildChanceSequence(side, korPlayers, oppPositions, zones, outcome) {
  const korIds = Object.keys(korPlayers);
  const gkKorId = korIds.find(id => korPlayers[id].data.pref.includes('GK'));
  const gkOppIdx = oppPositions.findIndex(o => o.gk);

  // ---- 배우 선정 ----
  let crosser, finisher; // {side, key}
  if (side === 'kor') {
    const outfield = korIds.filter(id => id !== gkKorId);
    const byTarget = [...outfield].sort((a, b) =>
      dist(korPlayers[a].x, korPlayers[a].y, zones.target.x, zones.target.y) -
      dist(korPlayers[b].x, korPlayers[b].y, zones.target.x, zones.target.y));
    finisher = { side: 'kor', key: byTarget[0] };
    const byCross = outfield.filter(id => id !== finisher.key).sort((a, b) =>
      dist(korPlayers[a].x, korPlayers[a].y, zones.cross.x, zones.cross.y) -
      dist(korPlayers[b].x, korPlayers[b].y, zones.cross.x, zones.cross.y));
    crosser = { side: 'kor', key: byCross[0] };
  } else {
    const idxs = oppPositions.map((_, i) => i).filter(i => i !== gkOppIdx);
    const byTarget = [...idxs].sort((a, b) =>
      dist(oppPositions[a].x, oppPositions[a].y, zones.target.x, zones.target.y) -
      dist(oppPositions[b].x, oppPositions[b].y, zones.target.x, zones.target.y));
    finisher = { side: 'rsa', key: byTarget[0] };
    const byCross = idxs.filter(i => i !== finisher.key).sort((a, b) =>
      dist(oppPositions[a].x, oppPositions[a].y, zones.cross.x, zones.cross.y) -
      dist(oppPositions[b].x, oppPositions[b].y, zones.cross.x, zones.cross.y));
    crosser = { side: 'rsa', key: byCross[0] };
  }

  const stages = [];
  const mkStage = () => ({ kor: {}, opp: [] });

  // ---- kf0: 현재 배치 ----
  const kf0 = mkStage();
  korIds.forEach(id => { kf0.kor[id] = { x: korPlayers[id].x, y: korPlayers[id].y }; });
  oppPositions.forEach(o => kf0.opp.push({ x: o.x, y: o.y }));
  stages.push(kf0);

  // ---- 단계 생성 헬퍼 ----
  function advance(prev, focal, opts) {
    const s = mkStage();
    korIds.forEach(id => {
      const p = prev.kor[id];
      if (id === gkKorId) { s.kor[id] = p; return; }
      if (crosser.side === 'kor' && id === crosser.key && opts.crosserTo) { s.kor[id] = { ...opts.crosserTo }; return; }
      if (finisher.side === 'kor' && id === finisher.key && opts.finisherTo) { s.kor[id] = { ...opts.finisherTo }; return; }
      if (crosser.side === 'kor' && id === crosser.key) { s.kor[id] = p; return; }
      const tight = opts.tightSet && opts.tightSide === 'kor' && opts.tightSet.has(id);
      const w = tight ? 0.62 : proximityWeight(p, focal, opts.maxDist, opts.minW, opts.maxW);
      s.kor[id] = lerpPt(p, focal, w);
    });
    prev.opp.forEach((p, i) => {
      if (i === gkOppIdx) { s.opp.push(p); return; }
      if (crosser.side === 'rsa' && i === crosser.key && opts.crosserTo) { s.opp.push({ ...opts.crosserTo }); return; }
      if (finisher.side === 'rsa' && i === finisher.key && opts.finisherTo) { s.opp.push({ ...opts.finisherTo }); return; }
      if (crosser.side === 'rsa' && i === crosser.key) { s.opp.push(p); return; }
      const tight = opts.tightSet && opts.tightSide === 'rsa' && opts.tightSet.has(i);
      const w = tight ? 0.62 : proximityWeight(p, focal, opts.maxDist, opts.minW, opts.maxW);
      s.opp.push(lerpPt(p, focal, w));
    });
    return s;
  }

  // ---- kf1: 크로스 존으로 서지 ----
  const kf1 = advance(kf0, zones.cross, { maxDist: 45, minW: 0.06, maxW: 0.32, crosserTo: zones.cross });
  stages.push(kf1);

  // ---- kf2: 타깃 존 수렴 (수비 3명 강수렴) ----
  const defSide = side === 'kor' ? 'rsa' : 'kor';
  const defList = defSide === 'kor'
    ? korIds.filter(id => id !== gkKorId).map(id => ({ id, ...kf1.kor[id] }))
    : kf1.opp.map((p, i) => ({ id: i, ...p })).filter(e => e.id !== gkOppIdx);
  const tightSet = new Set(defList
    .map(e => ({ ...e, d: dist(e.x, e.y, zones.target.x, zones.target.y) }))
    .sort((a, b) => a.d - b.d).slice(0, 3).map(e => e.id));
  const kf2 = advance(kf1, zones.target, {
    maxDist: 50, minW: 0.08, maxW: 0.22,
    finisherTo: zones.target, tightSet, tightSide: defSide,
  });
  stages.push(kf2);

  // ---- kf3: 슈팅 순간 — GK 반응 ----
  const kf3 = { kor: { ...kf2.kor }, opp: [...kf2.opp] };
  const gkOffset = (zones.target.x - 50) * 0.35;
  if (defSide === 'kor') {
    const gp = kf2.kor[gkKorId];
    kf3.kor[gkKorId] = { x: gp.x + gkOffset, y: gp.y };
  } else {
    const gp = kf2.opp[gkOppIdx];
    kf3.opp[gkOppIdx] = { x: gp.x + gkOffset, y: gp.y };
  }
  stages.push(kf3);

  // ---- kf4: 결과 (동일 유지) ----
  stages.push({ kor: { ...kf3.kor }, opp: [...kf3.opp] });

  // ---- 공 궤적 ----
  const attackingUp = side === 'kor'; // KOR은 y=0 방향으로 공격
  const midX = (zones.cross.x + zones.target.x) / 2;
  const midY = (zones.cross.y + zones.target.y) / 2;
  const ballKf = [
    { t: 0,    x: zones.cross.x, y: zones.cross.y, h: 0.0 },
    { t: 0.30, x: zones.cross.x, y: zones.cross.y, h: 0.4 },
    { t: 0.62, x: midX, y: midY, h: 5.8 },
    { t: 0.82, x: zones.target.x, y: zones.target.y, h: attackingUp ? 3.0 : 0.9 },
  ];
  let end;
  if (outcome) {
    end = { x: lerp(zones.target.x, 50, 0.55), y: attackingUp ? 0 : 100, h: 0.3 };
  } else if (defSide === 'kor') {
    const gk = kf3.kor[gkKorId];
    end = { x: gk.x, y: gk.y, h: 1.0 }; // 김승규 선방
  } else {
    end = { x: zones.target.x + (zones.target.x > 50 ? 10 : -10), y: zones.target.y + (attackingUp ? -6 : 6), h: 5.0 }; // 빗나감
  }
  ballKf.push({ t: 1.0, ...end });

  const T = [0, 0.30, 0.62, 0.82, 1.0];
  return {
    totalSeconds: 5.6,
    keyframes: stages.map((s, i) => ({ t: T[i], kor: s.kor, opp: s.opp })),
    ballKeyframes: ballKf,
    outcome,
    actors: { crosser, finisher },
  };
}
