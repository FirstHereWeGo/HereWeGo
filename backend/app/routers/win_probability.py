from fastapi import APIRouter, HTTPException

from app.data.teams import get_team
from app.schemas.player import Player, PlayerOverride
from app.schemas.win_probability import TeamMatchConfig, WinProbabilityRequest, WinProbabilityResponse
from app.services import model_client

router = APIRouter(prefix="/api")


def _apply_override(player: Player, override: PlayerOverride | None) -> Player:
    if override is None:
        return player
    attrs = player.attributes.model_dump()
    attrs.update(override.attributeOverrides)
    age = override.ageOverride if override.ageOverride is not None else player.age
    return player.model_copy(update={"attributes": type(player.attributes)(**attrs), "age": age})


def _resolve_team(config: TeamMatchConfig) -> dict:
    team = get_team(config.teamId)
    if team is None:
        raise HTTPException(status_code=404, detail=f"team not found: {config.teamId}")

    overrides_by_player_id = {o.playerId: o for o in config.playerOverrides}
    players = [
        _apply_override(p, overrides_by_player_id.get(p.id))
        for p in team.players
    ]
    return {
        "players": [p.model_dump() for p in players],
        "tacticConfig": config.tacticConfig.model_dump(),
    }


@router.post("/win-probability")
async def win_probability(payload: WinProbabilityRequest) -> WinProbabilityResponse:
    model_payload = {
        "teamA": _resolve_team(payload.teamA),
        "teamB": _resolve_team(payload.teamB),
    }
    result = await model_client.call_win_probability(model_payload)
    return WinProbabilityResponse(**result)
