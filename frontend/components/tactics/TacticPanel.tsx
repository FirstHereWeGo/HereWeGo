"use client";

import type { TacticConfig } from "@/types/api";

interface TacticPanelProps {
  tactic: TacticConfig;
  onChange: (tactic: TacticConfig) => void;
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs mb-2">
      <div className="flex justify-between mb-0.5">
        <span>{label}</span>
        <span className="text-gray-400">{value}</span>
      </div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-xs mb-1.5">
      <span>{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="block text-xs mb-2">
      <div className="mb-0.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="w-full border rounded px-1 py-0.5">
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function TacticPanel({ tactic, onChange }: TacticPanelProps) {
  function update<K extends keyof TacticConfig>(section: K, patch: Partial<TacticConfig[K]>) {
    const nextSection = { ...tactic[section], ...patch } as TacticConfig[K];
    onChange({ ...tactic, [section]: nextSection } as TacticConfig);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div>
        <h3 className="font-semibold mb-2">전술 유형</h3>
        <Select
          label="전술 유형"
          value={tactic.style.tacticStyle}
          options={["possession", "gegenpress", "counter", "direct"]}
          onChange={(v) => update("style", { tacticStyle: v })}
        />
        <Select
          label="전술 성향"
          value={tactic.style.approach}
          options={["dominant", "balanced", "cautious"]}
          onChange={(v) => update("style", { approach: v })}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-2">공 소유 시</h3>
        <Slider label="공격 폭" value={tactic.inPossession.attackingWidth} onChange={(v) => update("inPossession", { attackingWidth: v })} />
        <Slider label="템포" value={tactic.inPossession.tempo} onChange={(v) => update("inPossession", { tempo: v })} />
        <Slider
          label="패스 방식 (짧게 ↔ 길게)"
          value={tactic.inPossession.passingDirectness}
          onChange={(v) => update("inPossession", { passingDirectness: v })}
        />
        <Slider label="시간 보내기" value={tactic.inPossession.timeWasting} onChange={(v) => update("inPossession", { timeWasting: v })} />
        <Select
          label="공격 전개 방식"
          value={tactic.inPossession.buildupStyle}
          options={["short", "mixed", "direct"] as const}
          onChange={(v) => update("inPossession", { buildupStyle: v })}
        />
        <Toggle label="왼쪽 오버래핑" value={tactic.inPossession.overlapLeft} onChange={(v) => update("inPossession", { overlapLeft: v })} />
        <Toggle label="오른쪽 오버래핑" value={tactic.inPossession.overlapRight} onChange={(v) => update("inPossession", { overlapRight: v })} />
        <Toggle label="중앙을 노려라" value={tactic.inPossession.targetCentral} onChange={(v) => update("inPossession", { targetCentral: v })} />
        <Toggle label="측면을 노려라" value={tactic.inPossession.targetWide} onChange={(v) => update("inPossession", { targetWide: v })} />
        <Toggle
          label="수비 진영에서 빌드업하라"
          value={tactic.inPossession.buildFromBack}
          onChange={(v) => update("inPossession", { buildFromBack: v })}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-2">상대팀 진영</h3>
        <Select
          label="크로싱 접근"
          value={tactic.opponentHalf.crossingApproach}
          options={["low", "mixed", "high"] as const}
          onChange={(v) => update("opponentHalf", { crossingApproach: v })}
        />
        <Toggle label="침착하게 골 찬스를 만들어라" value={tactic.opponentHalf.playCalmly} onChange={(v) => update("opponentHalf", { playCalmly: v })} />
        <Toggle label="얼리 크로스를 올려라" value={tactic.opponentHalf.earlyCrosses} onChange={(v) => update("opponentHalf", { earlyCrosses: v })} />
        <Toggle label="슛을 아끼지 말아라" value={tactic.opponentHalf.dontHoldBack} onChange={(v) => update("opponentHalf", { dontHoldBack: v })} />
        <Toggle label="세트피스를 노려라" value={tactic.opponentHalf.exploitSetPieces} onChange={(v) => update("opponentHalf", { exploitSetPieces: v })} />
        <Toggle label="드리블 더 하라" value={tactic.opponentHalf.dribbleMore} onChange={(v) => update("opponentHalf", { dribbleMore: v })} />
        <Toggle label="자유롭게 플레이하라" value={tactic.opponentHalf.playForFreedom} onChange={(v) => update("opponentHalf", { playForFreedom: v })} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">전환 시</h3>
        <Toggle
          label="공을 빼앗겼을 때: 역압박"
          value={tactic.transitions.pressAfterLoss}
          onChange={(v) => update("transitions", { pressAfterLoss: v })}
        />
        <Toggle
          label="공을 가지고 있을 때: 역습"
          value={tactic.transitions.counterAfterWin}
          onChange={(v) => update("transitions", { counterAfterWin: v })}
        />
        <Toggle
          label="골키퍼: 빠르게 배급"
          value={tactic.transitions.gkDistributeQuick}
          onChange={(v) => update("transitions", { gkDistributeQuick: v })}
        />
        <Select
          label="분배 방식"
          value={tactic.transitions.distributionMethod}
          options={["short", "long"] as const}
          onChange={(v) => update("transitions", { distributionMethod: v })}
        />
      </div>

      <div>
        <h3 className="font-semibold mb-2">소유권 없을 때</h3>
        <Select
          label="수비 형태"
          value={tactic.outOfPossession.defensiveShape}
          options={["narrow", "normal", "wide"] as const}
          onChange={(v) => update("outOfPossession", { defensiveShape: v })}
        />
        <Slider
          label="압박 실행"
          value={tactic.outOfPossession.pressingIntensity}
          onChange={(v) => update("outOfPossession", { pressingIntensity: v })}
        />
        <Select
          label="압박 기준선"
          value={tactic.outOfPossession.pressingLine}
          options={["low", "mid", "high"] as const}
          onChange={(v) => update("outOfPossession", { pressingLine: v })}
        />
        <Select
          label="태클"
          value={tactic.outOfPossession.tackling}
          options={["stay_on_feet", "hard_tackle"] as const}
          onChange={(v) => update("outOfPossession", { tackling: v })}
        />
        <Slider
          label="수비 라인 높이"
          value={tactic.outOfPossession.defensiveLineHeight}
          onChange={(v) => update("outOfPossession", { defensiveLineHeight: v })}
        />
        <Select
          label="압박 트랩"
          value={tactic.outOfPossession.offsideTrap}
          options={["in", "out", "none"] as const}
          onChange={(v) => update("outOfPossession", { offsideTrap: v })}
        />
        <Toggle label="크로스 허용" value={tactic.outOfPossession.allowCrosses} onChange={(v) => update("outOfPossession", { allowCrosses: v })} />
      </div>
    </div>
  );
}
