from fastapi import APIRouter

from app.schemas.win_probability import MatchSimulationResponse, WinProbabilityRequest
from app.services import model_client
from app.services.team_resolver import resolve_team

router = APIRouter(prefix="/api")


@router.post("/match-simulation")
async def match_simulation(payload: WinProbabilityRequest) -> MatchSimulationResponse:
    model_payload = {
        "teamA": resolve_team(payload.teamA),
        "teamB": resolve_team(payload.teamB),
    }
    result = await model_client.call_match_simulation(model_payload)
    return MatchSimulationResponse(**result)
