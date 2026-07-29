import { useLayoutEffect, useState } from 'react';

/**
 * 카드들의 실제 렌더 위치(getBoundingClientRect)를 측정해서 8강→4강→결승을
 * 잇는 브래킷 커넥터를 SVG로 그린다. rem 기반 고정값 대신 실측이라 폰트/카드
 * 크기가 바뀌거나 화면 크기가 바뀌어도 항상 카드 가장자리에 정확히 붙는다.
 */
export default function BracketLines({ containerRef, qfRefs, sfRefs, finalRef, watch }) {
  const [paths, setPaths] = useState([]);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    function recompute() {
      const container = containerRef.current;
      if (!container) { requestAnimationFrame(recompute); return; }
      const cRect = container.getBoundingClientRect();
      setBox({ w: cRect.width, h: cRect.height });

      const rectOf = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: r.top - cRect.top,
          left: r.left - cRect.left,
          right: r.right - cRect.left,
          midY: r.top - cRect.top + r.height / 2,
        };
      };

      const qf = qfRefs.map(r => rectOf(r.current));
      const sf = sfRefs.map(r => rectOf(r.current));
      const final = rectOf(finalRef.current);
      if (qf.some(r => !r) || sf.some(r => !r) || !final) { requestAnimationFrame(recompute); return; }

      const pairToSingle = (srcA, srcB, dst, toRight) => {
        const edgeX = toRight ? Math.max(srcA.right, srcB.right) : Math.min(srcA.left, srcB.left);
        const dstEdgeX = toRight ? dst.left : dst.right;
        const midX = (edgeX + dstEdgeX) / 2;
        const midY = (srcA.midY + srcB.midY) / 2;
        return [
          `M ${edgeX} ${srcA.midY} H ${midX} V ${midY}`,
          `M ${edgeX} ${srcB.midY} H ${midX} V ${midY}`,
          `M ${midX} ${midY} H ${dstEdgeX}`,
        ];
      };

      const singleToSingle = (src, dst, toRight) => {
        const srcX = toRight ? src.right : src.left;
        const dstX = toRight ? dst.left : dst.right;
        const midX = (srcX + dstX) / 2;
        return `M ${srcX} ${src.midY} H ${midX} V ${dst.midY} H ${dstX}`;
      };

      setPaths([
        ...pairToSingle(qf[0], qf[1], sf[0], true),
        ...pairToSingle(qf[2], qf[3], sf[1], false),
        singleToSingle(sf[0], final, true),
        singleToSingle(sf[1], final, false),
      ]);
    }

    recompute();
    const ro = new ResizeObserver(recompute);
    let rafId = requestAnimationFrame(function attachObserver() {
      if (containerRef.current) ro.observe(containerRef.current);
      else rafId = requestAnimationFrame(attachObserver);
    });
    window.addEventListener('resize', recompute);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
    // ResizeObserver가 리사이즈를, watch(bracket 객체)가 라운드 진행에 따른 카드 내용 변화를 각각 담당한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return (
    <svg className="bracket-lines" style={{ width: box.w, height: box.h }}>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
