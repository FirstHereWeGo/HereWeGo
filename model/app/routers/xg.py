from fastapi import APIRouter

from app.formulas.xg import calculate_xg_scalar
from app.predictors.xg_predictor import predict_xg
from app.schemas import ShotInput, XgOutput, XgPositionsInput

router = APIRouter()


@router.post("/xg")
def calculate_xg(shot: ShotInput) -> XgOutput:
    return XgOutput(xg=calculate_xg_scalar(shot))


@router.post("/xg/positions")
def calculate_xg_positions(payload: XgPositionsInput) -> XgOutput:
    return XgOutput(xg=predict_xg(payload))
