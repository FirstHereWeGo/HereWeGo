from fastapi import APIRouter

from app.schemas.win_probability import WinProbabilityRequest, WinProbabilityResponse
from app.services import model_client
from app.services.team_resolver import resolve_team

router = APIRouter(prefix="/api")


@router.post("/win-probability")
async def win_probability(payload: WinProbabilityRequest) -> WinProbabilityResponse:
    model_payload = {
        "teamA": resolve_team(payload.teamA),
        "teamB": resolve_team(payload.teamB),
    }
    result = await model_client.call_win_probability(model_payload)
    return WinProbabilityResponse(**result)
