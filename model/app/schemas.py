"""
model 서비스 Pydantic 스키마.
composite index 계산(속성→합성등급, 전술→지표)은 이 서비스 안에서만 이루어진다.
"""
from typing import Literal, Union

from pydantic import BaseModel, ConfigDict


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
    """필드선수 간소화 스탯 10개, 1~20."""

    model_config = ConfigDict(extra="forbid")

    pace: int = 10  # 주력
    agility: int = 10  # 민첩성
    strength: int = 10  # 몸싸움
    finishing: int = 10  # 골결정력
    dribbling: int = 10  # 드리블
    passing: int = 10  # 패스
    vision: int = 10  # 시야
    positioning: int = 10  # 위치선정
    tackling: int = 10  # 태클
    marking: int = 10  # 일대일 마크

    def __init__(
        self,
        pace: int = 10,
        agility: int = 10,
        strength: int = 10,
        finishing: int = 10,
        dribbling: int = 10,
        passing: int = 10,
        vision: int = 10,
        positioning: int = 10,
        tackling: int = 10,
        marking: int = 10,
        **kwargs,
    ):
        # seed 데이터(backend/app/data/teams.py)가 위 필드 순서대로 위치 인자를 넘기므로,
        # Pydantic v2 기본(키워드 전용)과 다르게 위치 인자도 받도록 열어둔다.
        super().__init__(
            pace=pace,
            agility=agility,
            strength=strength,
            finishing=finishing,
            dribbling=dribbling,
            passing=passing,
            vision=vision,
            positioning=positioning,
            tackling=tackling,
            marking=marking,
            **kwargs,
        )


class GoalkeepingBlock(BaseModel):
    """골키퍼는 세부 스탯 없이 종합 능력치 1개만 사용, 1~20."""

    model_config = ConfigDict(extra="forbid")

    overall: int = 10

    def __init__(self, overall: int = 10, **kwargs):
        super().__init__(overall=overall, **kwargs)


Position = Literal["GK", "CB", "FB", "WB", "DM", "CM", "AM", "WG", "ST"]


class Formation(BaseModel):
    id: str
    name: str
    positions: list[Position]
    # GK 제외 필드 플레이어 10명. 오른쪽부터 수비→미드필드→공격 라인 순, 각 라인은 오른쪽에서 왼쪽 순으로 나열.


class Player(BaseModel):
    id: str
    name: str
    positions: list[Position]
    age: int
    height: int  # cm
    leftFoot: int  # 1~5
    rightFoot: int  # 1~5
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
    goalkeeper: Player
    players: list[Player]  # 필드 플레이어 10명, formation.positions 순서와 1:1 대응
    formation: Formation
    tacticConfig: TacticConfig = TacticConfig()


class WinProbabilityInput(BaseModel):
    teamA: TeamMatchInput
    teamB: TeamMatchInput


class MatchSimulationInput(WinProbabilityInput):
    durationMinutes: int = 90  # 정규시간 90분 / 연장전후반 30분
    minuteOffset: int = 0  # 이벤트 표시용 시각 오프셋 (연장전후반은 90)


class TeamOutcome(BaseModel):
    win: float
    draw: float
    loss: float
    penalties: list[str] = []


class WinProbabilityOutput(BaseModel):
    teamA: TeamOutcome
    teamB: TeamOutcome


class MatchEvent(BaseModel):
    minute: int
    team: Literal["teamA", "teamB"]
    scorer: str


class MatchSimulationOutput(BaseModel):
    scoreA: int
    scoreB: int
    events: list[MatchEvent]


class MatchStatsInput(WinProbabilityInput):
    durationMinutes: int = 90  # 이 구간(하이드레이션 브레이크 사이)의 길이 - match-simulation과 동일한 개념


class StatRow(BaseModel):
    label: str
    a: float
    b: float


class StatSection(BaseModel):
    title: str
    rows: list[StatRow]


class MatchStatsOutput(BaseModel):
    sections: list[StatSection]
