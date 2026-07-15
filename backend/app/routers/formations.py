from fastapi import APIRouter

from app.data.formations import FORMATIONS
from app.schemas.formation import Formation

router = APIRouter(prefix="/api")


@router.get("/formations")
def list_formations() -> list[Formation]:
    return FORMATIONS
