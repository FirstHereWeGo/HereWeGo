"use client";

import { useState } from "react";

import type { Player, PlayerOverride } from "@/types/api";

const OUTFIELD_STATS: { key: string; label: string }[] = [
  { key: "pace", label: "주력" },
  { key: "agility", label: "민첩성" },
  { key: "strength", label: "몸싸움" },
  { key: "finishing", label: "골결정력" },
  { key: "dribbling", label: "드리블" },
  { key: "passing", label: "패스" },
  { key: "vision", label: "시야" },
  { key: "positioning", label: "위치선정" },
  { key: "tackling", label: "태클" },
  { key: "marking", label: "일대일 마크" },
];

interface StatEditorProps {
  player: Player;
  onApply: (override: PlayerOverride) => void;
}

export default function StatEditor({ player, onApply }: StatEditorProps) {
  const isGk = player.position === "GK";
  const [attrs, setAttrs] = useState<Record<string, number>>({
    ...(player.attributes as unknown as Record<string, number>),
  });
  const [age, setAge] = useState(player.age);

  function updateAttr(key: string, value: number) {
    const next = { ...attrs, [key]: value };
    setAttrs(next);
    onApply({ playerId: player.id, attributeOverrides: next, ageOverride: age });
  }

  function updateAge(value: number) {
    setAge(value);
    onApply({ playerId: player.id, attributeOverrides: attrs, ageOverride: value });
  }

  return (
    <div className="border rounded p-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{player.name} 스탯 편집</div>
        <label className="text-xs flex items-center gap-1">
          나이
          <input
            type="number"
            value={age}
            onChange={(e) => updateAge(Number(e.target.value))}
            className="w-14 border rounded px-1 py-0.5"
          />
        </label>
      </div>

      {isGk ? (
        <label className="flex items-center justify-between text-sm">
          <span>종합 능력치</span>
          <input
            type="number"
            min={1}
            max={20}
            value={attrs.overall ?? 10}
            onChange={(e) => updateAttr("overall", Number(e.target.value))}
            className="w-16 border rounded px-1 py-0.5"
          />
        </label>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {OUTFIELD_STATS.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between text-xs gap-2">
              <span>{label}</span>
              <input
                type="number"
                min={1}
                max={20}
                value={attrs[key] ?? 10}
                onChange={(e) => updateAttr(key, Number(e.target.value))}
                className="w-14 border rounded px-1 py-0.5"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
