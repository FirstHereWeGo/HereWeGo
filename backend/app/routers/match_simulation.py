from fastapi import APIRouter

from app.schemas.win_probability import MatchSimulationRequest, MatchSimulationResponse
from app.services import model_client
from app.services.team_resolver import resolve_team

router = APIRouter(prefix="/api")


@router.post("/match-simulation")
async def match_simulation(payload: MatchSimulationRequest) -> MatchSimulationResponse:
    model_payload = {
        "teamA": resolve_team(payload.teamA),
        "teamB": resolve_team(payload.teamB),
        "durationMinutes": payload.durationMinutes,
        "minuteOffset": payload.minuteOffset,
    }
    result = await model_client.call_match_simulation(model_payload)
    return MatchSimulationResponse(**result)
