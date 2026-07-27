import { FALLBACK_BASE_SLOTS, buildBaseSlots, getPreviewSlots, getPreviewDescription } from '../data/tacticPreviews';

/**
 * 순수 UI 프리뷰 — GameContext의 실제 상태를 직접 구독하지 않고, 표시에 필요한 현재 포메이션을
 * formation prop으로 읽기만 한다(수정 없음). 그래서 사이드바에서 포메이션을 바꾸면 이 프리뷰의
 * 기본 배치도 그 포메이션 모양으로 함께 바뀐다.
 */
export default function TacticPreviewPitch({ activeKey, formation }) {
  const baseSlots = formation ? buildBaseSlots(formation) : FALLBACK_BASE_SLOTS;
  const slots = activeKey ? getPreviewSlots(baseSlots, activeKey) : baseSlots;
  const description = activeKey ? getPreviewDescription(activeKey) : null;

  return (
    <div className={`tpp glass ${activeKey ? 'active' : ''}`}>
      <div className="tpp-head">전술 미리보기</div>

      <div className="tpp-pitch">
        <svg className="tpp-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect className="tpp-line" x="1" y="1" width="98" height="98" />
          <line className="tpp-line" x1="1" y1="50" x2="99" y2="50" />
          <circle className="tpp-line" cx="50" cy="50" r="9" />
          <rect className="tpp-line" x="26" y="0" width="48" height="15" />
          <rect className="tpp-line" x="26" y="85" width="48" height="15" />
        </svg>

        {slots.map((slot, i) => (
          <div
            key={i}
            className={`tpp-dot ${slot.role === 'GK' ? 'gk' : ''}`}
            style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
          >
            <span>{slot.role}</span>
          </div>
        ))}
      </div>

      <div className="tpp-desc">
        {description || '전술 옵션에 마우스를 올려보세요'}
      </div>
    </div>
  );
}
