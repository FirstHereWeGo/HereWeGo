"""
'레전드' 프리셋 - 각 국가대표팀 로스터(app/data/teams.py)의 실제 선수 한 명에 소속된
전성기 시절 프리셋. id는 "prime" + 기준 선수 id 형태로 짓는다 (예: 손흥민 kor-7 ->
primekor-7). 프론트에서 teamId로 필터링해 해당 선수 슬롯에만 playerOverrides로
원클릭 적용하는 용도. label에는 전성기 시즌만 적는다.

스탯(AttributeBlock/GoalkeepingBlock)은 손흥민만 실제 값으로 채웠고, 나머지는 전부 90으로
임시 채워뒀다 - 실제 전성기 스탯이 정해지면 해당 선수만 값을 바꾸면 GET /api/players/presets
결과에 바로 반영된다.
"""
from app.schemas.player import AttributeBlock, GoalkeepingBlock, PrimePlayer

PRESETS: list[PrimePlayer] = [
    # KOR
    PrimePlayer(id="primekor-7", teamId="kor", name="SON Heungmin", label="2021-2022", age=34, height=183, leftFoot=5, rightFoot=5, attributes=AttributeBlock(75, 75, 50, 90, 75, 60, 60, 90, 30, 25)),
    PrimePlayer(id="primekor-10", teamId="kor", name="LEE Jaesung", label="2022", age=33, height=180, leftFoot=5, rightFoot=3, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primekor-21", teamId="kor", name="JO Hyeonwoo", label="2019-2022", age=34, height=189, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),

    # RSA
    PrimePlayer(id="primersa-11", teamId="rsa", name="ZWANE Themba", label="2018-2022", age=36, height=178, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primersa-1", teamId="rsa", name="WILLIAMS Ronwen", label="2024", age=34, height=184, leftFoot=5, rightFoot=2, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),
    PrimePlayer(id="primersa-20", teamId="rsa", name="MUDAU Khuliso", label="2019-2021", age=31, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # ESP
    PrimePlayer(id="primeesp-14", teamId="esp", name="Aymeric Laporte", label="2017-2021", age=31, height=189, leftFoot=5, rightFoot=2, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primeesp-26", teamId="esp", name="Borja Iglesias", label="2019-2021", age=32, height=187, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primeesp-5", teamId="esp", name="Marcos Llorente", label="2020-2021", age=30, height=184, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # FRA
    PrimePlayer(id="primefra-13", teamId="fra", name="N'Golo Kante", label="2015-2018", age=34, height=168, leftFoot=2, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primefra-3", teamId="fra", name="Lucas Digne", label="2018-2021", age=32, height=178, leftFoot=5, rightFoot=2, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primefra-1", teamId="fra", name="Brice Samba", label="2022-2023", age=31, height=187, leftFoot=5, rightFoot=3, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),

    # ENG
    PrimePlayer(id="primeeng-14", teamId="eng", name="Jordan Henderson", label="2019-2020", age=35, height=182, leftFoot=2, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primeeng-9", teamId="eng", name="Harry Kane", label="2017-2021", age=32, height=188, leftFoot=4, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primeeng-1", teamId="eng", name="Jordan Pickford", label="2018", age=31, height=187, leftFoot=5, rightFoot=3, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),

    # ARG
    PrimePlayer(id="primearg-10", teamId="arg", name="Lionel Messi", label="2008-2015", age=38, height=171, leftFoot=5, rightFoot=3, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primearg-19", teamId="arg", name="Nicolas Otamendi", label="2016-2020", age=37, height=183, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primearg-23", teamId="arg", name="Emiliano Martinez", label="2022", age=33, height=193, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),

    # GER
    PrimePlayer(id="primeger-1", teamId="ger", name="Manuel Neuer", label="2013-2015", age=39, height=193, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),
    PrimePlayer(id="primeger-13", teamId="ger", name="Pascal Groß", label="2020-2022", age=34, height=181, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primeger-2", teamId="ger", name="Antonio Rüdiger", label="2021-2022", age=32, height=190, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # BRA
    PrimePlayer(id="primebra-6", teamId="bra", name="Alex Sandro", label="2017-2019", age=34, height=180, leftFoot=5, rightFoot=3, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primebra-5", teamId="bra", name="Casemiro", label="2017-2020", age=33, height=185, leftFoot=4, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primebra-10", teamId="bra", name="Neymar", label="2015-2017", age=33, height=175, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # BEL
    PrimePlayer(id="primebel-6", teamId="bel", name="Axel Witsel", label="2011-2017", age=36, height=186, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primebel-7", teamId="bel", name="Kevin De Bruyne", label="2019-2023", age=34, height=181, leftFoot=4, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primebel-1", teamId="bel", name="Thibaut Courtois", label="2018", age=33, height=200, leftFoot=5, rightFoot=3, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),

    # MAR
    PrimePlayer(id="primemar-1", teamId="mar", name="Yassine Bounou", label="2022", age=34, height=195, leftFoot=5, rightFoot=2, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),
    PrimePlayer(id="primemar-12", teamId="mar", name="Munir Mohand", label="2015-2019", age=36, height=190, leftFoot=2, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primemar-20", teamId="mar", name="Ayoub El Kaabi", label="2023-2024", age=32, height=182, leftFoot=5, rightFoot=2, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # SUI
    PrimePlayer(id="primesui-10", teamId="sui", name="Granit Xhaka", label="2023-2024", age=33, height=186, leftFoot=5, rightFoot=3, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primesui-13", teamId="sui", name="Ricardo Rodriguez", label="2014-2018", age=33, height=182, leftFoot=5, rightFoot=2, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primesui-16", teamId="sui", name="Christian Fassnacht", label="2018-2023", age=32, height=185, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # NOR
    PrimePlayer(id="primenor-1", teamId="nor", name="Orjan Nyland", label="2018-2020", age=35, height=192, leftFoot=2, rightFoot=5, attributes=GoalkeepingBlock(90, 90, 90, 90, 90)),
    PrimePlayer(id="primenor-7", teamId="nor", name="Alexander Sorloth", label="2023-2024", age=30, height=194, leftFoot=5, rightFoot=3, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primenor-14", teamId="nor", name="Fredrik Aursnes", label="2021-2022", age=30, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),

    # POR
    PrimePlayer(id="primepor-7", teamId="por", name="Cristiano Ronaldo", label="2007-2017", age=40, height=187, leftFoot=4, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primepor-10", teamId="por", name="Bernardo Silva", label="2022-2023", age=31, height=173, leftFoot=5, rightFoot=2, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
    PrimePlayer(id="primepor-20", teamId="por", name="Joao Cancelo", label="2021-2022", age=31, height=182, leftFoot=3, rightFoot=5, attributes=AttributeBlock(90, 90, 90, 90, 90, 90, 90, 90, 90, 90)),
]
