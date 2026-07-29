from fastapi import APIRouter

from app.predictors.match_predictor.match_stats import generate_match_stats
from app.schemas import MatchStatsInput, MatchStatsOutput

router = APIRouter()


@router.post("/match-stats")
def match_stats(payload: MatchStatsInput) -> MatchStatsOutput:
    return generate_match_stats(payload)
