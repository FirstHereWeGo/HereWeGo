"""team_rating / 전술 조정 단계들이 공유하는 선수 그룹핑 + 평균 계산 헬퍼.

Backend는 이미 실제 Player 객체를 채워서 payload로 넘겨준다. 여기서는 그 값을
그대로 쓰고 다시 조회하지 않는다.
"""
from dataclasses import dataclass, field

from app.schemas import GoalkeepingBlock, Player, TeamMatchInput

# backend/app/data/teams.py의 능력치가 1~20에서 0~100 스케일로 바뀌었다.
# 이 폴더의 가중치/임계값(weights.py, tactics_*.py)은 전부 1~20 기준으로 캘리브레이션돼
# 있으므로, 여기서 한 번 나눠 원래 스케일로 되돌린 값만 아래 로직에 흘려보낸다.
ATTR_SCALE = 5


def avg(stat_getter, players: list[Player]) -> float:
    vals = [stat_getter(p) for p in players if stat_getter(p) is not None]
    return sum(vals) / len(vals) if vals else 0.0


def attr(player: Player, name: str):
    return getattr(getattr(player, "attributes", None), name, 0) / ATTR_SCALE


def gk_overall(player: Player | None) -> float:
    return getattr(getattr(player, "attributes", None), "overall", 0) / ATTR_SCALE


def _has_position(player: Player, positions: tuple[str, ...]) -> bool:
    return any(pos in positions for pos in getattr(player, "positions", []))


@dataclass
class TeamContext:
    players: list[Player]  # team_input.players 그대로 (GK 제외 11 - 1명 전원)
    gk: Player | None
    field_players: list[Player]  # players 중 실제 필드 플레이어(속성 블록/포지션 기준)만
    players_all: list[Player]  # field_players + gk
    midfielders: list[Player]
    attackers: list[Player]
    wingers: list[Player]
    defenders: list[Player]
    cbs: list[Player]
    # report.py가 채우는 전술 시너지/페널티 판정 기록 (승률 응답의 synergies/penalties로 나감)
    synergies: list[dict] = field(default_factory=list)
    penalty_codes: list[str] = field(default_factory=list)


def build_context(team_input: TeamMatchInput) -> TeamContext:
    players = list(team_input.players)

    if getattr(team_input, "goalkeeper", None):
        gk = team_input.goalkeeper
    else:
        gk = next((p for p in players if "GK" in getattr(p, "positions", [])), None)
    if gk is None and players:
        gk = players[0]

    field_players = [
        p
        for p in players
        if not isinstance(getattr(p, "attributes", None), GoalkeepingBlock) and "GK" not in getattr(p, "positions", [])
    ]

    return TeamContext(
        players=players,
        gk=gk,
        field_players=field_players,
        players_all=field_players + ([gk] if gk is not None else []),
        midfielders=[p for p in field_players if _has_position(p, ("DM", "CM", "AM"))],
        attackers=[p for p in field_players if _has_position(p, ("ST", "WG", "AM"))],
        wingers=[p for p in field_players if _has_position(p, ("WG", "WB", "FB"))],
        defenders=[p for p in field_players if _has_position(p, ("CB", "FB", "WB"))],
        cbs=[p for p in field_players if "CB" in getattr(p, "positions", [])],
    )
