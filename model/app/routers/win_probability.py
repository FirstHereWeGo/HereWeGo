from fastapi import APIRouter

from app.predictors.win_predictor.win_predictor import predict_win_probability
from app.schemas import WinProbabilityInput, WinProbabilityOutput

router = APIRouter()


@router.post("/win-probability")
def win_probability(payload: WinProbabilityInput) -> WinProbabilityOutput:
    return predict_win_probability(payload)
