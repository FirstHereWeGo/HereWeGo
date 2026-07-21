from fastapi import APIRouter

from app.predictors.match_predictor.simulate import simulate_match
from app.schemas import MatchSimulationOutput, WinProbabilityInput

router = APIRouter()


@router.post("/match-simulation")
def match_simulation(payload: WinProbabilityInput) -> MatchSimulationOutput:
    return simulate_match(payload)
