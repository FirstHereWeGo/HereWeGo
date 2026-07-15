"""model 서비스의 TacticConfig와 필드명/구조가 동일한 전술 스키마 (FM 패널 4개 섹션 미러링)."""
from typing import Literal

from pydantic import BaseModel


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


class TeamTacticPreset(BaseModel):
    teamId: str
    formationId: str
    goalkeeperId: str = ""  # 아직 미정이면 빈 문자열
    startingPlayerIds: list[str] = []  # 필드 플레이어, formationId의 positions 순서와 1:1 대응 - 아직 미정이면 빈 리스트
    tacticConfig: TacticConfig
