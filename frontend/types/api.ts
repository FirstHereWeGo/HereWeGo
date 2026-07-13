// backend의 Pydantic 스키마와 1:1로 대응하는 TS 타입.
// frontend는 model과 직접 통신하지 않으므로 model 전용 스키마는 여기 없음.

export interface PlayerVector {
  x: number;
  y: number;
  directionDeg: number;
  speed: number;
}

// 필드선수 간소화 스탯 10개, 1~20
export interface AttributeBlock {
  pace: number; // 주력
  agility: number; // 민첩성
  strength: number; // 몸싸움
  finishing: number; // 골결정력
  dribbling: number; // 드리블
  passing: number; // 패스
  vision: number; // 시야
  positioning: number; // 위치선정
  tackling: number; // 태클
  marking: number; // 일대일 마크
}

// 골키퍼는 세부 스탯 없이 종합 능력치 1개만 사용, 1~20
export interface GoalkeepingBlock {
  overall: number;
}

export type Position = "GK" | "CB" | "FB" | "WB" | "DM" | "CM" | "AM" | "WG" | "ST";

export interface Player {
  id: string;
  name: string;
  position: Position;
  age: number;
  attributes: AttributeBlock | GoalkeepingBlock;
}

export interface PlayerPreset {
  id: string;
  label: string;
  age: number;
  attributes: AttributeBlock;
}

export interface PlayerOverride {
  playerId: string;
  attributeOverrides: Partial<AttributeBlock>;
  ageOverride?: number;
}

// --- 전술 (FM 4개 섹션) ---

export interface TacticStyle {
  tacticStyle: string;
  approach: string;
}

export interface InPossession {
  attackingWidth: number;
  buildupStyle: "short" | "mixed" | "direct";
  overlapLeft: boolean;
  overlapRight: boolean;
  targetCentral: boolean;
  targetWide: boolean;
  buildFromBack: boolean;
  passingDirectness: number;
  tempo: number;
  timeWasting: number;
}

export interface OpponentHalf {
  crossingApproach: "low" | "mixed" | "high";
  playCalmly: boolean;
  earlyCrosses: boolean;
  dontHoldBack: boolean;
  exploitSetPieces: boolean;
  dribbleMore: boolean;
  playForFreedom: boolean;
}

export interface Transitions {
  pressAfterLoss: boolean;
  counterAfterWin: boolean;
  gkDistributeQuick: boolean;
  distributionMethod: "short" | "long";
}

export interface OutOfPossession {
  defensiveShape: "narrow" | "normal" | "wide";
  pressingIntensity: number;
  pressingLine: "low" | "mid" | "high";
  tackling: "stay_on_feet" | "hard_tackle";
  defensiveLineHeight: number;
  offsideTrap: "in" | "out" | "none";
  allowCrosses: boolean;
}

export interface TacticConfig {
  style: TacticStyle;
  inPossession: InPossession;
  opponentHalf: OpponentHalf;
  transitions: Transitions;
  outOfPossession: OutOfPossession;
}

export function defaultTacticConfig(): TacticConfig {
  return {
    style: { tacticStyle: "possession", approach: "balanced" },
    inPossession: {
      attackingWidth: 50,
      buildupStyle: "mixed",
      overlapLeft: false,
      overlapRight: false,
      targetCentral: false,
      targetWide: false,
      buildFromBack: false,
      passingDirectness: 50,
      tempo: 50,
      timeWasting: 0,
    },
    opponentHalf: {
      crossingApproach: "mixed",
      playCalmly: false,
      earlyCrosses: false,
      dontHoldBack: false,
      exploitSetPieces: false,
      dribbleMore: false,
      playForFreedom: false,
    },
    transitions: {
      pressAfterLoss: false,
      counterAfterWin: false,
      gkDistributeQuick: false,
      distributionMethod: "short",
    },
    outOfPossession: {
      defensiveShape: "normal",
      pressingIntensity: 50,
      pressingLine: "mid",
      tackling: "stay_on_feet",
      defensiveLineHeight: 50,
      offsideTrap: "none",
      allowCrosses: true,
    },
  };
}

// --- 승부 리와인드 (기능1+3 통합) ---

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export interface TeamMatchConfig {
  teamId: string;
  tacticConfig: TacticConfig;
  playerOverrides: PlayerOverride[];
}

export interface WinProbabilityRequest {
  teamA: TeamMatchConfig;
  teamB: TeamMatchConfig;
}

export interface TeamOutcome {
  win: number;
  draw: number;
  loss: number;
}

export interface WinProbabilityResponse {
  teamA: TeamOutcome;
  teamB: TeamOutcome;
}

// --- 골 장면 리와인드 ---

export interface ShooterInfo {
  player: Player;
  vector: PlayerVector;
  isHeader: boolean;
}

export interface VectorPlayer {
  player: Player;
  vector: PlayerVector;
}

export interface DefendingTacticSubset {
  pressingIntensity: number;
  defensiveLineHeight: number;
  defensiveShape: "narrow" | "normal" | "wide";
}

export interface GoalScenario {
  id: string;
  name: string;
  shooter: ShooterInfo;
  defenders: VectorPlayer[];
  goalkeeper: VectorPlayer | null;
  defendingTacticSubset: DefendingTacticSubset;
}

export interface XgRewindRequest {
  shooter: ShooterInfo;
  defenders: VectorPlayer[];
  goalkeeper: VectorPlayer | null;
  defensiveLineHeight: number;
  pressingIntensity: number;
  defensiveShape: "narrow" | "normal" | "wide";
}

export interface XgRewindResponse {
  concedeProbability: number;
}
