// backend의 Pydantic 스키마와 1:1로 대응하는 TS 타입.
// frontend는 model과 직접 통신하지 않으므로 model 전용 스키마는 여기 없음.

export interface PlayerVector {
  x: number;
  y: number;
  directionDeg: number;
  speed: number;
}

export interface AttributeBlock {
  // Technical (14)
  corners: number;
  crossing: number;
  dribbling: number;
  finishing: number;
  firstTouch: number;
  freeKickTaking: number;
  heading: number;
  longShots: number;
  longThrows: number;
  marking: number;
  passing: number;
  penaltyTaking: number;
  tackling: number;
  technique: number;
  // Mental (14)
  aggression: number;
  anticipation: number;
  bravery: number;
  composure: number;
  concentration: number;
  decisions: number;
  determination: number;
  flair: number;
  leadership: number;
  offTheBall: number;
  positioning: number;
  teamwork: number;
  vision: number;
  workRate: number;
  // Physical (8)
  acceleration: number;
  agility: number;
  balance: number;
  jumpingReach: number;
  naturalFitness: number;
  pace: number;
  stamina: number;
  strength: number;
}

export interface GoalkeepingBlock {
  // Goalkeeping (6)
  reflexes: number;
  handling: number;
  commandOfArea: number;
  kicking: number;
  oneOnOnes: number;
  aerialReach: number;
  // Mental (14)
  aggression: number;
  anticipation: number;
  bravery: number;
  composure: number;
  concentration: number;
  decisions: number;
  determination: number;
  flair: number;
  leadership: number;
  offTheBall: number;
  positioning: number;
  teamwork: number;
  vision: number;
  workRate: number;
  // Physical (8)
  acceleration: number;
  agility: number;
  balance: number;
  jumpingReach: number;
  naturalFitness: number;
  pace: number;
  stamina: number;
  strength: number;
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
