from fastapi import APIRouter

from app.data.player_presets import PRESETS
from app.data.teams import TEAMS
from app.schemas.player import PlayerPreset
from app.schemas.win_probability import Team

router = APIRouter(prefix="/api")


@router.get("/teams")
def list_teams() -> list[Team]:
    return TEAMS


@router.get("/players/presets")
def list_player_presets() -> list[PlayerPreset]:
    return PRESETS
