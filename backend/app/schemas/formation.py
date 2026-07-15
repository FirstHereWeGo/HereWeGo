from pydantic import BaseModel

from app.schemas.player import Position


class Formation(BaseModel):
    id: str
    name: str
    positions: list[Position]
    # GK 제외 필드 플레이어 10명. 오른쪽부터 수비→미드필드→공격 라인 순, 각 라인은 오른쪽에서 왼쪽 순으로 나열.
