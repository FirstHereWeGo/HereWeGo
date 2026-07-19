"""backend seed 데이터를 사용해 /api/win-probability 반환값을 확인하는 스크립트."""
from __future__ import annotations

import json
import pathlib
import sys

import httpx

ROOT = pathlib.Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.data.tactic import get_team_tactic_preset
from app.schemas.win_probability import StartingXI, TeamMatchConfig, WinProbabilityRequest

BACKEND_URL = "http://localhost:4000/api/win-probability"


def build_team_match_config(team_id: str) -> TeamMatchConfig:
    preset = get_team_tactic_preset(team_id)
    if preset is None:
        raise RuntimeError(f"team tactic preset not found: {team_id}")

    return TeamMatchConfig(
        teamId=preset.teamId,
        startingXI=StartingXI(
            formationId=preset.formationId,
            goalkeeperId=preset.goalkeeperId,
            playerIds=list(preset.startingPlayerIds),
        ),
        tacticConfig=preset.tacticConfig,
        playerOverrides=[],
    )


def main() -> None:
    payload = WinProbabilityRequest(
        teamA=build_team_match_config("kor"),
        teamB=build_team_match_config("rsa"),
    )
    response = httpx.post(BACKEND_URL, json=payload.model_dump(), timeout=10)
    print(response.status_code)
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
