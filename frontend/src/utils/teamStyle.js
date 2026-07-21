const TACTIC_STYLE_LABEL = {
  possession: '점유',
  counter: '역습',
  direct: '다이렉트',
  gegenpress: '게겐프레싱',
  attacking: '공격 지향',
};

const APPROACH_LABEL = {
  attacking: '공격적인',
  balanced: '균형 잡힌',
  defensive: '수비적인',
};

/** 팀 기본 TacticConfig.style을 한 줄 설명으로 바꾼다. */
export function describeTeamStyle(tacticConfig) {
  const { tacticStyle, approach } = tacticConfig.style;
  const styleLabel = TACTIC_STYLE_LABEL[tacticStyle] ?? tacticStyle;
  const approachLabel = APPROACH_LABEL[approach] ?? approach;
  return `${approachLabel} ${styleLabel} 축구를 구사하는 팀`;
}
