"""
팀(국가)별 기본 전술 프리셋.

사용자가 팀을 처음 선택했을 때 기본으로 깔리는 포메이션 + 전술 설정.
현재 팀이 한국/남아공 두 개뿐이라 팀별로 하나씩만 정의한다 - 수치는 실제 데이터가
아니라 각 팀의 대략적인 스타일(한국: 점유+로우프레스, 남아공: 다이렉트+역습)에 맞춰
대충 채운 값이다.
goalkeeperId/startingPlayerIds는 각 팀 국대 선발 라인업으로 채워뒀다.
"""
from app.schemas.tactic import (
    InPossession,
    OpponentHalf,
    OutOfPossession,
    TacticConfig,
    TacticStyle,
    TeamTacticPreset,
    Transitions,
)

TEAM_TACTIC_PRESETS: list[TeamTacticPreset] = [
    TeamTacticPreset(
        teamId="kor",
        formationId="3-4-3",
        goalkeeperId="kor-1",
        # positions 순서(CB,CB,CB,WB,CM,CM,WB,WG,ST,WG)와 1:1 대응:
        # 이한범,김민재,이기혁,설영우,황인범,백승호,이태석,이강인,오현규,황희찬
        startingPlayerIds=[
            "kor-2", "kor-4", "kor-3", "kor-22", "kor-6",
            "kor-8", "kor-13", "kor-19", "kor-18", "kor-11",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="possession", approach="attacking"),
            inPossession=InPossession(
                attackingWidth=65,
                buildupStyle="short",
                overlapLeft=True,
                overlapRight=True,
                targetCentral=False,
                targetWide=True,
                buildFromBack=True,
                passingDirectness=35,
                tempo=60,
                timeWasting=10,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="mixed",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
                exploitSetPieces=True,
                dribbleMore=True,
                playForFreedom=False,
            ),
            transitions=Transitions(
                pressAfterLoss=True,
                counterAfterWin=True,
                gkDistributeQuick=False,
                distributionMethod="short",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="normal",
                pressingIntensity=30,
                pressingLine="low",
                tackling="stay_on_feet",
                defensiveLineHeight=30,
                offsideTrap="out",
                allowCrosses=False,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="rsa",
        formationId="4-2-3-1",
        goalkeeperId="rsa-1",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 무다우,오콘,음보카지,모디바,시톨레,음바타,마세코,모포겡,아폴리스,막고파
        startingPlayerIds=[
            "rsa-20", "rsa-21", "rsa-14", "rsa-6", "rsa-13",
            "rsa-5", "rsa-12", "rsa-10", "rsa-7", "rsa-17",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="counter", approach="balanced"),
            inPossession=InPossession(
                attackingWidth=55,
                buildupStyle="direct",
                overlapLeft=False,
                overlapRight=True,
                targetCentral=True,
                targetWide=False,
                buildFromBack=False,
                passingDirectness=65,
                tempo=55,
                timeWasting=20,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="high",
                playCalmly=False,
                earlyCrosses=True,
                dontHoldBack=True,
                exploitSetPieces=True,
                dribbleMore=False,
                playForFreedom=False,
            ),
            transitions=Transitions(
                pressAfterLoss=False,
                counterAfterWin=True,
                gkDistributeQuick=True,
                distributionMethod="long",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="narrow",
                pressingIntensity=45,
                pressingLine="mid",
                tackling="hard_tackle",
                defensiveLineHeight=45,
                offsideTrap="none",
                allowCrosses=True,
            ),
        ),
    ),
]


def get_team_tactic_preset(team_id: str) -> TeamTacticPreset | None:
    return next((p for p in TEAM_TACTIC_PRESETS if p.teamId == team_id), None)
