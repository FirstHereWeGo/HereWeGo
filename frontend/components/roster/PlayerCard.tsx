"use client";

import type { Player } from "@/types/api";

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  onClick?: () => void;
}

export default function PlayerCard({ player, selected, onClick }: PlayerCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded border text-sm ${
        selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
      }`}
    >
      <div className="flex justify-between">
        <span className="font-medium">{player.name}</span>
        <span className="text-gray-500">{player.position}</span>
      </div>
      <div className="text-xs text-gray-400">age {player.age}</div>
    </button>
  );
}
