from pydantic import BaseModel

from app.schemas.player import Player, PlayerOverride
from app.schemas.tactic import TacticConfig


class Team(BaseModel):
    id: str
    name: str
    players: list[Player] = []


class TeamMatchConfig(BaseModel):
    teamId: str
    tacticConfig: TacticConfig = TacticConfig()
    playerOverrides: list[PlayerOverride] = []


class WinProbabilityRequest(BaseModel):
    teamA: TeamMatchConfig
    teamB: TeamMatchConfig


class TeamOutcome(BaseModel):
    win: float
    draw: float
    loss: float


class WinProbabilityResponse(BaseModel):
    teamA: TeamOutcome
    teamB: TeamOutcome
