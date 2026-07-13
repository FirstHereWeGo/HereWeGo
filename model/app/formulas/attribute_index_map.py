"""
선수 세부 속성(FM 미러링, 최대 36개) -> 합성 등급(attacking/defending/physical/mental, 0-100) 변환.

포지션 개별 튜닝 대신 8개 포지션 그룹 단위의 가중치만 관리한다.
"""
from app.schemas import AttributeBlock, GoalkeepingBlock, Player

ATTACKING_ATTRS = [
    "finishing", "dribbling", "technique", "longShots",
    "flair", "offTheBall", "pace", "acceleration", "composure", "firstTouch",
]
DEFENDING_ATTRS = [
    "marking", "tackling", "positioning", "anticipation",
    "bravery", "strength", "jumpingReach", "concentration", "aggression",
]
PHYSICAL_ATTRS = [
    "acceleration", "agility", "balance", "jumpingReach",
    "naturalFitness", "pace", "stamina", "strength",
]
MENTAL_ATTRS = [
    "aggression", "anticipation", "bravery", "composure", "concentration",
    "decisions", "determination", "flair", "leadership", "offTheBall",
    "positioning", "teamwork", "vision", "workRate",
]

# GK의 "수비 계열" 능력치는 필드선수와 다른 속성명을 쓴다.
GK_DEFENDING_ATTRS = ["reflexes", "handling", "commandOfArea", "oneOnOnes", "aerialReach"]
GK_ATTACKING_ATTRS = ["kicking"]

# 포지션 그룹별 attacking/defending 가중치. 1.0 = 그룹 보정 없음.
POSITION_GROUP_WEIGHTS: dict[str, dict[str, float]] = {
    "GK": {"attacking": 0.2, "defending": 1.4},
    "CB": {"attacking": 0.5, "defending": 1.3},
    "FB": {"attacking": 0.9, "defending": 1.0},
    "WB": {"attacking": 1.0, "defending": 0.9},
    "DM": {"attacking": 0.7, "defending": 1.2},
    "CM": {"attacking": 1.0, "defending": 1.0},
    "AM": {"attacking": 1.2, "defending": 0.7},
    "WG": {"attacking": 1.2, "defending": 0.6},
    "ST": {"attacking": 1.3, "defending": 0.5},
}


def _avg(attrs: dict, names: list[str]) -> float:
    values = [attrs[name] for name in names if name in attrs]
    if not values:
        return 10.0
    return sum(values) / len(values)


def _to_100(rating_1_20: float) -> float:
    return max(0.0, min(100.0, (rating_1_20 / 20.0) * 100.0))


class PlayerComposite:
    def __init__(self, attackingRating: float, defendingRating: float, physicalRating: float, mentalRating: float):
        self.attackingRating = attackingRating
        self.defendingRating = defendingRating
        self.physicalRating = physicalRating
        self.mentalRating = mentalRating


def compute_player_composite(player: Player) -> PlayerComposite:
    attrs = player.attributes.model_dump()
    weights = POSITION_GROUP_WEIGHTS.get(player.position, {"attacking": 1.0, "defending": 1.0})

    is_gk = isinstance(player.attributes, GoalkeepingBlock)
    if is_gk:
        attacking_raw = _avg(attrs, GK_ATTACKING_ATTRS)
        defending_raw = _avg(attrs, GK_DEFENDING_ATTRS)
    else:
        attacking_raw = _avg(attrs, ATTACKING_ATTRS)
        defending_raw = _avg(attrs, DEFENDING_ATTRS)

    physical_raw = _avg(attrs, PHYSICAL_ATTRS)
    mental_raw = _avg(attrs, MENTAL_ATTRS)

    attacking = _to_100(attacking_raw) * weights["attacking"]
    defending = _to_100(defending_raw) * weights["defending"]

    return PlayerComposite(
        attackingRating=max(0.0, min(100.0, attacking)),
        defendingRating=max(0.0, min(100.0, defending)),
        physicalRating=_to_100(physical_raw),
        mentalRating=_to_100(mental_raw),
    )


def compute_team_composite(players: list[Player]) -> PlayerComposite:
    if not players:
        return PlayerComposite(50.0, 50.0, 50.0, 50.0)
    composites = [compute_player_composite(p) for p in players]
    n = len(composites)
    return PlayerComposite(
        attackingRating=sum(c.attackingRating for c in composites) / n,
        defendingRating=sum(c.defendingRating for c in composites) / n,
        physicalRating=sum(c.physicalRating for c in composites) / n,
        mentalRating=sum(c.mentalRating for c in composites) / n,
    )
