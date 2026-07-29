import { useState } from 'react';

/** 요청받은 아이콘(모자 쓴 코치 얼굴, 모자에 "C") 그대로 벡터로 재현 - 이미지 파일 없이 인라인 SVG로. */
function CoachIcon() {
  return (
    <svg viewBox="0 0 120 120" className="coach-icon" aria-hidden="true">
      <path
        className="coach-icon-outline"
        d="M60,10 C82,10 98,26 98,50 L98,54 C104,55 108,60 108,66 C108,72 104,77 98,78
           L98,80 C98,98 81,112 60,112 C39,112 22,98 22,80 L22,78
           C16,77 12,72 12,66 C12,60 16,55 22,54 L22,50 C22,26 38,10 60,10 Z"
      />
      <path className="coach-icon-cap" d="M28,50 C28,30 42,17 60,17 C78,17 92,30 92,50 L92,58 L28,58 Z" />
      <text x="60" y="46" textAnchor="middle" className="coach-icon-letter">C</text>
      <path className="coach-icon-face" d="M26,64 L94,64 L94,80 C94,96 79,106 60,106 C41,106 26,96 26,80 Z" />
      <rect className="coach-icon-chin" x="52" y="88" width="16" height="20" rx="6" />
    </svg>
  );
}

export default function CoachButton({ suggestion, loading, error, disabled, onRequest }) {
  const [open, setOpen] = useState(false);

  /** 버튼을 누르는 즉시(따로 "요청" 버튼을 또 누를 필요 없이) 말풍선을 열면서 API 호출까지 바로 시작한다. */
  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !disabled && !suggestion && !loading && !error) {
      onRequest();
    }
  }

  return (
    <div className="coach-fab-wrap">
      {open && (
        <div className="coach-bubble glass">
          <div className="coach-bubble-head">
            <span className="coach-bubble-title">AI 전술 코치</span>
            <button type="button" className="coach-bubble-close" onClick={() => setOpen(false)} aria-label="닫기">×</button>
          </div>

          {disabled && !suggestion && (
            <div className="coach-bubble-empty">먼저 승률을 계산해주세요.</div>
          )}
          {loading && <div className="coach-bubble-loading">AI 분석 중...</div>}
          {error && !loading && <div className="coach-bubble-error">AI 분석 실패: {error}</div>}
          {suggestion && !loading && (
            <div className="coach-bubble-text">{suggestion}</div>
          )}
          {!disabled && !loading && (suggestion || error) && (
            <button className="btn-ghost coach-bubble-retry" onClick={onRequest}>다시 요청</button>
          )}
          <div className="coach-bubble-arrow" />
        </div>
      )}

      <button
        type="button"
        className={`coach-fab ${open ? 'on' : ''} ${loading ? 'loading' : ''}`}
        onClick={handleToggle}
        aria-label="AI 전술 코치"
        title="AI 전술 코치"
      >
        <CoachIcon />
      </button>
    </div>
  );
}
