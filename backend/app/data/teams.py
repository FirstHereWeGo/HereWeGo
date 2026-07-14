"""
국가대표팀 로스터 seed 데이터.

2026 월드컵 공식 명단(대한민국 27조, 남아공 40조 PDF) 기준 실제 이름/포지션/생년월일 기반 나이/키를
채워뒀다. 세부 스탯(AttributeBlock/GoalkeepingBlock)과 몸무게/양발 능력치(weight/rightFoot/leftFoot)는
아직 실제 값이 없어서 전부 placeholder(스탯 10, 몸무게 75kg, 양발 3/3)로 둔 상태 - 실제 값이 정해지면
각 선수의 해당 인자만 채우면 된다.

포지션은 원본 명단이 GK/DF/MF/FW로만 구분되어 있어서, 우리 스키마의 세부 포지션
(CB/FB/WB, DM/CM/AM, WG/ST)은 알려진 선수는 실제 주 포지션으로, 잘 알려지지 않은 선수는
합리적인 추정으로 채웠다 - 정확하지 않을 수 있으니 실제 스쿼드를 아는 사람이 검토/수정 권장.
나이는 2026-07-14 기준으로 계산.
"""
from app.schemas.player import AttributeBlock, GoalkeepingBlock, Player
from app.schemas.win_probability import Team

# 실제 스탯/몸무게/양발 데이터가 없는 선수에게 쓰는 placeholder
PLACEHOLDER_WEIGHT = 75
PLACEHOLDER_FOOT = 3

KOREA_REPUBLIC = Team(
    id="kor",
    name="Korea Republic",
    players=[
        Player(id="kor-1", name="KIM Seunggyu", position="GK", age=35, height=187, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=GoalkeepingBlock()),
        Player(id="kor-2", name="LEE Hanbeom", position="FB", age=24, height=188, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-3", name="LEE Gihyuk", position="CM", age=26, height=184, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-4", name="KIM Minjae", position="CB", age=29, height=190, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-5", name="KIM Taehyeon", position="CB", age=25, height=186, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-6", name="HWANG Inbeom", position="DM", age=29, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-7", name="SON Heungmin", position="ST", age=34, height=183, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-8", name="PAIK Seungho", position="CM", age=29, height=182, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-9", name="CHO Guesung", position="ST", age=28, height=188, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-10", name="LEE Jaesung", position="AM", age=33, height=180, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-11", name="HWANG Heechan", position="WG", age=30, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-12", name="SONG Bumkeun", position="GK", age=28, height=196, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=GoalkeepingBlock()),
        Player(id="kor-13", name="LEE Taeseok", position="FB", age=23, height=174, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-14", name="CHO Wije", position="CB", age=24, height=190, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-15", name="KIM Moonhwan", position="FB", age=30, height=173, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-16", name="PARK Jinseob", position="WB", age=30, height=183, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-17", name="BAE Junho", position="WG", age=22, height=180, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-18", name="OH Hyeongyu", position="ST", age=25, height=183, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-19", name="LEE Kangin", position="AM", age=25, height=174, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-20", name="YANG Hyunjun", position="WG", age=24, height=179, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-21", name="JO Hyeonwoo", position="GK", age=34, height=189, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=GoalkeepingBlock()),
        Player(id="kor-22", name="SEOL Youngwoo", position="FB", age=27, height=180, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-23", name="CASTROP Jens", position="FB", age=22, height=178, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-24", name="KIM Jingyu", position="CM", age=29, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-25", name="EOM Jisung", position="CM", age=24, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="kor-26", name="LEE Donggyeong", position="CM", age=28, height=175, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
    ],
)

SOUTH_AFRICA = Team(
    id="rsa",
    name="South Africa",
    players=[
        Player(id="rsa-1", name="WILLIAMS Ronwen", position="GK", age=34, height=184, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=GoalkeepingBlock()),
        Player(id="rsa-2", name="MATULUDI Thabang", position="FB", age=27, height=189, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-3", name="NDAMANE Khulumani", position="CB", age=22, height=183, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-4", name="MOKOENA Teboho", position="DM", age=29, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-5", name="MBATHA Thalente", position="CM", age=26, height=179, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-6", name="MODIBA Aubrey", position="FB", age=30, height=171, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-7", name="APPOLLIS Oswin", position="WG", age=24, height=171, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-8", name="MOREMI Tshepang", position="WG", age=25, height=169, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-9", name="FOSTER Lyle", position="ST", age=25, height=185, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-10", name="MOFOKENG Relebohile", position="WG", age=21, height=168, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-11", name="ZWANE Themba", position="AM", age=36, height=178, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-12", name="MASEKO Thapelo", position="ST", age=22, height=178, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-13", name="SITHOLE Sphephelo", position="CM", age=27, height=197, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-14", name="MBOKAZI Mbekezeli", position="CB", age=20, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-15", name="RAYNERS Iqraam", position="ST", age=30, height=174, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-16", name="CHAINE Sipho", position="GK", age=29, height=186, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=GoalkeepingBlock()),
        Player(id="rsa-17", name="MAKGOPA Evidence", position="ST", age=26, height=183, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-18", name="KABINI Samukele", position="FB", age=22, height=179, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-19", name="SIBISI Nkosinathi", position="CB", age=30, height=172, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-20", name="MUDAU Khuliso", position="FB", age=31, height=179, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-21", name="OKON Ime", position="CB", age=22, height=187, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-22", name="GOSS Ricardo", position="GK", age=32, height=181, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=GoalkeepingBlock()),
        Player(id="rsa-23", name="ADAMS Jayden", position="CM", age=25, height=177, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-24", name="MAKHANYA Olwethu", position="FB", age=22, height=185, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-25", name="SEBELEBELE Kamogelo", position="WG", age=23, height=166, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
        Player(id="rsa-26", name="CROSS Bradley", position="CB", age=25, height=175, weight=PLACEHOLDER_WEIGHT, rightFoot=PLACEHOLDER_FOOT, leftFoot=PLACEHOLDER_FOOT, attributes=AttributeBlock()),
    ],
)

TEAMS: list[Team] = [KOREA_REPUBLIC, SOUTH_AFRICA]


def get_team(team_id: str) -> Team | None:
    return next((t for t in TEAMS if t.id == team_id), None)
