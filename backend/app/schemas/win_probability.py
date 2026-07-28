from typing import Literal

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


class MatchSimulationRequest(WinProbabilityRequest):
    durationMinutes: int = 90  # 정규시간 90분 / 연장전후반 30분
    minuteOffset: int = 0  # 이벤트 표시용 시각 오프셋 (연장전후반은 90)


class SynergyItem(BaseModel):
    """model이 계산한 전술 시너지/페널티 판정 1건 (model/app/schemas.py와 손으로 미러링)."""

    key: str
    category: Literal["style", "inPossession", "opponentHalf", "transitions", "outOfPossession", "squad"]
    tone: Literal["good", "bad"]
    label: str
    detail: str = ""


class TeamOutcome(BaseModel):
    win: float
    draw: float
    loss: float
    penalties: list[str] = []
    synergies: list[SynergyItem] = []
    styleLabel: str = ""
    styleFit: int = 50


class WinProbabilityResponse(BaseModel):
    teamA: TeamOutcome
    teamB: TeamOutcome


class MatchEvent(BaseModel):
    minute: int
    team: Literal["teamA", "teamB"]
    scorer: str


class MatchSimulationResponse(BaseModel):
    scoreA: int
    scoreB: int
    events: list[MatchEvent]


class MatchStatsRequest(WinProbabilityRequest):
    durationMinutes: int = 90  # 이 구간(하이드레이션 브레이크 사이)의 길이


class StatRow(BaseModel):
    label: str
    a: float
    b: float


class StatSection(BaseModel):
    title: str
    rows: list[StatRow]


class MomentumPoint(BaseModel):
    minute: int
    value: float


class MatchStatsResponse(BaseModel):
    sections: list[StatSection]
    momentum: list[MomentumPoint]
