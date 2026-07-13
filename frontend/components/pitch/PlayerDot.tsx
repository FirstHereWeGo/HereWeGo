"use client";

import { useRef } from "react";

interface PlayerDotProps {
  x: number;
  y: number;
  label?: string;
  color?: string;
  onChange: (x: number, y: number) => void;
}

export default function PlayerDot({ x, y, label, color = "#2563eb", onChange }: PlayerDotProps) {
  const dragging = useRef(false);

  function toPitchCoords(svg: SVGSVGElement, clientX: number, clientY: number) {
    const rect = svg.getBoundingClientRect();
    return {
      x: Math.min(105, Math.max(0, ((clientX - rect.left) / rect.width) * 105)),
      y: Math.min(68, Math.max(0, ((clientY - rect.top) / rect.height) * 68)),
    };
  }

  function handlePointerDown(e: React.PointerEvent<SVGCircleElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGCircleElement>) {
    if (!dragging.current) return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const p = toPitchCoords(svg, e.clientX, e.clientY);
    onChange(p.x, p.y);
  }

  function handlePointerUp() {
    dragging.current = false;
  }

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={2.2}
        fill={color}
        stroke="white"
        strokeWidth={0.3}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: "grab" }}
      />
      {label && (
        <text x={x} y={y - 3} fontSize={2.5} fill="white" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
