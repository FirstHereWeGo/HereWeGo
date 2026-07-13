"use client";

import type { Player, PlayerOverride, PlayerPreset } from "@/types/api";

interface PresetPickerProps {
  presets: PlayerPreset[];
  targetPlayer: Player;
  onApply: (override: PlayerOverride) => void;
}

export default function PresetPicker({ presets, targetPlayer, onApply }: PresetPickerProps) {
  if (presets.length === 0) return null;

  return (
    <div className="flex gap-2 mb-2">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() =>
            onApply({
              playerId: targetPlayer.id,
              attributeOverrides: preset.attributes,
              ageOverride: preset.age,
            })
          }
          className="text-xs px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300"
        >
          {preset.label} 적용
        </button>
      ))}
    </div>
  );
}
