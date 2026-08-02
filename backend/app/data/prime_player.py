"""
'레전드' 프리셋 - 각 국가대표팀 로스터(app/data/teams.py)의 실제 선수 한 명에 소속된
전성기 시절 프리셋. id는 "prime" + 기준 선수 id 형태로 짓는다 (예: 손흥민 kor-7 ->
primekor-7). 프론트에서 teamId로 필터링해 해당 선수 슬롯에만 playerOverrides로
원클릭 적용하는 용도. label에는 전성기 시즌만 적는다.

스탯(AttributeBlock/GoalkeepingBlock)은 손흥민만 실제 값으로 수동 조정했고, 나머지는
teams.py에 있는 해당 선수의 원본 스탯을 그대로 임시로 채워뒀다 - 실제 전성기 스탯이
정해지면 해당 선수만 값을 바꾸면 GET /api/players/presets 결과에 바로 반영된다.
"""
from app.schemas.player import AttributeBlock, GoalkeepingBlock, PrimePlayer

PRESETS: list[PrimePlayer] = [
    # KOR
    PrimePlayer(id="primekor-7", teamId="kor", name="SON Heungmin", label="2021-2022", age=34, height=183, leftFoot=5, rightFoot=5, attributes=AttributeBlock(75, 75, 50, 90, 75, 60, 60, 90, 30, 25)),
    PrimePlayer(id="primekor-10", teamId="kor", name="LEE Jaesung", label="2022-2023", age=33, height=180, leftFoot=5, rightFoot=3, attributes=AttributeBlock(60, 75, 45, 55, 70, 70, 70, 65, 60, 50)),
    PrimePlayer(id="primekor-21", teamId="kor", name="JO Hyeonwoo", label="2017-2018", age=34, height=189, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(80, 65, 70, 70, 30)),

    # RSA
    PrimePlayer(id="primersa-11", teamId="rsa", name="ZWANE Themba", label="2018-2019", age=36, height=178, leftFoot=3, rightFoot=5, attributes=AttributeBlock(70, 70, 50, 55, 90, 75, 80, 60, 50, 45)),
    PrimePlayer(id="primersa-1", teamId="rsa", name="WILLIAMS Ronwen", label="2023-2024", age=34, height=184, leftFoot=5, rightFoot=2, attributes=GoalkeepingBlock(80, 75, 65, 70, 80)),
    PrimePlayer(id="primersa-20", teamId="rsa", name="MUDAU Khuliso", label="2020-2021", age=31, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(75, 55, 55, 30, 65, 60, 55, 70, 65, 45)),

    # ESP
    PrimePlayer(id="primeesp-14", teamId="esp", name="Aymeric Laporte", label="2020-2021", age=31, height=189, leftFoot=5, rightFoot=2, attributes=AttributeBlock(70, 65, 70, 40, 65, 80, 80, 80, 80, 80)),
    PrimePlayer(id="primeesp-26", teamId="esp", name="Borja Iglesias", label="2022-2023", age=32, height=187, leftFoot=3, rightFoot=5, attributes=AttributeBlock(75, 65, 80, 80, 65, 60, 60, 80, 40, 35)),
    PrimePlayer(id="primeesp-5", teamId="esp", name="Marcos Llorente", label="2021-2022", age=30, height=184, leftFoot=3, rightFoot=5, attributes=AttributeBlock(70, 55, 75, 65, 60, 75, 70, 65, 75, 55)),

    # FRA
    PrimePlayer(id="primefra-13", teamId="fra", name="N'Golo Kante", label="2017-2018", age=34, height=168, leftFoot=2, rightFoot=5, attributes=AttributeBlock(75, 75, 65, 35, 55, 75, 70, 75, 99, 60)),
    PrimePlayer(id="primefra-3", teamId="fra", name="Lucas Digne", label="2018-2019", age=32, height=178, leftFoot=5, rightFoot=2, attributes=AttributeBlock(75, 75, 65, 40, 65, 75, 65, 75, 70, 55)),
    PrimePlayer(id="primefra-1", teamId="fra", name="Brice Samba", label="2022-2023", age=31, height=187, leftFoot=5, rightFoot=3, attributes=GoalkeepingBlock(80, 60, 75, 65, 70)),

    # ENG
    PrimePlayer(id="primeeng-14", teamId="eng", name="Jordan Henderson", label="2019-2020", age=35, height=182, leftFoot=2, rightFoot=5, attributes=AttributeBlock(70, 65, 70, 45, 60, 80, 70, 75, 70, 75)),
    PrimePlayer(id="primeeng-9", teamId="eng", name="Harry Kane", label="2023-2024", age=32, height=188, leftFoot=4, rightFoot=5, attributes=AttributeBlock(70, 60, 80, 99, 70, 90, 95, 85, 45, 40)),
    PrimePlayer(id="primeeng-1", teamId="eng", name="Jordan Pickford", label="2017-2018", age=31, height=187, leftFoot=5, rightFoot=3, attributes=GoalkeepingBlock(85, 65, 75, 75, 75)),

    # ARG
    PrimePlayer(id="primearg-10", teamId="arg", name="Lionel Messi", label="2015-2016", age=38, height=171, leftFoot=5, rightFoot=3, attributes=AttributeBlock(75, 99, 45, 99, 99, 99, 99, 80, 35, 20)),
    PrimePlayer(id="primearg-19", teamId="arg", name="Nicolas Otamendi", label="2015-2016", age=37, height=183, leftFoot=3, rightFoot=5, attributes=AttributeBlock(70, 65, 80, 40, 45, 65, 65, 65, 80, 85)),
    PrimePlayer(id="primearg-23", teamId="arg", name="Emiliano Martinez", label="2021-2022", age=33, height=193, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(75, 75, 80, 80, 70)),

    # GER
    PrimePlayer(id="primeger-1", teamId="ger", name="Manuel Neuer", label="2015-2016", age=39, height=193, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(90, 99, 80, 90, 75)),
    PrimePlayer(id="primeger-13", teamId="ger", name="Pascal Groß", label="2022-2023", age=34, height=181, leftFoot=3, rightFoot=5, attributes=AttributeBlock(55, 60, 55, 55, 60, 85, 85, 70, 55, 60)),
    PrimePlayer(id="primeger-2", teamId="ger", name="Antonio Rüdiger", label="2022-2023", age=32, height=190, leftFoot=3, rightFoot=5, attributes=AttributeBlock(80, 45, 90, 35, 50, 60, 60, 75, 85, 80)),

    # BRA
    PrimePlayer(id="primebra-6", teamId="bra", name="Alex Sandro", label="2017-2018", age=34, height=180, leftFoot=5, rightFoot=3, attributes=AttributeBlock(80, 75, 75, 50, 75, 70, 60, 70, 75, 70)),
    PrimePlayer(id="primebra-5", teamId="bra", name="Casemiro", label="2021-2022", age=33, height=185, leftFoot=4, rightFoot=5, attributes=AttributeBlock(65, 60, 85, 55, 60, 75, 70, 85, 85, 70)),
    PrimePlayer(id="primebra-10", teamId="bra", name="Neymar", label="2016-2017", age=33, height=175, leftFoot=3, rightFoot=5, attributes=AttributeBlock(80, 95, 50, 80, 99, 80, 80, 95, 20, 20)),

    # BEL
    PrimePlayer(id="primebel-6", teamId="bel", name="Axel Witsel", label="2018-2019", age=36, height=186, leftFoot=3, rightFoot=5, attributes=AttributeBlock(60, 65, 80, 55, 70, 75, 70, 70, 70, 70)),
    PrimePlayer(id="primebel-7", teamId="bel", name="Kevin De Bruyne", label="2023-2024", age=34, height=181, leftFoot=4, rightFoot=5, attributes=AttributeBlock(70, 65, 65, 80, 80, 95, 99, 75, 45, 45)),
    PrimePlayer(id="primebel-1", teamId="bel", name="Thibaut Courtois", label="2023-2024", age=33, height=200, leftFoot=5, rightFoot=3, attributes=GoalkeepingBlock(95, 80, 85, 85, 65)),

    # MAR
    PrimePlayer(id="primemar-1", teamId="mar", name="Yassine Bounou", label="2022-2023", age=34, height=195, leftFoot=5, rightFoot=2, attributes=GoalkeepingBlock(80, 70, 85, 75, 50)),
    PrimePlayer(id="primemar-12", teamId="mar", name="Munir Mohand", label="2020-2021", age=36, height=190, leftFoot=2, rightFoot=5, attributes=GoalkeepingBlock(75, 65, 75, 70, 60)),
    PrimePlayer(id="primemar-20", teamId="mar", name="Ayoub El Kaabi", label="2023-2024", age=32, height=182, leftFoot=5, rightFoot=2, attributes=AttributeBlock(75, 60, 75, 80, 60, 55, 45, 90, 45, 45)),

    # SUI
    PrimePlayer(id="primesui-10", teamId="sui", name="Granit Xhaka", label="2023-2024", age=33, height=186, leftFoot=5, rightFoot=3, attributes=AttributeBlock(60, 55, 70, 55, 65, 90, 90, 70, 65, 60)),
    PrimePlayer(id="primesui-13", teamId="sui", name="Ricardo Rodriguez", label="2023-2024", age=33, height=182, leftFoot=5, rightFoot=2, attributes=AttributeBlock(60, 65, 65, 40, 50, 65, 60, 70, 75, 70)),
    PrimePlayer(id="primesui-16", teamId="sui", name="Christian Fassnacht", label="2022-2023", age=32, height=185, leftFoot=3, rightFoot=5, attributes=AttributeBlock(70, 60, 65, 65, 60, 60, 60, 80, 50, 35)),

    # NOR
    PrimePlayer(id="primenor-1", teamId="nor", name="Orjan Nyland", label="2019-2020", age=35, height=192, leftFoot=2, rightFoot=5, attributes=GoalkeepingBlock(75, 70, 70, 70, 65)),
    PrimePlayer(id="primenor-7", teamId="nor", name="Alexander Sorloth", label="2023-2024", age=30, height=194, leftFoot=5, rightFoot=3, attributes=AttributeBlock(75, 65, 85, 80, 70, 60, 65, 75, 30, 30)),
    PrimePlayer(id="primenor-14", teamId="nor", name="Fredrik Aursnes", label="2024-2025", age=30, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(70, 60, 60, 45, 65, 75, 75, 80, 65, 55)),

    # POR
    PrimePlayer(id="primepor-7", teamId="por", name="Cristiano Ronaldo", label="2015-2016", age=40, height=187, leftFoot=4, rightFoot=5, attributes=AttributeBlock(99, 70, 85, 99, 85, 75, 70, 99, 45, 15)),
    PrimePlayer(id="primepor-10", teamId="por", name="Bernardo Silva", label="2023-2024", age=31, height=173, leftFoot=5, rightFoot=2, attributes=AttributeBlock(70, 95, 45, 75, 85, 85, 85, 85, 40, 60)),
    PrimePlayer(id="primepor-20", teamId="por", name="Joao Cancelo", label="2022-2023", age=31, height=182, leftFoot=3, rightFoot=5, attributes=AttributeBlock(80, 80, 60, 55, 80, 80, 80, 70, 65, 45)),
]
