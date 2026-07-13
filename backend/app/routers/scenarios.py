from fastapi import APIRouter

from app.data.goal_scenarios import GOAL_SCENARIOS
from app.schemas.scenarios import GoalScenario

router = APIRouter(prefix="/api")


@router.get("/scenarios/goal")
def list_goal_scenarios() -> list[GoalScenario]:
    return GOAL_SCENARIOS
