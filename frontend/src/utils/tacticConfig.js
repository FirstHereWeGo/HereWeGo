/** TacticConfig의 특정 섹션.필드 하나만 불변 갱신한다. */
export function updateTacticField(tacticConfig, sectionKey, fieldKey, value) {
  const next = structuredClone(tacticConfig);
  next[sectionKey][fieldKey] = value;
  return next;
}
