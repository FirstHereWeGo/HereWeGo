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
 * 8강 대진을 짠다 — 내가 고른 팀은 반드시 8강 1경기에 나오고,
 * 나머지 7팀(내 팀 제외 중 랜덤으로 뽑음)이 그 상대와 남은 3경기를 채운다.
 */
export function buildInitialBracket(allTeams, myTeamId) {
  const myTeam = allTeams.find(t => t.id === myTeamId);
  const rest = shuffle(allTeams.filter(t => t.id !== myTeamId)).slice(0, 7);
  const [oppTeam, ...others] = rest;

  const qf = [{ home: myTeam, away: oppTeam, result: null }];
  for (let i = 0; i < others.length; i += 2) {
    qf.push({ home: others[i], away: others[i + 1], result: null });
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

/**
 * 하이드레이션 브레이크 구간표 — /api/match-simulation·/api/match-stats에
 * durationMinutes/minuteOffset(또는 durationMinutes)으로 그대로 넘긴다.
 * 각 구간은 그 시점의 최신 전술로 그 구간만 새로 계산되고(선행 계산 없음),
 * breakLabel은 구간이 끝난 직후 보여줄 브레이크 화면 제목이다.
 */
export const MATCH_PHASES = [
  { phase: 'REG_1A', duration: 25, offset: 0, breakLabel: '전반 25분 · 하이드레이션 브레이크' },
  { phase: 'REG_1B', duration: 20, offset: 25, breakLabel: '전반 종료' },
  { phase: 'REG_2A', duration: 25, offset: 45, breakLabel: '후반 25분 · 하이드레이션 브레이크' },
  { phase: 'REG_2B', duration: 20, offset: 70, breakLabel: '경기 종료' },
];

export const EXTRA_TIME_PHASES = [
  { phase: 'ET_1', duration: 15, offset: 90, breakLabel: '연장 전반 종료' },
  { phase: 'ET_2', duration: 15, offset: 105, breakLabel: '연장 후반 종료' },
];

/**
 * 구간별 통계 델타를 누적한다. "점유"는 누적 카운트가 아니라 그 구간의 순간값이라
 * 합산하지 않고 최신 구간 값으로 교체한다. 섹션/행 순서는 model이 항상 같은
 * 순서로 만들어주므로(match_stats.py) 인덱스로 매칭한다. "momentum"은 구간 상대분
 * (1..durationMinutes)으로 오므로, 이 구간의 minuteOffset을 더해 절대분으로 바꾼 뒤
 * 이어붙인다(합산 대상이 아니라 시계열 자체를 계속 늘려나가는 값).
 */
export function mergeMatchStats(prevStats, delta, minuteOffset) {
  const momentum = [
    ...(prevStats?.momentum ?? []),
    ...delta.momentum.map(p => ({ minute: p.minute + minuteOffset, value: p.value })),
  ];
  if (!prevStats) return { ...delta, momentum };
  return {
    sections: delta.sections.map((section, si) => {
      const prevSection = prevStats.sections[si];
      return {
        title: section.title,
        rows: section.rows.map((row, ri) => {
          const prevRow = prevSection?.rows[ri];
          if (!prevRow || row.label === '점유') return row;
          return { label: row.label, a: prevRow.a + row.a, b: prevRow.b + row.b };
        }),
      };
    }),
    momentum,
  };
}

/**
 * 골은 team_rating 기반 포아송으로, "슈팅" 통계는 완전히 별도의 랜덤값으로 생성되다 보니
 * 우연히 골 수보다 온 타겟 슈팅 수가 적게 나올 수 있다 — 골이 나려면 최소 그만큼의
 * 온 타겟 슈팅이 있었어야 하므로 누적 스코어를 하한선으로 보정한다.
 */
export function clampShotsToGoals(stats, scoreA, scoreB) {
  return {
    sections: stats.sections.map(section => {
      if (section.title !== '슈팅') return section;
      return {
        title: section.title,
        rows: section.rows.map(row => {
          if (row.label !== '온 타겟') return row;
          return { label: row.label, a: Math.max(row.a, scoreA), b: Math.max(row.b, scoreB) };
        }),
      };
    }),
    momentum: stats.momentum,
  };
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
