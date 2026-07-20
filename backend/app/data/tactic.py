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
    TeamTacticPreset(
        teamId="esp",
        formationId="4-3-3",
        goalkeeperId="esp-23",
        # positions 순서(FB,CB,CB,FB,DM,AM,AM,WG,ST,WG)와 1:1 대응:
        # 포로,쿠바르시,라포르트,쿠쿠레야,로드리,올모,파비안,야말,오야르사발,바에나
        startingPlayerIds=[
            "esp-12", "esp-22", "esp-14", "esp-24", "esp-16",
            "esp-10", "esp-8", "esp-19", "esp-21", "esp-15",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="possession", approach="attacking"),
            inPossession=InPossession(
                attackingWidth=60,
                buildupStyle="short",
                overlapLeft=True,
                overlapRight=True,
                targetCentral=False,
                targetWide=False,
                buildFromBack=True,
                passingDirectness=25,
                tempo=45,
                timeWasting=15,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="low",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
                exploitSetPieces=True,
                dribbleMore=True,
                playForFreedom=False,
            ),
            transitions=Transitions(
                pressAfterLoss=True,
                counterAfterWin=False,
                gkDistributeQuick=False,
                distributionMethod="short",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="normal",
                pressingIntensity=65,
                pressingLine="high",
                tackling="stay_on_feet",
                defensiveLineHeight=65,
                offsideTrap="out",
                allowCrosses=False,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="fra",
        formationId="4-2-3-1",
        goalkeeperId="fra-16",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 쿤데,우파메카노,살리바,디뉴,추아메니,라비오,뎀벨레,올리세,바르콜라,음바페
        startingPlayerIds=[
            "fra-5", "fra-4", "fra-17", "fra-3", "fra-8",
            "fra-14", "fra-7", "fra-11", "fra-12", "fra-10",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="attacking", approach="attacking"),
            inPossession=InPossession(
                attackingWidth=75,
                buildupStyle="direct",
                overlapLeft=True,
                overlapRight=True,
                targetCentral=False,
                targetWide=True,
                buildFromBack=False,
                passingDirectness=80,
                tempo=85,
                timeWasting=0,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="high",
                playCalmly=False,
                earlyCrosses=True,
                dontHoldBack=True,
                exploitSetPieces=True,
                dribbleMore=True,
                playForFreedom=True,
            ),
            transitions=Transitions(
                pressAfterLoss=True,
                counterAfterWin=True,
                gkDistributeQuick=True,
                distributionMethod="long",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="wide",
                pressingIntensity=80,
                pressingLine="high",
                tackling="hard_tackle",
                defensiveLineHeight=80,
                offsideTrap="in",
                allowCrosses=True,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="eng",
        formationId="4-2-3-1",
        goalkeeperId="eng-1",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 제임스,스톤스,게이,스펜스,라이스,앤더슨,로저스,벨링엄,고든,케인
        startingPlayerIds=[
            "eng-24", "eng-5", "eng-6", "eng-25", "eng-4",
            "eng-8", "eng-17", "eng-10", "eng-18", "eng-9",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="counter", approach="balanced"),
            inPossession=InPossession(
                attackingWidth=55,
                buildupStyle="mixed",
                overlapLeft=False,
                overlapRight=False,
                targetCentral=False,
                targetWide=True,
                buildFromBack=False,
                passingDirectness=55,
                tempo=55,
                timeWasting=25,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="mixed",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
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
                defensiveShape="normal",
                pressingIntensity=35,
                pressingLine="mid",
                tackling="stay_on_feet",
                defensiveLineHeight=35,
                offsideTrap="none",
                allowCrosses=False,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="arg",
        formationId="4-4-2",
        goalkeeperId="arg-23",
        # positions 순서(FB,CB,CB,FB,WG,CM,CM,WG,ST,ST)와 1:1 대응:
        # 몬티엘,로메로,리산드로마르티네스,탈리아피코,데파울,엔소페르난데스,마크알리스테르,니콜라스곤살레스,메시,알바레스
        startingPlayerIds=[
            "arg-4", "arg-13", "arg-6", "arg-3", "arg-7",
            "arg-24", "arg-20", "arg-15", "arg-10", "arg-9",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="possession", approach="balanced"),
            inPossession=InPossession(
                attackingWidth=55,
                buildupStyle="short",
                overlapLeft=False,
                overlapRight=True,
                targetCentral=False,
                targetWide=False,
                buildFromBack=True,
                passingDirectness=35,
                tempo=50,
                timeWasting=20,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="mixed",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
                exploitSetPieces=True,
                dribbleMore=True,
                playForFreedom=True,
            ),
            transitions=Transitions(
                pressAfterLoss=True,
                counterAfterWin=True,
                gkDistributeQuick=False,
                distributionMethod="short",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="normal",
                pressingIntensity=55,
                pressingLine="mid",
                tackling="stay_on_feet",
                defensiveLineHeight=45,
                offsideTrap="none",
                allowCrosses=False,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="bel",
        formationId="4-2-3-1",
        goalkeeperId="bel-1",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 카스타뉴,옹고이,메헬러,더카위퍼르,라스킨,파나컨,도쿠,더브라위너,트로사르,드케텔라에르
        startingPlayerIds=[
            "bel-21", "bel-25", "bel-4", "bel-5", "bel-23",
            "bel-20", "bel-11", "bel-7", "bel-10", "bel-17",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="possession", approach="attacking"),
            inPossession=InPossession(
                attackingWidth=70,
                buildupStyle="short",
                overlapLeft=True,
                overlapRight=True,
                targetCentral=True,
                targetWide=True,
                buildFromBack=True,
                passingDirectness=40,
                tempo=55,
                timeWasting=15,
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
                pressAfterLoss=False,
                counterAfterWin=False,
                gkDistributeQuick=False,
                distributionMethod="short",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="narrow",
                pressingIntensity=30,
                pressingLine="low",
                tackling="stay_on_feet",
                defensiveLineHeight=30,
                offsideTrap="none",
                allowCrosses=True,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="mar",
        formationId="4-2-3-1",
        goalkeeperId="mar-1",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 하키미,디오프,마즈라우이,살라에딘,부아디,엘아이나위,디아즈,우나히,엘칸누스,탈비
        startingPlayerIds=[
            "mar-2", "mar-14", "mar-3", "mar-26", "mar-6",
            "mar-24", "mar-10", "mar-8", "mar-23", "mar-7",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="possession", approach="attacking"),
            inPossession=InPossession(
                attackingWidth=75,
                buildupStyle="mixed",
                overlapLeft=False,
                overlapRight=True,
                targetCentral=False,
                targetWide=True,
                buildFromBack=True,
                passingDirectness=45,
                tempo=60,
                timeWasting=5,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="mixed",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=True,
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
                pressingIntensity=70,
                pressingLine="high",
                tackling="stay_on_feet",
                defensiveLineHeight=65,
                offsideTrap="out",
                allowCrosses=False,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="sui",
        formationId="4-2-3-1",
        goalkeeperId="sui-1",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 자카리아,엘베디,아칸지,로드리게스,프로일러,자카,은도이,리더,소우,엠볼로
        startingPlayerIds=[
            "sui-6", "sui-4", "sui-5", "sui-13", "sui-8",
            "sui-10", "sui-11", "sui-22", "sui-15", "sui-7",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="counter", approach="defensive"),
            inPossession=InPossession(
                attackingWidth=60,
                buildupStyle="direct",
                overlapLeft=False,
                overlapRight=False,
                targetCentral=False,
                targetWide=True,
                buildFromBack=False,
                passingDirectness=70,
                tempo=60,
                timeWasting=25,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="mixed",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
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
                defensiveShape="normal",
                pressingIntensity=35,
                pressingLine="mid",
                tackling="stay_on_feet",
                defensiveLineHeight=35,
                offsideTrap="none",
                allowCrosses=False,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="nor",
        formationId="4-1-2-3",
        goalkeeperId="nor-1",
        # positions 순서(FB,CB,CB,FB,DM,CM,CM,WG,ST,WG)와 1:1 대응:
        # 뤼에르손,아예르,헤겜,볼페,베르게,외데고르,베르그,쉴로트,홀란,누사
        startingPlayerIds=[
            "nor-26", "nor-3", "nor-17", "nor-5", "nor-8",
            "nor-10", "nor-6", "nor-7", "nor-9", "nor-20",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="counter", approach="balanced"),
            inPossession=InPossession(
                attackingWidth=60,
                buildupStyle="mixed",
                overlapLeft=True,
                overlapRight=True,
                targetCentral=True,
                targetWide=True,
                buildFromBack=True,
                passingDirectness=55,
                tempo=55,
                timeWasting=20,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="high",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
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
                pressingIntensity=30,
                pressingLine="low",
                tackling="stay_on_feet",
                defensiveLineHeight=30,
                offsideTrap="none",
                allowCrosses=True,
            ),
        ),
    ),
    TeamTacticPreset(
        teamId="por",
        formationId="4-2-3-1",
        goalkeeperId="por-1",
        # positions 순서(FB,CB,CB,FB,CM,CM,WG,AM,WG,ST)와 1:1 대응:
        # 멘드스,베이가,디아스,칸셀루,비티냐,네베스,펠릭스,페르난데스,네투,호날두
        startingPlayerIds=[
            "por-25", "por-13", "por-3", "por-20", "por-23",
            "por-15", "por-11", "por-8", "por-18", "por-7",
        ],
        tacticConfig=TacticConfig(
            style=TacticStyle(tacticStyle="possession", approach="attacking"),
            inPossession=InPossession(
                attackingWidth=45,
                buildupStyle="short",
                overlapLeft=True,
                overlapRight=True,
                targetCentral=True,
                targetWide=False,
                buildFromBack=True,
                passingDirectness=25,
                tempo=40,
                timeWasting=10,
            ),
            opponentHalf=OpponentHalf(
                crossingApproach="low",
                playCalmly=True,
                earlyCrosses=False,
                dontHoldBack=False,
                exploitSetPieces=True,
                dribbleMore=False,
                playForFreedom=False,
            ),
            transitions=Transitions(
                pressAfterLoss=False,
                counterAfterWin=False,
                gkDistributeQuick=False,
                distributionMethod="short",
            ),
            outOfPossession=OutOfPossession(
                defensiveShape="normal",
                pressingIntensity=40,
                pressingLine="mid",
                tackling="stay_on_feet",
                defensiveLineHeight=50,
                offsideTrap="none",
                allowCrosses=False,
            ),
        ),
    ),
]


def get_team_tactic_preset(team_id: str) -> TeamTacticPreset | None:
    return next((p for p in TEAM_TACTIC_PRESETS if p.teamId == team_id), None)
