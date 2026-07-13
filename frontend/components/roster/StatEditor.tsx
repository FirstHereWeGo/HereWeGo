"use client";

import { useState } from "react";

import type { Player, PlayerOverride } from "@/types/api";

const TECHNICAL_KEYS = [
  "corners", "crossing", "dribbling", "finishing", "firstTouch", "freeKickTaking", "heading",
  "longShots", "longThrows", "marking", "passing", "penaltyTaking", "tackling", "technique",
] as const;
const GOALKEEPING_KEYS = ["reflexes", "handling", "commandOfArea", "kicking", "oneOnOnes", "aerialReach"] as const;
const MENTAL_KEYS = [
  "aggression", "anticipation", "bravery", "composure", "concentration", "decisions",
  "determination", "flair", "leadership", "offTheBall", "positioning", "teamwork", "vision", "workRate",
] as const;
const PHYSICAL_KEYS = [
  "acceleration", "agility", "balance", "jumpingReach", "naturalFitness", "pace", "stamina", "strength",
] as const;

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

  function renderGroup(title: string, keys: readonly string[]) {
    return (
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-500 mb-1">{title}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {keys.map((key) => (
            <label key={key} className="flex items-center justify-between text-xs gap-2">
              <span className="capitalize">{key}</span>
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
      </div>
    );
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
      {renderGroup(isGk ? "골키핑" : "기술", isGk ? GOALKEEPING_KEYS : TECHNICAL_KEYS)}
      {renderGroup("정신", MENTAL_KEYS)}
      {renderGroup("신체", PHYSICAL_KEYS)}
    </div>
  );
}
