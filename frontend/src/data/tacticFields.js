/**
 * backend TacticConfig(FM 스타일 5개 섹션)를 사이드바용 4개 카테고리(공격/수비/조율)로 재배치한 것.
 * 필드 스키마 자체는 backend/app/schemas/tactic.py와 1:1로 맞춰뒀다 (포메이션은 별도 카테고리라 여기 없음).
 */
export const TACTIC_GROUPS = {
  attack: [
    {
      key: 'inPossession', title: '공격 시 (볼 보유)',
      fields: [
        { key: 'buildupStyle', label: '빌드업 방식', type: 'select', options: [['short', '짧게'], ['mixed', '혼합'], ['direct', '다이렉트']] },
        { key: 'attackingWidth', label: '공격 폭', type: 'slider' },
        { key: 'passingDirectness', label: '패스 직선성', type: 'slider' },
        { key: 'tempo', label: '템포', type: 'slider' },
        { key: 'timeWasting', label: '시간 끌기', type: 'slider' },
        { key: 'buildFromBack', label: '후방 빌드업', type: 'toggle' },
        { key: 'overlapLeft', label: '왼쪽 오버래핑', type: 'toggle' },
        { key: 'overlapRight', label: '오른쪽 오버래핑', type: 'toggle' },
        { key: 'targetCentral', label: '중앙 타겟 플레이', type: 'toggle' },
        { key: 'targetWide', label: '측면 타겟 플레이', type: 'toggle' },
      ],
    },
    {
      key: 'opponentHalf', title: '상대 진영에서',
      fields: [
        { key: 'crossingApproach', label: '크로스 방식', type: 'select', options: [['low', '낮게'], ['mixed', '혼합'], ['high', '높게']] },
        { key: 'playCalmly', label: '침착하게 플레이', type: 'toggle' },
        { key: 'earlyCrosses', label: '빠른 크로스', type: 'toggle' },
        { key: 'dontHoldBack', label: '과감하게 전진', type: 'toggle' },
        { key: 'exploitSetPieces', label: '세트피스 적극 활용', type: 'toggle' },
        { key: 'dribbleMore', label: '개인 돌파 활용', type: 'toggle' },
        { key: 'playForFreedom', label: '자유로운 창의적 플레이', type: 'toggle' },
      ],
    },
  ],
  defense: [
    {
      key: 'outOfPossession', title: '수비 시 (볼 미보유)',
      fields: [
        { key: 'defensiveShape', label: '수비 대형', type: 'select', options: [['narrow', '좁게'], ['normal', '보통'], ['wide', '넓게']] },
        { key: 'pressingLine', label: '압박 시작 라인', type: 'select', options: [['low', '낮게'], ['mid', '중간'], ['high', '높게']] },
        { key: 'pressingIntensity', label: '압박 강도', type: 'slider' },
        { key: 'defensiveLineHeight', label: '수비 라인 높이', type: 'slider' },
        { key: 'tackling', label: '태클 강도', type: 'select', options: [['stay_on_feet', '신중하게'], ['hard_tackle', '강하게']] },
        { key: 'offsideTrap', label: '오프사이드 트랩', type: 'select', options: [['in', '적극 사용'], ['out', '거의 안씀'], ['none', '사용 안함']] },
        { key: 'allowCrosses', label: '크로스 허용', type: 'toggle', onLabel: '허용', offLabel: '차단 우선' },
      ],
    },
  ],
  coordination: [
    {
      key: 'style', title: '스타일',
      fields: [
        { key: 'tacticStyle', label: '팀 스타일', type: 'select', options: [['possession', '점유'], ['counter', '역습'], ['direct', '다이렉트'], ['gegenpress', '게겐프레싱']] },
        { key: 'approach', label: '공격/수비 비중', type: 'select', options: [['defensive', '수비적'], ['balanced', '균형'], ['attacking', '공격적']] },
      ],
    },
    {
      key: 'transitions', title: '전환 상황',
      fields: [
        { key: 'pressAfterLoss', label: '공을 빼앗겼을 때', type: 'toggle', onLabel: '즉시 역압박', offLabel: '재정비' },
        { key: 'counterAfterWin', label: '공을 되찾았을 때', type: 'toggle', onLabel: '즉시 역습', offLabel: '진형 유지' },
        { key: 'gkDistributeQuick', label: 'GK 빌드업', type: 'toggle', onLabel: '빠른 배급', offLabel: '신중한 배급' },
        { key: 'distributionMethod', label: '배급 방식', type: 'select', options: [['short', '짧게'], ['long', '길게']] },
      ],
    },
  ],
};
