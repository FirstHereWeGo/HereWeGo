import { useEffect, useRef, useState } from 'react';

/** 다크 테마에 맞춘 커스텀 드롭다운 — 네이티브 <select>는 옵션 팝업 배경/스크롤바를 못 바꿔서 대체함. */
export default function PlayerSelect({ players, value, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = players.find(p => p.id === value);

  useEffect(() => {
    if (!open) return;
    function onDocPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocPointerDown);
    return () => document.removeEventListener('mousedown', onDocPointerDown);
  }, [open]);

  return (
    <div className="player-select" ref={rootRef}>
      <button type="button" className="player-select-btn" onClick={() => setOpen(o => !o)}>
        <span>{selected?.name ?? '선수 선택'}</span>
        <span className="player-select-caret">▾</span>
      </button>
      {open && (
        <ul className="player-select-list">
          {players.map(p => (
            <li key={p.id}>
              <button
                type="button"
                className={`player-select-option ${p.id === value ? 'on' : ''}`}
                onClick={() => { onChange(p.id); setOpen(false); }}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
