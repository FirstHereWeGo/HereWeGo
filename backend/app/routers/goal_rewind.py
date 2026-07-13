from fastapi import APIRouter

from app.schemas.scenarios import XgRewindRequest, XgRewindResponse
from app.services import model_client

router = APIRouter(prefix="/api")


@router.post("/xg/rewind")
async def xg_rewind(payload: XgRewindRequest) -> XgRewindResponse:
    result = await model_client.call_xg_positions(payload.model_dump())
    return XgRewindResponse(concedeProbability=result["xg"])
