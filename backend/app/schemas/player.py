"""
model 서비스의 app/schemas.py와 필드명/구조를 동일하게 유지하는 선수 스키마.
backend는 이 스키마로 seed 데이터를 읽고 오버라이드를 적용한 뒤 model로 그대로 전달한다 (passthrough).
"""
from typing import Literal, Union

from pydantic import BaseModel, ConfigDict


class PlayerVector(BaseModel):
    x: float
    y: float
    directionDeg: float = 0
    speed: float = 0


class AttributeBlock(BaseModel):
    """필드선수 간소화 스탯 10개, 1~20."""

    model_config = ConfigDict(extra="forbid")

    pace: int = 10  # 주력
    agility: int = 10  # 민첩성
    strength: int = 10  # 몸싸움
    finishing: int = 10  # 골결정력
    dribbling: int = 10  # 드리블
    passing: int = 10  # 패스
    vision: int = 10  # 시야
    positioning: int = 10  # 위치선정
    tackling: int = 10  # 태클
    marking: int = 10  # 일대일 마크

    def __init__(
        self,
        pace: int = 10,
        agility: int = 10,
        strength: int = 10,
        finishing: int = 10,
        dribbling: int = 10,
        passing: int = 10,
        vision: int = 10,
        positioning: int = 10,
        tackling: int = 10,
        marking: int = 10,
        **kwargs,
    ):
        # seed 데이터(app/data/teams.py)가 위 필드 순서대로 위치 인자를 넘기므로,
        # Pydantic v2 기본(키워드 전용)과 다르게 위치 인자도 받도록 열어둔다.
        super().__init__(
            pace=pace,
            agility=agility,
            strength=strength,
            finishing=finishing,
            dribbling=dribbling,
            passing=passing,
            vision=vision,
            positioning=positioning,
            tackling=tackling,
            marking=marking,
            **kwargs,
        )


class GoalkeepingBlock(BaseModel):
    """골키퍼는 세부 스탯 없이 종합 능력치 1개만 사용, 1~20."""

    model_config = ConfigDict(extra="forbid")

    overall: int = 10

    def __init__(self, overall: int = 10, **kwargs):
        super().__init__(overall=overall, **kwargs)


Position = Literal["GK", "CB", "FB", "WB", "DM", "CM", "AM", "WG", "ST"]


class Player(BaseModel):
    id: str
    name: str
    positions: list[Position]
    age: int
    height: int  # cm
    leftFoot: int  # 1~5
    rightFoot: int  # 1~5
    attributes: Union[GoalkeepingBlock, AttributeBlock]


class PlayerPreset(BaseModel):
    id: str
    label: str
    age: int
    height: int  # cm
    weight: int  # kg
    leftFoot: int  # 1~5
    rightFoot: int  # 1~5
    attributes: AttributeBlock


class PlayerOverride(BaseModel):
    playerId: str
    attributeOverrides: dict[str, int] = {}
    ageOverride: Union[int, None] = None
