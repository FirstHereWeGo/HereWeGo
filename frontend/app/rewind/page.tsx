"use client";

import { useEffect, useState } from "react";

import PitchBoard from "@/components/pitch/PitchBoard";
import VectorPlayerToken from "@/components/pitch/VectorPlayerToken";
import ScenarioPicker from "@/components/scenarios/ScenarioPicker";
import { getGoalScenarios, postXgRewind } from "@/lib/api";
import type { DefendingTacticSubset, GoalScenario, PlayerVector, VectorPlayer } from "@/types/api";

export default function RewindPage() {
  const [scenarios, setScenarios] = useState<GoalScenario[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shooterVector, setShooterVector] = useState<PlayerVector | null>(null);
  const [defenders, setDefenders] = useState<VectorPlayer[]>([]);
  const [tacticSubset, setTacticSubset] = useState<DefendingTacticSubset>({
    pressingIntensity: 50,
    defensiveLineHeight: 50,
    defensiveShape: "normal",
  });
  const [baseline, setBaseline] = useState<number | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGoalScenarios()
      .then(setScenarios)
      .catch(() => setError("시나리오를 불러오지 못했습니다"));
  }, []);

  const scenario = scenarios.find((s) => s.id === selectedId) ?? null;

  function selectScenario(id: string) {
    const s = scenarios.find((sc) => sc.id === id);
    if (!s) return;
    setSelectedId(id);
    setShooterVector(s.shooter.vector);
    setDefenders(s.defenders);
    setTacticSubset(s.defendingTacticSubset);
    setBaseline(null);

    postXgRewind({
      shooter: s.shooter,
      defenders: s.defenders,
      goalkeeper: s.goalkeeper,
      pressingIntensity: s.defendingTacticSubset.pressingIntensity,
      defensiveLineHeight: s.defendingTacticSubset.defensiveLineHeight,
      defensiveShape: s.defendingTacticSubset.defensiveShape,
    })
      .then((r) => setBaseline(r.concedeProbability))
      .catch(() => setError("실점 확률 계산에 실패했습니다"));
  }

  useEffect(() => {
    if (!scenario || !shooterVector) {
      setResult(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      postXgRewind({
        shooter: { ...scenario.shooter, vector: shooterVector },
        defenders,
        goalkeeper: scenario.goalkeeper,
        pressingIntensity: tacticSubset.pressingIntensity,
        defensiveLineHeight: tacticSubset.defensiveLineHeight,
        defensiveShape: tacticSubset.defensiveShape,
      })
        .then((r) => {
          setResult(r.concedeProbability);
          setError(null);
        })
        .catch(() => setError("실점 확률 계산에 실패했습니다"))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [scenario, shooterVector, defenders, tacticSubset]);

  function updateDefender(index: number, vector: PlayerVector) {
    setDefenders((prev) => prev.map((d, i) => (i === index ? { ...d, vector } : d)));
  }

  const diffPct = baseline !== null && result !== null ? (result - baseline) * 100 : null;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">골 장면 리와인드</h1>

      <div className="mb-4">
        <ScenarioPicker
          items={scenarios}
          getId={(s) => s.id}
          getLabel={(s) => s.name}
          selectedId={selectedId}
          onSelect={selectScenario}
          emptyMessage="아직 등록된 골 장면 시나리오가 없습니다 (backend/app/data/goal_scenarios.py 에 채워주세요)."
        />
      </div>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {scenario && shooterVector && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PitchBoard>
              <VectorPlayerToken
                x={shooterVector.x}
                y={shooterVector.y}
                directionDeg={shooterVector.directionDeg}
                speed={shooterVector.speed}
                label={scenario.shooter.player.name}
                color="#eab308"
                onChange={setShooterVector}
              />
              {defenders.map((d, i) => (
                <VectorPlayerToken
                  key={d.player.id}
                  x={d.vector.x}
                  y={d.vector.y}
                  directionDeg={d.vector.directionDeg}
                  speed={d.vector.speed}
                  label={d.player.name}
                  color="#dc2626"
                  onChange={(v) => updateDefender(i, v)}
                />
              ))}
            </PitchBoard>
            <p className="text-xs text-gray-400 mt-2">점을 드래그하면 위치가, 화살표 끝(작은 원)을 드래그하면 방향/속도가 바뀝니다.</p>
          </div>

          <div>
            <div className="bg-gray-50 rounded p-3 mb-4">
              <div className="text-sm font-semibold mb-2">실점 확률 ({loading ? "계산 중..." : "결과"})</div>
              {result !== null ? (
                <div className="text-2xl font-bold">
                  {(result * 100).toFixed(1)}%
                  {diffPct !== null && Math.abs(diffPct) >= 0.1 && (
                    <span className={`text-sm ml-2 ${diffPct > 0 ? "text-red-600" : "text-green-600"}`}>
                      ({diffPct > 0 ? "+" : ""}
                      {diffPct.toFixed(1)}%p)
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-400">계산 대기 중</div>
              )}
              {baseline !== null && <div className="text-xs text-gray-400 mt-1">원래 장면: {(baseline * 100).toFixed(1)}%</div>}
            </div>

            <div className="text-sm font-semibold mb-2">수비 전술</div>
            <label className="block text-xs mb-2">
              <div className="flex justify-between mb-0.5">
                <span>압박 실행</span>
                <span className="text-gray-400">{tacticSubset.pressingIntensity}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={tacticSubset.pressingIntensity}
                onChange={(e) => setTacticSubset((t) => ({ ...t, pressingIntensity: Number(e.target.value) }))}
                className="w-full"
              />
            </label>
            <label className="block text-xs mb-2">
              <div className="flex justify-between mb-0.5">
                <span>수비 라인 높이</span>
                <span className="text-gray-400">{tacticSubset.defensiveLineHeight}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={tacticSubset.defensiveLineHeight}
                onChange={(e) => setTacticSubset((t) => ({ ...t, defensiveLineHeight: Number(e.target.value) }))}
                className="w-full"
              />
            </label>
            <label className="block text-xs mb-2">
              <div className="mb-0.5">수비 형태</div>
              <select
                value={tacticSubset.defensiveShape}
                onChange={(e) =>
                  setTacticSubset((t) => ({ ...t, defensiveShape: e.target.value as DefendingTacticSubset["defensiveShape"] }))
                }
                className="w-full border rounded px-1 py-0.5"
              >
                <option value="narrow">좁게</option>
                <option value="normal">보통</option>
                <option value="wide">넓게</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </main>
  );
}
