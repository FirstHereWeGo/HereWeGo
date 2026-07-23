/**
 * 라이브 경기 대시보드가 쓰는 파생 지표 계산. model이 실제로 내려주는
 * MatchStatsResponse(sections: [{title, rows: [{label, a, b}]}])만 입력으로 받는다 —
 * xG나 슈팅 좌표, 공중볼 승리처럼 model에 없는 값은 절대 새로 지어내지 않고
 * 이미 있는 섹션/행을 재구성·재라벨링해서 쓴다.
 */

function findSection(stats, title) {
  return stats?.sections?.find(s => s.title === title) ?? null;
}

function findRow(stats, sectionTitle, label) {
  return findSection(stats, sectionTitle)?.rows.find(r => r.label === label) ?? { label, a: 0, b: 0 };
}

function sumRows(stats, sectionTitle) {
  const rows = findSection(stats, sectionTitle)?.rows ?? [];
  return rows.reduce((acc, r) => ({ a: acc.a + r.a, b: acc.b + r.b }), { a: 0, b: 0 });
}

/** "경기 흐름 / 슈팅 / 경합" 3그룹으로 재구성한다. */
export function buildStatGroups(stats) {
  const possession = findRow(stats, '공격', '점유');
  const passSuccess = findRow(stats, '볼 배급', '성공한 패스 수');
  const finalThirdTotal = sumRows(stats, '파이널 서드 진입');

  const onTarget = findRow(stats, '슈팅', '온 타겟');
  const offTarget = findRow(stats, '슈팅', '오프 타겟');
  const inBox = findRow(stats, '슈팅', '페널티 구역 안쪽');
  const shotsTotal = { label: '전체 슈팅', a: onTarget.a + offTarget.a, b: onTarget.b + offTarget.b };

  const recoveries = findRow(stats, '수비', '수비가 의도한 볼탈취');
  // "피파울"은 "당한 파울" 기준(a=상대 반칙수)이라, 우리가 보여줄 "파울"(범한 파울)은 좌우를 바꿔 읽는다.
  const suffered = findRow(stats, '경고', '피파울');
  const fouls = { label: '파울', a: suffered.b, b: suffered.a };
  const assists = findRow(stats, '공격', '도움');

  return {
    flow: [
      { label: '점유', a: possession.a, b: possession.b, unit: '%' },
      { label: '패스 성공', a: passSuccess.a, b: passSuccess.b },
      { label: '최종 3선 진입', a: finalThirdTotal.a, b: finalThirdTotal.b },
    ],
    shooting: [
      { label: '전체 슈팅', a: shotsTotal.a, b: shotsTotal.b },
      { label: '유효 슈팅', a: onTarget.a, b: onTarget.b },
      { label: '박스 안 슈팅', a: inBox.a, b: inBox.b },
    ],
    duel: [
      { label: '볼 회수', a: recoveries.a, b: recoveries.b },
      { label: '파울', a: fouls.a, b: fouls.b },
      { label: '도움', a: assists.a, b: assists.b },
    ],
  };
}

export const CHANNEL_LABELS = ['왼쪽', '왼쪽 중앙', '중앙', '오른쪽 중앙', '오른쪽'];

/** 실좌표가 없어 슈팅 점 대신 쓰는 "최종 3선 진입" 5채널(왼→오) 세기. */
export function buildChannelIntensity(stats) {
  const rows = findSection(stats, '파이널 서드 진입')?.rows ?? [];
  return {
    a: CHANNEL_LABELS.map((_, i) => rows[i]?.a ?? 0),
    b: CHANNEL_LABELS.map((_, i) => rows[i]?.b ?? 0),
  };
}

const STYLE_AXES = [
  { key: 'buildup', label: '전개' },
  { key: 'finishing', label: '마무리' },
  { key: 'pressing', label: '압박' },
  { key: 'stability', label: '안정성' },
  { key: 'duels', label: '경합' },
];

// model의 평균 총량(mean_total) 근처를 100으로 보는 근사 캡 — 정밀한 랭킹이 아니라
// 레이더 모양을 위한 상대적 스케일이다.
const CAPS = { buildup: 60, pressing: 150, duels: 45 };

function ratio(numer, denom) {
  return denom > 0 ? (numer / denom) * 100 : 0;
}

function clamp100(v) {
  return Math.max(0, Math.min(100, v));
}

/** 팀 성향 레이더 5축 — model에 없는 지표라 기존 섹션들을 조합해 근사한다. */
export function buildStyleAxes(stats) {
  const channels = buildChannelIntensity(stats);
  const buildupA = channels.a.reduce((s, v) => s + v, 0);
  const buildupB = channels.b.reduce((s, v) => s + v, 0);

  const onTarget = findRow(stats, '슈팅', '온 타겟');
  const offTarget = findRow(stats, '슈팅', '오프 타겟');
  const press = findRow(stats, '수비', '압박 시도 횟수');
  const passes = findRow(stats, '볼 배급', '패스');
  const passSuccess = findRow(stats, '볼 배급', '성공한 패스 수');
  const recoveries = findRow(stats, '수비', '수비가 의도한 볼탈취');

  const values = side => ({
    buildup: clamp100(ratio(side === 'a' ? buildupA : buildupB, CAPS.buildup)),
    finishing: clamp100(ratio(onTarget[side], onTarget[side] + offTarget[side])),
    pressing: clamp100(ratio(press[side], CAPS.pressing)),
    stability: clamp100(ratio(passSuccess[side], passes[side])),
    duels: clamp100(ratio(recoveries[side], CAPS.duels)),
  });

  return { axes: STYLE_AXES, a: values('a'), b: values('b'), max: 100 };
}
