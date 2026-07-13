"use client";

import type { ReactNode } from "react";

interface PitchBoardProps {
  children: ReactNode;
  className?: string;
}

// viewBox를 105x68(m, 표준 피치 크기)로 잡아서 자식 요소들이 피치 좌표를 그대로 cx/cy로 쓸 수 있게 한다.
export default function PitchBoard({ children, className }: PitchBoardProps) {
  return (
    <svg viewBox="0 0 105 68" className={`w-full h-auto rounded ${className ?? ""}`}>
      <defs>
        <marker id="arrowhead" markerWidth={4} markerHeight={4} refX={3} refY={2} orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="currentColor" />
        </marker>
      </defs>
      <rect x={0} y={0} width={105} height={68} fill="#15803d" />
      <rect x={0.5} y={0.5} width={104} height={67} fill="none" stroke="white" strokeWidth={0.3} />
      <line x1={52.5} y1={0} x2={52.5} y2={68} stroke="white" strokeWidth={0.2} />
      <circle cx={52.5} cy={34} r={9.15} fill="none" stroke="white" strokeWidth={0.2} />
      <rect x={0} y={13.84} width={16.5} height={40.32} fill="none" stroke="white" strokeWidth={0.2} />
      <rect x={88.5} y={13.84} width={16.5} height={40.32} fill="none" stroke="white" strokeWidth={0.2} />
      {children}
    </svg>
  );
}
