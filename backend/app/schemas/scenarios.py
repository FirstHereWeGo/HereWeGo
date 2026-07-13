from typing import Literal, Union

from pydantic import BaseModel

from app.schemas.player import Player, PlayerVector


class ShooterInfo(BaseModel):
    player: Player
    vector: PlayerVector
    isHeader: bool = False


class VectorPlayer(BaseModel):
    player: Player
    vector: PlayerVector


class DefendingTacticSubset(BaseModel):
    pressingIntensity: float = 50
    defensiveLineHeight: float = 50
    defensiveShape: Literal["narrow", "normal", "wide"] = "normal"


class GoalScenario(BaseModel):
    id: str
    name: str
    shooter: ShooterInfo
    defenders: list[VectorPlayer] = []
    goalkeeper: Union[VectorPlayer, None] = None
    defendingTacticSubset: DefendingTacticSubset = DefendingTacticSubset()


class XgRewindRequest(BaseModel):
    shooter: ShooterInfo
    defenders: list[VectorPlayer] = []
    goalkeeper: Union[VectorPlayer, None] = None
    defensiveLineHeight: float = 50
    pressingIntensity: float = 50
    defensiveShape: Literal["narrow", "normal", "wide"] = "normal"


class XgRewindResponse(BaseModel):
    concedeProbability: float
