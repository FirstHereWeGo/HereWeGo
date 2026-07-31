/**
 * backend Player.positions(9종 세부 포지션)과 AttributeBlock(10개 스탯)에 대한
 * 표시용 라벨. 게임 데이터가 아니라 UI 라벨/레이아웃 상수라 프론트에 남는다.
 * positions 코드(GK/CB/FB/WB/DM/CM/AM/WG/ST) 자체가 이미 약자라 그대로 표시에 쓴다.
 */
export const ATTRIBUTE_LABELS = [
  ['pace', '주력'],
  ['agility', '민첩성'],
  ['strength', '몸싸움'],
  ['finishing', '골결정력'],
  ['dribbling', '드리블'],
  ['passing', '패스'],
  ['vision', '시야'],
  ['positioning', '위치선정'],
  ['tackling', '태클'],
  ['marking', '1:1 마크'],
];

// GoalkeepingBlock(5개 스탯)에 대한 표시용 라벨.
export const GK_ATTRIBUTE_LABELS = [
  ['reflexes', '반사신경'],
  ['decisions', '판단력'],
  ['handling', '핸들링'],
  ['positioning', '위치선정'],
  ['passing', '패스'],
];

// 포지션별 핵심 스탯(강조 표시용)
export const KEY_ATTRS = {
  CB: ['marking', 'tackling', 'strength'],
  FB: ['pace', 'tackling', 'passing'],
  WB: ['pace', 'passing', 'dribbling'],
  DM: ['tackling', 'passing', 'positioning'],
  CM: ['passing', 'vision', 'positioning'],
  AM: ['vision', 'dribbling', 'passing'],
  WG: ['dribbling', 'pace', 'agility'],
  ST: ['finishing', 'positioning', 'strength'],
};
