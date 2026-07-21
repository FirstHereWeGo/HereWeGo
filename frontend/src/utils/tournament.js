const PSO_SUCCESS_RATE = 0.75; // 팀 체급과 무관한 고정 확률 — 승부차기는 순수 랜덤으로만 승자를 정한다
const PSO_SUDDEN_DEATH_GUARD = 50; // 극단적으로 긴 서든데스를 방지하는 안전장치

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 8강 대진을 짠다 — 내가 고른 두 팀은 반드시 8강 1경기에서 맞붙고,
 * 나머지 6팀(내 팀/상대 팀 제외 중 랜덤으로 뽑음)이 남은 3경기를 채운다.
 */
export function buildInitialBracket(allTeams, myTeamId, oppTeamId) {
  const myTeam = allTeams.find(t => t.id === myTeamId);
  const oppTeam = allTeams.find(t => t.id === oppTeamId);
  const rest = allTeams.filter(t => t.id !== myTeamId && t.id !== oppTeamId);
  const randomSix = shuffle(rest).slice(0, 6);

  const qf = [{ home: myTeam, away: oppTeam, result: null }];
  for (let i = 0; i < randomSix.length; i += 2) {
    qf.push({ home: randomSix[i], away: randomSix[i + 1], result: null });
  }
  return { qf, sf: null, final: null, bronze: null };
}

/** 승자들로 다음 라운드 매치를 짠다 (같은 순서로 2팀씩 페어링). */
export function nextRoundPairs(playedMatches) {
  const winners = playedMatches.map(m => (m.result.winnerId === m.home.id ? m.home : m.away));
  const pairs = [];
  for (let i = 0; i < winners.length; i += 2) {
    pairs.push({ home: winners[i], away: winners[i + 1], result: null });
  }
  return pairs;
}

export function losersFromMatches(playedMatches) {
  return playedMatches.map(m => (m.result.winnerId === m.home.id ? m.away : m.home));
}

/** 승부차기 - 팀 체급과 무관하게 고정 확률(75%)로만 진행되는 순수 랜덤 승부. */
export function simulatePenalties() {
  let scoreA = 0;
  let scoreB = 0;
  for (let i = 0; i < 5; i++) {
    if (Math.random() < PSO_SUCCESS_RATE) scoreA++;
    if (Math.random() < PSO_SUCCESS_RATE) scoreB++;
  }
  let guard = 0;
  while (scoreA === scoreB && guard < PSO_SUDDEN_DEATH_GUARD) {
    if (Math.random() < PSO_SUCCESS_RATE) scoreA++;
    if (Math.random() < PSO_SUCCESS_RATE) scoreB++;
    guard++;
  }
  if (scoreA === scoreB) scoreA++; // 가드 한도까지 안 갈렸을 때의 최후 안전장치
  return { scoreA, scoreB };
}
