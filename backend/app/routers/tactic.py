from fastapi import APIRouter

from app.data.tactic import TEAM_TACTIC_PRESETS
from app.schemas.tactic import TeamTacticPreset

router = APIRouter(prefix="/api")


@router.get("/tactics")
def list_team_tactic_presets() -> list[TeamTacticPreset]:
    return TEAM_TACTIC_PRESETS
