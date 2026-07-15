from fastapi import APIRouter, HTTPException

from app.data.formations import get_formation
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


def _find_player(players_by_id: dict[str, Player], player_id: str) -> Player:
    player = players_by_id.get(player_id)
    if player is None:
        raise HTTPException(status_code=400, detail=f"player not found in team: {player_id}")
    return player


def _resolve_team(config: TeamMatchConfig) -> dict:
    team = get_team(config.teamId)
    if team is None:
        raise HTTPException(status_code=404, detail=f"team not found: {config.teamId}")

    formation = get_formation(config.startingXI.formationId)
    if formation is None:
        raise HTTPException(status_code=404, detail=f"formation not found: {config.startingXI.formationId}")

    if len(config.startingXI.playerIds) != len(formation.positions):
        raise HTTPException(
            status_code=400,
            detail=f"startingXI.playerIds must have {len(formation.positions)} entries for formation {formation.id}",
        )

    overrides_by_player_id = {o.playerId: o for o in config.playerOverrides}
    players_by_id = {p.id: p for p in team.players}

    goalkeeper = _find_player(players_by_id, config.startingXI.goalkeeperId)
    outfield_players = [_find_player(players_by_id, pid) for pid in config.startingXI.playerIds]

    return {
        "goalkeeper": _apply_override(goalkeeper, overrides_by_player_id.get(goalkeeper.id)).model_dump(),
        "players": [
            _apply_override(p, overrides_by_player_id.get(p.id)).model_dump()
            for p in outfield_players
        ],
        "formation": formation.model_dump(),
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
