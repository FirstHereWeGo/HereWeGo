from pydantic import BaseModel

from app.schemas.win_probability import TeamMatchConfig, TeamOutcome


class AiSuggestionRequest(BaseModel):
    teamA: TeamMatchConfig
    teamB: TeamMatchConfig
    winProb: TeamOutcome


class AiSuggestionResponse(BaseModel):
    suggestion: str
