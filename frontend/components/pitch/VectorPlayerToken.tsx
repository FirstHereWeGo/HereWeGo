"use client";

import { useRef } from "react";

interface VectorPlayerTokenProps {
  x: number;
  y: number;
  directionDeg: number;
  speed: number;
  label?: string;
  color?: string;
  onChange: (v: { x: number; y: number; directionDeg: number; speed: number }) => void;
}

const MAX_SPEED = 30; // km/h
const MAX_ARROW_LEN = 8; // 피치 단위(m), speed=MAX_SPEED일 때 화살표 길이

export default function VectorPlayerToken({
  x,
  y,
  directionDeg,
  speed,
  label,
  color = "#dc2626",
  onChange,
}: VectorPlayerTokenProps) {
  const dragMode = useRef<"position" | "vector" | null>(null);

  function toPitchCoords(svg: SVGSVGElement, clientX: number, clientY: number) {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 105,
      y: ((clientY - rect.top) / rect.height) * 68,
    };
  }

  function handlePositionDown(e: React.PointerEvent<SVGCircleElement>) {
    dragMode.current = "position";
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleVectorDown(e: React.PointerEvent<SVGCircleElement>) {
    dragMode.current = "vector";
    e.currentTarget.setPointerCapture(e.pointerId);
    e.stopPropagation();
  }

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!dragMode.current) return;
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const p = toPitchCoords(svg, e.clientX, e.clientY);

    if (dragMode.current === "position") {
      onChange({
        x: Math.min(105, Math.max(0, p.x)),
        y: Math.min(68, Math.max(0, p.y)),
        directionDeg,
        speed,
      });
    } else {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.min(MAX_ARROW_LEN, Math.hypot(dx, dy));
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      onChange({ x, y, directionDeg: angle, speed: Math.round((dist / MAX_ARROW_LEN) * MAX_SPEED) });
    }
  }

  function handlePointerUp() {
    dragMode.current = null;
  }

  const arrowLen = (speed / MAX_SPEED) * MAX_ARROW_LEN;
  const rad = (directionDeg * Math.PI) / 180;
  const tipX = x + Math.cos(rad) * arrowLen;
  const tipY = y + Math.sin(rad) * arrowLen;

  return (
    <g onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} color={color}>
      <line x1={x} y1={y} x2={tipX} y2={tipY} stroke={color} strokeWidth={0.4} markerEnd="url(#arrowhead)" />
      <circle
        cx={x}
        cy={y}
        r={2.2}
        fill={color}
        stroke="white"
        strokeWidth={0.3}
        onPointerDown={handlePositionDown}
        style={{ cursor: "grab" }}
      />
      <circle
        cx={tipX}
        cy={tipY}
        r={1.2}
        fill="white"
        stroke={color}
        strokeWidth={0.3}
        onPointerDown={handleVectorDown}
        style={{ cursor: "crosshair" }}
      />
      {label && (
        <text x={x} y={y - 3} fontSize={2.5} fill="white" textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}
