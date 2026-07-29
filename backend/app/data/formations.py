"""
포메이션 프리셋 카탈로그.

승률 계산 시 라인업 슬롯에 필요한 기본 포메이션 목록 - GET /api/formations 에 바로 반영된다.
각 Formation.positions는 GK를 제외한 필드 플레이어 10명을, 오른쪽 풀백/윙백부터 시작해서
수비 라인 -> 미드필드 라인(들) -> 공격 라인 순서로, 각 라인 내에서는 오른쪽에서 왼쪽 방향으로 나열한다.
"""
from app.schemas.formation import Formation

FORMATIONS: list[Formation] = [
    # 백3
    Formation(id="3-5-2", name="3-5-2", positions=["CB", "CB", "CB", "WB", "CM", "DM", "CM", "WB", "ST", "ST"]),
    Formation(id="3-4-3", name="3-4-3", positions=["CB", "CB", "CB", "WB", "CM", "CM", "WB", "WG", "ST", "WG"]),
    Formation(id="3-3-3-1", name="3-3-3-1", positions=["CB", "CB", "CB", "WB", "DM", "WB", "WG", "AM", "WG", "ST"]),
    Formation(id="3-4-1-2", name="3-4-1-2", positions=["CB", "CB", "CB", "WB", "CM", "CM", "WB", "AM", "ST", "ST"]),
    Formation(id="3-6-1", name="3-6-1", positions=["CB", "CB", "CB", "WB", "DM", "CM", "AM", "CM", "WB", "ST"]),
    Formation(id="3-4-2-1", name="3-4-2-1", positions=["CB", "CB", "CB", "WB", "CM", "CM", "WB", "AM", "AM", "ST"]),
    Formation(id="3-2-4-1", name="3-2-4-1", positions=["CB", "CB", "CB", "DM", "DM", "WG", "AM", "AM", "WG", "ST"]),
    # 백4
    Formation(id="4-4-2", name="4-4-2", positions=["FB", "CB", "CB", "FB", "WG", "CM", "CM", "WG", "ST", "ST"]),
    Formation(id="4-3-3", name="4-3-3", positions=["FB", "CB", "CB", "FB", "DM", "AM", "AM", "WG", "ST", "WG"]),
    Formation(id="4-2-3-1", name="4-2-3-1", positions=["FB", "CB", "CB", "FB", "CM", "CM", "WG", "AM", "WG", "ST"]),
    Formation(id="4-3-1-2", name="4-3-1-2", positions=["FB", "CB", "CB", "FB", "CM", "DM", "CM", "AM", "ST", "ST"]),
    Formation(id="4-2-2-2", name="4-2-2-2", positions=["FB", "CB", "CB", "FB", "DM", "DM", "AM", "AM", "ST", "ST"]),
    Formation(id="4-3-2-1", name="4-3-2-1", positions=["FB", "CB", "CB", "FB", "CM", "DM", "CM", "AM", "AM", "ST"]),
    Formation(id="4-1-4-1", name="4-1-4-1", positions=["FB", "CB", "CB", "FB", "DM", "WG", "CM", "CM", "WG", "ST"]),
    Formation(id="4-1-2-3", name="4-1-2-3", positions=["FB", "CB", "CB", "FB", "DM", "CM", "CM", "WG", "ST", "WG"]),
    Formation(id="4-5-1", name="4-5-1", positions=["FB", "CB", "CB", "FB", "WG", "CM", "DM", "CM", "WG", "ST"]),
    Formation(id="4-4-1-1", name="4-4-1-1", positions=["FB", "CB", "CB", "FB", "WG", "CM", "CM", "WG", "AM", "ST"]),
    Formation(id="4-6-0", name="4-6-0", positions=["FB", "CB", "CB", "FB", "WG", "CM", "DM", "CM", "AM", "WG"]),
    Formation(id="4-2-4", name="4-2-4", positions=["FB", "CB", "CB", "FB", "DM", "DM", "WG", "ST", "ST", "WG"]),
    # 백5
    Formation(id="5-3-2", name="5-3-2", positions=["WB", "CB", "CB", "CB", "WB", "CM", "DM", "CM", "ST", "ST"]),
    Formation(id="5-4-1", name="5-4-1", positions=["WB", "CB", "CB", "CB", "WB", "WG", "CM", "CM", "WG", "ST"]),
    Formation(id="5-2-3", name="5-2-3", positions=["WB", "CB", "CB", "CB", "WB", "DM", "DM", "WG", "ST", "WG"]),
]


def get_formation(formation_id: str) -> Formation | None:
    return next((f for f in FORMATIONS if f.id == formation_id), None)
