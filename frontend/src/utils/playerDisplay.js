/** backend Player엔 등번호 필드가 없어서 id(예: "kor-4")의 숫자 부분으로 대체 표시한다. */
export function jerseyNumber(id) {
  const m = /(\d+)$/.exec(id);
  return m ? Number(m[1]) : 0;
}
