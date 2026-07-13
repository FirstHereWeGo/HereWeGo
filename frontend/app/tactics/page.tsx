"use client";

import { useEffect, useState } from "react";

import PlayerCard from "@/components/roster/PlayerCard";
import PresetPicker from "@/components/roster/PresetPicker";
import StatEditor from "@/components/roster/StatEditor";
import TacticPanel from "@/components/tactics/TacticPanel";
import { getPlayerPresets, getTeams, postWinProbability } from "@/lib/api";
import { defaultTacticConfig } from "@/types/api";
import type { PlayerOverride, PlayerPreset, TacticConfig, Team, TeamOutcome, WinProbabilityResponse } from "@/types/api";

export default function TacticsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [presets, setPresets] = useState<PlayerPreset[]>([]);
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [tacticA, setTacticA] = useState<TacticConfig>(defaultTacticConfig());
  const [overridesA, setOverridesA] = useState<PlayerOverride[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<WinProbabilityResponse | null>(null);
  const [result, setResult] = useState<WinProbabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTeams().then(setTeams).catch(() => setError("팀 목록을 불러오지 못했습니다"));
    getPlayerPresets().then(setPresets).catch(() => {});
  }, []);

  const teamA = teams.find((t) => t.id === teamAId) ?? null;
  const teamB = teams.find((t) => t.id === teamBId) ?? null;
  const selectedPlayer = teamA?.players.find((p) => p.id === selectedPlayerId) ?? null;

  function applyOverride(override: PlayerOverride) {
    setOverridesA((prev) => [...prev.filter((o) => o.playerId !== override.playerId), override]);
  }

  // baseline: 팀 선택 직후, 기본 전술/스탯으로 1회 계산 (이후 튜닝돼도 다시 계산하지 않음)
  useEffect(() => {
    if (!teamAId || !teamBId) {
      setBaseline(null);
      return;
    }
    postWinProbability({
      teamA: { teamId: teamAId, tacticConfig: defaultTacticConfig(), playerOverrides: [] },
      teamB: { teamId: teamBId, tacticConfig: defaultTacticConfig(), playerOverrides: [] },
    })
      .then(setBaseline)
      .catch(() => setError("승률 계산에 실패했습니다"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamAId, teamBId]);

  // 수정된 결과: 전술/오버라이드가 바뀔 때마다 (디바운스) 재계산
  useEffect(() => {
    if (!teamAId || !teamBId) {
      setResult(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      postWinProbability({
        teamA: { teamId: teamAId, tacticConfig: tacticA, playerOverrides: overridesA },
        teamB: { teamId: teamBId, tacticConfig: defaultTacticConfig(), playerOverrides: [] },
      })
        .then((r) => {
          setResult(r);
          setError(null);
        })
        .catch(() => setError("승률 계산에 실패했습니다"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [teamAId, teamBId, tacticA, overridesA]);

  function diffLabel(key: keyof TeamOutcome, side: "teamA" | "teamB"): string {
    if (!baseline || !result) return "";
    const delta = result[side][key] - baseline[side][key];
    if (Math.abs(delta) < 0.001) return "";
    const sign = delta > 0 ? "+" : "";
    return ` (${sign}${(delta * 100).toFixed(1)}%p)`;
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">승부 뒤집기 리와인드</h1>

      <div className="flex gap-4 mb-6">
        <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="border rounded px-2 py-1">
          <option value="">팀 A 선택</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="border rounded px-2 py-1">
          <option value="">팀 B (상대) 선택</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {teams.length === 0 && (
        <div className="text-sm text-gray-400 italic mb-4">
          아직 등록된 팀이 없습니다 (backend/app/data/teams.py 에 로스터를 채워주세요).
        </div>
      )}

      {teamA && teamB && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 bg-gray-50 rounded p-3">
              <div className="text-sm font-semibold mb-2">승률 ({loading ? "계산 중..." : "결과"})</div>
              {result ? (
                <ul className="text-sm space-y-1">
                  <li>
                    {teamA.name} 승: {(result.teamA.win * 100).toFixed(1)}%{diffLabel("win", "teamA")}
                  </li>
                  <li>무: {(result.teamA.draw * 100).toFixed(1)}%{diffLabel("draw", "teamA")}</li>
                  <li>
                    {teamB.name} 승: {(result.teamB.win * 100).toFixed(1)}%{diffLabel("win", "teamB")}
                  </li>
                </ul>
              ) : (
                <div className="text-xs text-gray-400">계산 대기 중</div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="text-sm font-semibold mb-2">{teamA.name} 로스터 (클릭해서 스탯 편집)</div>
              <div className="grid grid-cols-2 gap-1">
                {teamA.players.map((p) => (
                  <PlayerCard key={p.id} player={p} selected={p.id === selectedPlayerId} onClick={() => setSelectedPlayerId(p.id)} />
                ))}
              </div>
            </div>
          </div>

          {selectedPlayer && (
            <div className="mb-6">
              <PresetPicker presets={presets} targetPlayer={selectedPlayer} onApply={applyOverride} />
              <StatEditor player={selectedPlayer} onApply={applyOverride} />
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">{teamA.name} 전술 (팀 A만 편집 가능, v1)</h2>
            <TacticPanel tactic={tacticA} onChange={setTacticA} />
          </div>
        </>
      )}
    </main>
  );
}
