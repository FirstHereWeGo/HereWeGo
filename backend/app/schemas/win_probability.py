from pydantic import BaseModel

from app.schemas.player import Player, PlayerOverride
from app.schemas.tactic import TacticConfig


class Team(BaseModel):
    id: str
    name: str
    manager: str | None = None
    players: list[Player] = []


class StartingXI(BaseModel):
    formationId: str
    goalkeeperId: str
    playerIds: list[str]  # 필드 플레이어 10명, 선택한 Formation.positions 순서와 1:1 대응


class TeamMatchConfig(BaseModel):
    teamId: str
    startingXI: StartingXI
    tacticConfig: TacticConfig = TacticConfig()
    playerOverrides: list[PlayerOverride] = []


class WinProbabilityRequest(BaseModel):
    teamA: TeamMatchConfig
    teamB: TeamMatchConfig


class TeamOutcome(BaseModel):
    win: float
    draw: float
    loss: float
    penalties: list[str] = []


class WinProbabilityResponse(BaseModel):
    teamA: TeamOutcome
    teamB: TeamOutcome
