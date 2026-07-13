"""
국가대표팀 로스터 seed 데이터.

아직 실제 선수 데이터는 채우지 않았다 - 아래 TEAMS 리스트에 app.schemas.win_probability.Team
형태(딕셔너리 또는 Team(...) 인스턴스)로 팀을 추가하면 GET /api/teams 에 바로 반영된다.
선발 11명(GK 1 + 필드선수 10)부터 채우는 것을 권장하며, 나중에 스쿼드를 늘려도 스키마 변경은 필요 없다.

예시 형태 (실제로 채워 넣을 때 참고):
    {
        "id": "portugal",
        "name": "Portugal",
        "players": [
            {
                "id": "por-gk1", "name": "Goalkeeper Name", "position": "GK", "age": 30,
                "attributes": {
                    "reflexes": 15, "handling": 14, "commandOfArea": 13, "kicking": 12,
                    "oneOnOnes": 15, "aerialReach": 13,
                    "aggression": 10, "anticipation": 14, "bravery": 15, "composure": 14,
                    "concentration": 15, "decisions": 14, "determination": 15, "flair": 8,
                    "leadership": 13, "offTheBall": 8, "positioning": 15, "teamwork": 12,
                    "vision": 10, "workRate": 12,
                    "acceleration": 11, "agility": 13, "balance": 12, "jumpingReach": 14,
                    "naturalFitness": 14, "pace": 10, "stamina": 13, "strength": 13,
                },
            },
            # ... CB x2, FB/WB x2, DM/CM x2~3, AM x1~2, WG x2, ST x1 (포지션 구성은 자유)
        ],
    }
"""
from app.schemas.win_probability import Team

TEAMS: list[Team] = []


def get_team(team_id: str) -> Team | None:
    return next((t for t in TEAMS if t.id == team_id), None)
