/**
 * 왼발/오른발 능력치(1~5)를 세로로 긴 타원 + 숫자로 보여준다.
 * 둘 중 더 높은 쪽(같으면 둘 다)이 "주발"이라 초록색으로 강조된다.
 */
function FootIcon({ label, value, dominant }) {
  return (
    <div className={`foot-icon ${dominant ? 'dominant' : ''}`} title={`${label} ${value}/5`}>
      <svg viewBox="0 0 60 96" className="foot-icon-svg" aria-hidden="true">
        <ellipse cx="30" cy="48" rx="26" ry="46" />
      </svg>
      <span className="foot-icon-val num">{value}</span>
    </div>
  );
}

export default function FootRating({ leftFoot, rightFoot }) {
  return (
    <div className="foot-rating">
      <FootIcon label="왼발" value={leftFoot} dominant={leftFoot >= rightFoot} />
      <FootIcon label="오른발" value={rightFoot} dominant={rightFoot >= leftFoot} />
    </div>
  );
}
