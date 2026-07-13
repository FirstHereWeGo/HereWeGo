"""
model 서비스의 app/schemas.py와 필드명/구조를 동일하게 유지하는 선수 스키마.
backend는 이 스키마로 seed 데이터를 읽고 오버라이드를 적용한 뒤 model로 그대로 전달한다 (passthrough).
"""
from typing import Literal, Union

from pydantic import BaseModel


class PlayerVector(BaseModel):
    x: float
    y: float
    directionDeg: float = 0
    speed: float = 0


class AttributeBlock(BaseModel):
    # Technical (14)
    corners: int = 10
    crossing: int = 10
    dribbling: int = 10
    finishing: int = 10
    firstTouch: int = 10
    freeKickTaking: int = 10
    heading: int = 10
    longShots: int = 10
    longThrows: int = 10
    marking: int = 10
    passing: int = 10
    penaltyTaking: int = 10
    tackling: int = 10
    technique: int = 10
    # Mental (14)
    aggression: int = 10
    anticipation: int = 10
    bravery: int = 10
    composure: int = 10
    concentration: int = 10
    decisions: int = 10
    determination: int = 10
    flair: int = 10
    leadership: int = 10
    offTheBall: int = 10
    positioning: int = 10
    teamwork: int = 10
    vision: int = 10
    workRate: int = 10
    # Physical (8)
    acceleration: int = 10
    agility: int = 10
    balance: int = 10
    jumpingReach: int = 10
    naturalFitness: int = 10
    pace: int = 10
    stamina: int = 10
    strength: int = 10


class GoalkeepingBlock(BaseModel):
    # Goalkeeping (6)
    reflexes: int = 10
    handling: int = 10
    commandOfArea: int = 10
    kicking: int = 10
    oneOnOnes: int = 10
    aerialReach: int = 10
    # Mental (14)
    aggression: int = 10
    anticipation: int = 10
    bravery: int = 10
    composure: int = 10
    concentration: int = 10
    decisions: int = 10
    determination: int = 10
    flair: int = 10
    leadership: int = 10
    offTheBall: int = 10
    positioning: int = 10
    teamwork: int = 10
    vision: int = 10
    workRate: int = 10
    # Physical (8)
    acceleration: int = 10
    agility: int = 10
    balance: int = 10
    jumpingReach: int = 10
    naturalFitness: int = 10
    pace: int = 10
    stamina: int = 10
    strength: int = 10


Position = Literal["GK", "CB", "FB", "WB", "DM", "CM", "AM", "WG", "ST"]


class Player(BaseModel):
    id: str
    name: str
    position: Position
    age: int
    attributes: Union[GoalkeepingBlock, AttributeBlock]


class PlayerPreset(BaseModel):
    id: str
    label: str
    age: int
    attributes: AttributeBlock


class PlayerOverride(BaseModel):
    playerId: str
    attributeOverrides: dict[str, int] = {}
    ageOverride: Union[int, None] = None
