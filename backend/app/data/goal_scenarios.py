"""
골 장면 리와인드용 직접 제작 시나리오 seed 데이터.

아직 실제 시나리오는 채우지 않았다 - 아래 GOAL_SCENARIOS 리스트에
app.schemas.scenarios.GoalScenario 형태로 항목을 추가하면 GET /api/scenarios/goal 에 바로 반영된다.
2~4개 정도의 시나리오로 시작하는 것을 권장.

예시 형태:
    {
        "id": "scenario-1",
        "name": "2010 결승 마지막 실점 장면",
        "shooter": {
            "player": {"id": "att1", "name": "Attacker", "position": "ST", "age": 26, "attributes": {...}},
            "vector": {"x": 95, "y": 34, "directionDeg": 0, "speed": 18},
            "isHeader": False,
        },
        "defenders": [
            {"player": {...}, "vector": {"x": 98, "y": 32, "directionDeg": 180, "speed": 10}},
        ],
        "goalkeeper": {"player": {...}, "vector": {"x": 104, "y": 34, "directionDeg": 180, "speed": 0}},
        "defendingTacticSubset": {"pressingIntensity": 60, "defensiveLineHeight": 55, "defensiveShape": "normal"},
    }
"""
from app.schemas.scenarios import GoalScenario

GOAL_SCENARIOS: list[GoalScenario] = []


def get_goal_scenario(scenario_id: str) -> GoalScenario | None:
    return next((s for s in GOAL_SCENARIOS if s.id == scenario_id), None)
