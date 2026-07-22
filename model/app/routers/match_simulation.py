from fastapi import APIRouter

from app.predictors.match_predictor.simulate import simulate_match
from app.schemas import MatchSimulationInput, MatchSimulationOutput

router = APIRouter()


@router.post("/match-simulation")
def match_simulation(payload: MatchSimulationInput) -> MatchSimulationOutput:
    return simulate_match(payload)
