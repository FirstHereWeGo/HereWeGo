import { useEffect, useState } from 'react';
import {
  FALLBACK_OWN_HALF_SLOTS, FALLBACK_OPP_HALF_SLOTS,
  buildOwnHalfSlots, buildOppHalfSlots,
  getPreviewSlots, getPreviewDescription, getPreviewBallPath, getPreviewFrames, getPreviewHasVisual, clusterAroundBall,
} from '../data/tacticPreviews';

const STEP_MS = 850;

/**
 * 순수 UI 프리뷰 — GameContext의 실제 상태를 직접 구독하지 않고, 표시에 필요한 우리/상대 포메이션을
 * formation/oppFormation prop으로 읽기만 한다(수정 없음). 그래서 사이드바에서 포메이션을 바꾸면
 * 이 프리뷰의 기본 배치도 그 포메이션 모양으로 함께 바뀐다. 우리 팀 11명 + 상대 팀 11명을 항상
 * 같이 보여준다.
 *
 * 애니메이션은 옵션마다 두 방식 중 하나다.
 * 1) frames(예: 다이렉트) — 옵션이 22명 전원의 위치를 프레임마다 직접 지정해둔 경우, 그 프레임을
 *    그대로 순서대로 보여준다. 다른 옵션과 완전히 독립적이라 이 옵션만 따로 다듬을 수 있다.
 * 2) ballPath(예: 짧게/혼합) — 공용 clusterAroundBall로 공 주변에 뒤섞여 모이는 걸 계산해서 보여준다.
 */
export default function TacticPreviewPitch({ activeKey, formation, oppFormation }) {
  const description = activeKey ? getPreviewDescription(activeKey) : null;
  // 아직 피치 애니메이션(frames/transform/ballPath)이 없는 옵션은 미니 피치 없이 설명 텍스트만 띄운다.
  const textOnly = activeKey ? !getPreviewHasVisual(activeKey) : false;

  const frames = activeKey ? getPreviewFrames(activeKey) : null;

  const mineBase = formation ? buildOwnHalfSlots(formation) : FALLBACK_OWN_HALF_SLOTS;
  const oppBase = oppFormation ? buildOppHalfSlots(oppFormation) : FALLBACK_OPP_HALF_SLOTS;
  const mineSlots = activeKey ? getPreviewSlots(mineBase, activeKey) : mineBase;
  const ballPath = !frames && activeKey ? getPreviewBallPath(mineSlots, activeKey) : null;

  const stepCount = frames ? frames.length : (ballPath?.length ?? 0);

  // frames든 ballPath든, 경유지/프레임을 순서대로 도는 타이머는 공용으로 쓴다.
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    if (stepCount < 2) return undefined;
    const id = setInterval(() => setStep(i => (i + 1) % stepCount), STEP_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, stepCount]);

  let allSlots;
  let ballPoint;
  if (frames && frames.length > 0) {
    // activeKey가 막 바뀐 직후엔 step 리셋 이펙트가 아직 반영되기 전이라 짧아진 새 frames에
    // 이전 인덱스가 벗어날 수 있어 안전하게 clamp한다.
    const frame = frames[step] ?? frames[frames.length - 1];
    allSlots = [
      ...frame.mine.map((p, i) => ({ x: p.x, y: p.y, side: 'mine', gk: i === 0 })),
      ...frame.opp.map((p, i) => ({ x: p.x, y: p.y, side: 'opp', gk: i === 0 })),
    ];
    ballPoint = frame.ball;
  } else {
    const stepRatio = ballPath && ballPath.length > 1 ? step / (ballPath.length - 1) : 0;
    const rawBallPoint = ballPath?.[step];
    const { mine: mineClustered, opp: oppClustered } = clusterAroundBall(mineSlots, oppBase, rawBallPoint, stepRatio);
    allSlots = [
      ...mineClustered.map(s => ({ ...s, side: 'mine', gk: s.role === 'GK' })),
      ...oppClustered.map(s => ({ ...s, side: 'opp', gk: s.role === 'GK' })),
    ];
    ballPoint = ballPath && ballPath.length > 0 ? (rawBallPoint ?? ballPath[ballPath.length - 1]) : null;
  }

  return (
    <div className={`tpp glass ${activeKey ? 'active' : ''} ${textOnly ? 'tpp-textonly' : ''}`}>
      <div className="tpp-head">전술 미리보기</div>

      {!textOnly && (
        <div className="tpp-pitch">
          <svg className="tpp-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <rect className="tpp-line" x="1" y="1" width="98" height="98" />
            <line className="tpp-line" x1="1" y1="50" x2="99" y2="50" />
            <circle className="tpp-line" cx="50" cy="50" r="9" />
            <rect className="tpp-line" x="26" y="0" width="48" height="15" />
            <rect className="tpp-line" x="26" y="85" width="48" height="15" />
          </svg>

          {allSlots.map((slot, i) => (
            <div
              key={i}
              className={`tpp-dot ${slot.side} ${slot.gk ? 'gk' : ''}`}
              style={{ left: `${slot.x}%`, top: `${100 - slot.y}%` }}
            />
          ))}

          {ballPoint && (
            <div className="tpp-ball" style={{ left: `${ballPoint.x}%`, top: `${100 - ballPoint.y}%` }} />
          )}
        </div>
      )}

      <div className="tpp-desc">
        {description || '전술 옵션에 마우스를 올려보세요'}
      </div>
    </div>
  );
}
