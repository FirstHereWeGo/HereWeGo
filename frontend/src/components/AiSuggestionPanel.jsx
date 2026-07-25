export default function AiSuggestionPanel({ suggestion, loading, error, disabled, onRequest }) {
  return (
    <div className="analytics-card glass analytics-card-large">
      <div className="analytics-card-title">AI 전술 제안 (Gemini)</div>

      {disabled && !suggestion && (
        <div className="analytics-empty">먼저 예측 승률을 계산해주세요.</div>
      )}

      <button className="btn-ghost" disabled={disabled || loading} onClick={onRequest}>
        {loading ? 'AI 분석 중...' : 'AI 분석 요청'}
      </button>

      {error && <div className="analytics-empty">AI 분석 실패: {error}</div>}
      {suggestion && <div className="ai-suggestion-text">{suggestion}</div>}
    </div>
  );
}
