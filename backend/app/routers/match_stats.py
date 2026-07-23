from fastapi import APIRouter

from app.schemas.win_probability import MatchStatsRequest, MatchStatsResponse
from app.services import model_client
from app.services.team_resolver import resolve_team

router = APIRouter(prefix="/api")


@router.post("/match-stats")
async def match_stats(payload: MatchStatsRequest) -> MatchStatsResponse:
    model_payload = {
        "teamA": resolve_team(payload.teamA),
        "teamB": resolve_team(payload.teamB),
        "durationMinutes": payload.durationMinutes,
    }
    result = await model_client.call_match_stats(model_payload)
    return MatchStatsResponse(**result)
