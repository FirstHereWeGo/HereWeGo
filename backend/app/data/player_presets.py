"""
'레전드' 프리셋 - 전성기 스탯 블록. 특정 팀에 종속되지 않으며, 프론트에서 로스터의
아무 슬롯에나 playerOverrides로 원클릭 적용한다.

아직 실제 스탯은 채우지 않았다 - 아래 PRESETS 리스트에
app.schemas.player.PlayerPreset 형태로 항목을 추가하면 GET /api/players/presets 에 바로 반영된다.
초기 2개(전성기 메시, 전성기 호날두)부터 채우는 것을 권장.
"""
from app.schemas.player import PlayerPreset

PRESETS: list[PlayerPreset] = []
