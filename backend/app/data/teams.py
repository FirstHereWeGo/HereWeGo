"""
국가대표팀 로스터 seed 데이터.

2026 월드컵 공식 명단(대한민국 27조, 남아공 40조 PDF) 기준 실제 이름/포지션/생년월일 기반 나이/키를
채워뒀다. 세부 스탯(AttributeBlock/GoalkeepingBlock)과 양발 능력치(rightFoot/leftFoot)는
아직 실제 값이 없어서 전부 placeholder(스탯 10, 양발 3/3)로 둔 상태 - 실제 값이 정해지면
각 선수의 해당 인자만 채우면 된다.

포지션은 원본 명단이 GK/DF/MF/FW로만 구분되어 있어서, 우리 스키마의 세부 포지션
(CB/FB/WB, DM/CM/AM, WG/ST)은 알려진 선수는 실제 주 포지션으로, 잘 알려지지 않은 선수는
합리적인 추정으로 채웠다 - 정확하지 않을 수 있으니 실제 스쿼드를 아는 사람이 검토/수정 권장.
나이는 2026-07-14 기준으로 계산.
"""
from app.schemas.player import AttributeBlock, GoalkeepingBlock, Player
from app.schemas.win_probability import Team

# 실제 스탯/양발 데이터가 없는 선수에게 쓰는 placeholder
PLACEHOLDER_FOOT = 3

KOREA_REPUBLIC = Team(
    id="kor",
    name="Korea Republic",
    players=[
        Player(id="kor-1", name="KIM Seunggyu", positions=["GK"], age=35, height=187, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(13)),
        Player(id="kor-2", name="LEE Hanbeom", positions=["CB"], age=24, height=188, leftFoot=3, rightFoot=5, attributes=AttributeBlock(12, 10, 14, 8, 10, 13, 13, 12, 12, 13)),
        Player(id="kor-3", name="LEE Gihyuk", positions=["CM, CB, FB"], age=26, height=184, leftFoot=5, rightFoot=3, attributes=AttributeBlock(10, 10, 10, 7, 9, 14, 13, 14, 10, 9)),
        Player(id="kor-4", name="KIM Minjae", positions=["CB"], age=29, height=190, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 12, 16, 6, 10, 14, 13, 16, 16, 16)),
        Player(id="kor-5", name="KIM Taehyeon", positions=["CB"], age=25, height=186, leftFoot=5, rightFoot=2, attributes=AttributeBlock(14, 12, 13, 6, 11, 12, 12, 13, 13, 15)),
        Player(id="kor-6", name="HWANG Inbeom", positions=["CM, DM"], age=29, height=177, leftFoot=3, rightFoot=5, attributes=AttributeBlock(11, 14, 8, 9, 14, 16, 14, 14, 8, 9)),
        Player(id="kor-7", name="SON Heungmin", positions=["AM, ST, WG"], age=34, height=183, leftFoot=5, rightFoot=5, attributes=AttributeBlock(15, 14, 10, 16, 11, 12, 12, 17, 6, 5)),
        Player(id="kor-8", name="PAIK Seungho", positions=["DM, CM"], age=29, height=182, leftFoot=4, rightFoot=5, attributes=AttributeBlock(12, 13, 11, 9, 12, 14, 13, 12, 11, 8)),
        Player(id="kor-9", name="CHO Guesung", positions=["ST"], age=28, height=188, leftFoot=4, rightFoot=5, attributes=AttributeBlock(12, 11, 14, 14, 12, 11, 12, 12, 5, 10)),
        Player(id="kor-10", name="LEE Jaesung", positions=["AM, CM, WG"], age=33, height=180, leftFoot=5, rightFoot=3, attributes=AttributeBlock(12, 15, 9, 11, 13, 13, 13, 13, 12, 10)),
        Player(id="kor-11", name="HWANG Heechan", positions=["WG, ST, AM"], age=30, height=177, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 14, 11, 15, 14, 11, 12, 13, 8, 6)),
        Player(id="kor-12", name="SONG Bumkeun", positions=["GK"], age=28, height=196, leftFoot=2, rightFoot=5, attributes=GoalkeepingBlock(12)),
        Player(id="kor-13", name="LEE Taeseok", positions=["FB, WB"], age=23, height=174, leftFoot=2, rightFoot=5, attributes=AttributeBlock(12, 11, 10, 11, 10, 11, 11, 12, 12, 12)),
        Player(id="kor-14", name="CHO Wije", positions=["CB"], age=24, height=190, leftFoot=3, rightFoot=5, attributes=AttributeBlock(11, 10, 11, 8, 8, 10, 10, 14, 11, 13)),
        Player(id="kor-15", name="KIM Moonhwan", positions=["FB, WB"], age=30, height=173, leftFoot=3, rightFoot=5, attributes=AttributeBlock(13, 14, 12, 8, 11, 12, 12, 12, 12, 13)),
        Player(id="kor-16", name="PARK Jinseob", positions=["DM, CB"], age=30, height=183, leftFoot=3, rightFoot=5, attributes=AttributeBlock(13, 13, 13, 9, 11, 13, 12, 14, 11, 13)),
        Player(id="kor-17", name="BAE Junho", positions=["AM, WG"], age=22, height=180, leftFoot=2, rightFoot=5, attributes=AttributeBlock(11, 15, 9, 7, 13, 12, 12, 12, 7, 7)),
        Player(id="kor-18", name="OH Hyeongyu", positions=["ST"], age=25, height=183, leftFoot=4, rightFoot=5, attributes=AttributeBlock(12, 14, 14, 13, 12, 9, 11, 12, 7, 5)),
        Player(id="kor-19", name="LEE Kangin", positions=["AM, CM"], age=25, height=174, leftFoot=5, rightFoot=4, attributes=AttributeBlock(13, 16, 10, 13, 16, 15, 15, 14, 6, 6)),
        Player(id="kor-20", name="YANG Hyunjun", positions=["WG, WB"], age=24, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 13, 7, 9, 14, 12, 11, 12, 10, 8)),
        Player(id="kor-21", name="JO Hyeonwoo", positions=["GK"], age=34, height=189, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(13)),
        Player(id="kor-22", name="SEOL Youngwoo", positions=["FB, WB"], age=27, height=180, leftFoot=4, rightFoot=5, attributes=AttributeBlock(12, 12, 12, 8, 11, 11, 13, 13, 13, 13)),
        Player(id="kor-23", name="CASTROP Jens", positions=["FB, WB, CM, DM"], age=22, height=178, leftFoot=3, rightFoot=5, attributes=AttributeBlock(15, 14, 11, 8, 14, 11, 11, 11, 16, 11)),
        Player(id="kor-24", name="KIM Jingyu", positions=["CM, AM"], age=29, height=177, leftFoot=3, rightFoot=5, attributes=AttributeBlock(12, 13, 11, 11, 13, 15, 15, 13, 11, 6)),
        Player(id="kor-25", name="EOM Jisung", positions=["WG, AM"], age=24, height=177, leftFoot=4, rightFoot=5, attributes=AttributeBlock(13, 13, 9, 11, 14, 11, 11, 13, 7, 9)),
        Player(id="kor-26", name="LEE Donggyeong", positions=["AM, CM, WG"], age=28, height=175, leftFoot=5, rightFoot=3, attributes=AttributeBlock(13, 15, 10, 12, 14, 14, 14, 12, 10, 9)),
    ],
)

