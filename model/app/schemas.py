"""
model 서비스 Pydantic 스키마.
composite index 계산(속성→합성등급, 전술→지표)은 이 서비스 안에서만 이루어진다.
"""
from typing import Literal, Union

from pydantic import BaseModel


class ShotInput(BaseModel):
    """기존 스칼라 defenderCount 기반 xG 입력 - 하위 호환용으로 유지."""

    x: float
    y: float
    defenderCount: int = 0
    isHeader: bool = False


class PitchPosition(BaseModel):
    x: float
    y: float


class PlayerVector(BaseModel):
    x: float
    y: float
    directionDeg: float = 0
    speed: float = 0


class AttributeBlock(BaseModel):
    # Technical (14)
    corners: int = 10
    crossing: int = 10
    dribbling: int = 10
    finishing: int = 10
    firstTouch: int = 10
    freeKickTaking: int = 10
    heading: int = 10
    longShots: int = 10
    longThrows: int = 10
    marking: int = 10
    passing: int = 10
    penaltyTaking: int = 10
    tackling: int = 10
    technique: int = 10
    # Mental (14)
    aggression: int = 10
    anticipation: int = 10
    bravery: int = 10
    composure: int = 10
    concentration: int = 10
    decisions: int = 10
    determination: int = 10
    flair: int = 10
    leadership: int = 10
    offTheBall: int = 10
    positioning: int = 10
    teamwork: int = 10
    vision: int = 10
    workRate: int = 10
    # Physical (8)
    acceleration: int = 10
    agility: int = 10
    balance: int = 10
    jumpingReach: int = 10
    naturalFitness: int = 10
    pace: int = 10
    stamina: int = 10
    strength: int = 10


class GoalkeepingBlock(BaseModel):
    # Goalkeeping (6)
    reflexes: int = 10
    handling: int = 10
    commandOfArea: int = 10
    kicking: int = 10
    oneOnOnes: int = 10
    aerialReach: int = 10
    # Mental (14)
    aggression: int = 10
    anticipation: int = 10
    bravery: int = 10
    composure: int = 10
    concentration: int = 10
    decisions: int = 10
    determination: int = 10
    flair: int = 10
    leadership: int = 10
    offTheBall: int = 10
    positioning: int = 10
    teamwork: int = 10
    vision: int = 10
    workRate: int = 10
    # Physical (8)
    acceleration: int = 10
    agility: int = 10
    balance: int = 10
    jumpingReach: int = 10
    naturalFitness: int = 10
    pace: int = 10
    stamina: int = 10
    strength: int = 10


Position = Literal["GK", "CB", "FB", "WB", "DM", "CM", "AM", "WG", "ST"]


class Player(BaseModel):
    id: str
    name: str
    position: Position
    age: int
    attributes: Union[GoalkeepingBlock, AttributeBlock]


# --- 전술 (FM 4개 섹션을 그대로 미러링) ---


class TacticStyle(BaseModel):
    tacticStyle: str = "possession"
    approach: str = "balanced"


class InPossession(BaseModel):
    attackingWidth: float = 50
    buildupStyle: Literal["short", "mixed", "direct"] = "mixed"
    overlapLeft: bool = False
    overlapRight: bool = False
    targetCentral: bool = False
    targetWide: bool = False
    buildFromBack: bool = False
    passingDirectness: float = 50
    tempo: float = 50
    timeWasting: float = 0


class OpponentHalf(BaseModel):
    crossingApproach: Literal["low", "mixed", "high"] = "mixed"
    playCalmly: bool = False
    earlyCrosses: bool = False
    dontHoldBack: bool = False
    exploitSetPieces: bool = False
    dribbleMore: bool = False
    playForFreedom: bool = False


class Transitions(BaseModel):
    pressAfterLoss: bool = False
    counterAfterWin: bool = False
    gkDistributeQuick: bool = False
    distributionMethod: Literal["short", "long"] = "short"


class OutOfPossession(BaseModel):
    defensiveShape: Literal["narrow", "normal", "wide"] = "normal"
    pressingIntensity: float = 50
    pressingLine: Literal["low", "mid", "high"] = "mid"
    tackling: Literal["stay_on_feet", "hard_tackle"] = "stay_on_feet"
    defensiveLineHeight: float = 50
    offsideTrap: Literal["in", "out", "none"] = "none"
    allowCrosses: bool = True


class TacticConfig(BaseModel):
    style: TacticStyle = TacticStyle()
    inPossession: InPossession = InPossession()
    opponentHalf: OpponentHalf = OpponentHalf()
    transitions: Transitions = Transitions()
    outOfPossession: OutOfPossession = OutOfPossession()


class TacticIndices(BaseModel):
    attackingWidth: float
    directness: float
    buildupTempo: float
    pressingIndex: float
    defensiveLineHeight: float
    defensiveCompactness: float
    riskTaking: float


# --- Feature 2: 골 장면 리와인드 ---


class VectorPlayer(BaseModel):
    player: Player
    vector: PlayerVector


class ShooterInput(BaseModel):
    player: Player
    vector: PlayerVector
    isHeader: bool = False


class XgPositionsInput(BaseModel):
    shooter: ShooterInput
    defenders: list[VectorPlayer] = []
    goalkeeper: Union[VectorPlayer, None] = None
    defensiveLineHeight: float = 50
    pressingIntensity: float = 50
    defensiveShape: Literal["narrow", "normal", "wide"] = "normal"


class XgOutput(BaseModel):
    xg: float


# --- Feature 1+3: 승부 리와인드 ---


class TeamMatchInput(BaseModel):
    players: list[Player]
    tacticConfig: TacticConfig = TacticConfig()


class WinProbabilityInput(BaseModel):
    teamA: TeamMatchInput
    teamB: TeamMatchInput


class TeamOutcome(BaseModel):
    win: float
    draw: float
    loss: float


class WinProbabilityOutput(BaseModel):
    teamA: TeamOutcome
    teamB: TeamOutcome