SOUTH_AFRICA = Team(
    id="rsa",
    name="South Africa",
    players=[
        Player(id="rsa-1", name="WILLIAMS Ronwen", positions=["GK"], age=34, height=184, leftFoot=5, rightFoot=2, attributes=GoalkeepingBlock(14)),
        Player(id="rsa-2", name="MATULUDI Thabang", positions=["FB"], age=27, height=189, leftFoot=3, rightFoot=5, attributes=AttributeBlock(13, 11, 9, 8, 11, 8, 9, 13, 14, 12)),
        Player(id="rsa-3", name="NDAMANE Khulumani", positions=["CB"], age=22, height=183, leftFoot=5, rightFoot=3, attributes=AttributeBlock(14, 14, 8, 2, 1, 10, 5, 14, 12, 14)),
        Player(id="rsa-4", name="MOKOENA Teboho", positions=["DM, CM"], age=29, height=177, leftFoot=3, rightFoot=5, attributes=AttributeBlock(12, 10, 10, 10, 11, 16, 13, 15, 9, 11)),
        Player(id="rsa-5", name="MBATHA Thalente", positions=["DM, CM"], age=26, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(13, 11, 13, 11, 11, 13, 13, 10, 8, 9)),
        Player(id="rsa-6", name="MODIBA Aubrey", positions=["FB, WB"], age=30, height=171, leftFoot=5, rightFoot=3, attributes=AttributeBlock(14, 13, 6, 7, 13, 11, 10, 13, 11, 11)),
        Player(id="rsa-7", name="APPOLLIS Oswin", positions=["WG, AM"], age=24, height=171, leftFoot=5, rightFoot=5, attributes=AttributeBlock(13, 15, 3, 11, 16, 13, 15, 12, 7, 7)),
        Player(id="rsa-8", name="MOREMI Tshepang", positions=["WG, AM"], age=25, height=169, leftFoot=5, rightFoot=3, attributes=AttributeBlock(17, 11, 7, 12, 12, 11, 12, 13, 5, 5)),
        Player(id="rsa-9", name="FOSTER Lyle", positions=["ST"], age=25, height=185, leftFoot=3, rightFoot=5, attributes=AttributeBlock(13, 11, 15, 14, 13, 11, 12, 12, 6, 6)),
        Player(id="rsa-10", name="MOFOKENG Relebohile", positions=["WG, AM"], age=21, height=168, leftFoot=4, rightFoot=5, attributes=AttributeBlock(14, 11, 5, 9, 14, 12, 12, 10, 4, 7)),
        Player(id="rsa-11", name="ZWANE Themba", positions=["AM"], age=36, height=178, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 12, 10, 11, 17, 15, 16, 12, 10, 9)),
        Player(id="rsa-12", name="MASEKO Thapelo", positions=["WG, AM"], age=22, height=178, leftFoot=5, rightFoot=2, attributes=AttributeBlock(16, 11, 6, 8, 14, 10, 6, 10, 4, 7)),
        Player(id="rsa-13", name="SITHOLE Sphephelo", positions=["CM, DM"], age=27, height=187, leftFoot=3, rightFoot=5, attributes=AttributeBlock(12, 8, 12, 8, 11, 12, 10, 13, 14, 11)),
        Player(id="rsa-14", name="MBOKAZI Mbekezeli", positions=["CB"], age=20, height=177, leftFoot=5, rightFoot=3, attributes=AttributeBlock(11, 8, 15, 9, 13, 16, 16, 14, 13, 12)),
        Player(id="rsa-15", name="RAYNERS Iqraam", positions=["ST"], age=30, height=174, leftFoot=3, rightFoot=5, attributes=AttributeBlock(16, 11, 8, 15, 13, 13, 12, 11, 6, 5)),
        Player(id="rsa-16", name="CHAINE Sipho", positions=["GK"], age=29, height=186, leftFoot=2, rightFoot=5, attributes=GoalkeepingBlock(12)),
        Player(id="rsa-17", name="MAKGOPA Evidence", positions=["ST"], age=26, height=183, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 10, 13, 14, 11, 10, 9, 11, 7, 7)),
        Player(id="rsa-18", name="KABINI Samukele", positions=["FB, WB"], age=22, height=179, leftFoot=5, rightFoot=3, attributes=AttributeBlock(12, 12, 11, 8, 9, 12, 11, 12, 12, 12)),
        Player(id="rsa-19", name="SIBISI Nkosinathi", positions=["CB"], age=30, height=172, leftFoot=3, rightFoot=5, attributes=AttributeBlock(11, 12, 9, 7, 7, 10, 9, 12, 13, 12)),
        Player(id="rsa-20", name="MUDAU Khuliso", positions=["FB, WB"], age=31, height=179, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 11, 11, 6, 13, 12, 11, 14, 13, 9)),
        Player(id="rsa-21", name="OKON Ime", positions=["CB"], age=22, height=187, leftFoot=2, rightFoot=5, attributes=AttributeBlock(15, 12, 14, 6, 10, 11, 10, 12, 12, 13)),
        Player(id="rsa-22", name="GOSS Ricardo", positions=["GK"], age=32, height=181, leftFoot=3, rightFoot=5, attributes=GoalkeepingBlock(11)),
        Player(id="rsa-23", name="ADAMS Jayden", positions=["AM, CM"], age=25, height=177, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 12, 12, 7, 11, 13, 9, 11, 10, 10)),
        Player(id="rsa-24", name="MAKHANYA Olwethu", positions=["CB"], age=22, height=185, leftFoot=2, rightFoot=5, attributes=AttributeBlock(11, 12, 14, 8, 10, 11, 11, 13, 12, 11)),
        Player(id="rsa-25", name="SEBELEBELE Kamogelo", positions=["WG, AM, CM"], age=23, height=166, leftFoot=3, rightFoot=5, attributes=AttributeBlock(14, 11, 6, 9, 14, 13, 9, 7, 7, 7)),
        Player(id="rsa-26", name="CROSS Bradley", positions=["FB, CB"], age=25, height=175, leftFoot=5, rightFoot=3, attributes=AttributeBlock(14, 14, 7, 6, 8, 10, 9, 14, 14, 12)),
    ],
)

TEAMS: list[Team] = [KOREA_REPUBLIC, SOUTH_AFRICA]


def get_team(team_id: str) -> Team | None:
    return next((t for t in TEAMS if t.id == team_id), None)
