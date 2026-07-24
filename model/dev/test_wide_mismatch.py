"""match_stats._wide_channel_bonuses / _side_tags 동작 확인용 임시 스크립트.
attributes는 backend seed 기준 0~100 스케일이라(attr()이 /5 해서 1~20으로 환산),
'평균'을 표현하려면 명시적으로 50을 줘야 한다 - AttributeBlock 기본값 10은 0~100 스케일에서 매우 낮은 값이다.
"""
from app.predictors.match_predictor.match_stats import _side_tags, _wide_channel_bonuses, generate_match_stats
from app.schemas import AttributeBlock, GoalkeepingBlock, Formation, Player, TacticConfig, TeamMatchInput, MatchStatsInput

# 4-4-2: FB, CB, CB, FB, WG, CM, CM, WG, ST, ST
formation = Formation(id="4-4-2", name="4-4-2", positions=["FB", "CB", "CB", "FB", "WG", "CM", "CM", "WG", "ST", "ST"])
tags = _side_tags(formation.positions)
print("side tags:", list(zip(formation.positions, tags)))
assert tags == ["right", "right", "left", "left", "right", "right", "left", "left", "right", "left"], tags

AVG = dict(pace=50, agility=50, strength=50, finishing=50, dribbling=50, passing=50, vision=50, positioning=50, tackling=50, marking=50)

def mk_player(id_, positions, **overrides):
    attrs = {**AVG, **overrides}
    return Player(id=id_, name=id_, positions=positions, age=25, height=180, leftFoot=3, rightFoot=3,
                  attributes=AttributeBlock(**attrs))

def mk_gk(id_):
    return Player(id=id_, name=id_, positions=["GK"], age=25, height=190, leftFoot=3, rightFoot=3,
                  attributes=GoalkeepingBlock(overall=70))

# 팀A 오른쪽 윙어 = 만점, 팀A 왼쪽 윙어 = 바닥. 나머지는 전부 평균.
# 팀B 왼쪽 풀백(팀A 오른쪽 공격과 마주봄) = 바닥 수비. 나머지는 평균.
players_a = [
    mk_player("a_rfb", ["FB"]),
    mk_player("a_cb1", ["CB"]),
    mk_player("a_cb2", ["CB"]),
    mk_player("a_lfb", ["FB"]),
    mk_player("a_rwg", ["WG"], dribbling=100, pace=100),
    mk_player("a_cm1", ["CM"]),
    mk_player("a_cm2", ["CM"]),
    mk_player("a_lwg", ["WG"], dribbling=10, pace=10),
    mk_player("a_st1", ["ST"]),
    mk_player("a_st2", ["ST"]),
]
players_b = [
    mk_player("b_rfb", ["FB"]),
    mk_player("b_cb1", ["CB"]),
    mk_player("b_cb2", ["CB"]),
    mk_player("b_lfb", ["FB"], tackling=10, marking=10),
    mk_player("b_rwg", ["WG"]),
    mk_player("b_cm1", ["CM"]),
    mk_player("b_cm2", ["CM"]),
    mk_player("b_lwg", ["WG"]),
    mk_player("b_st1", ["ST"]),
    mk_player("b_st2", ["ST"]),
]

team_a = TeamMatchInput(goalkeeper=mk_gk("a_gk"), players=players_a, formation=formation, tacticConfig=TacticConfig())
team_b = TeamMatchInput(goalkeeper=mk_gk("b_gk"), players=players_b, formation=formation, tacticConfig=TacticConfig())

left_a, right_a, left_b, right_b = _wide_channel_bonuses(team_a, team_b)
print(f"bonuses: left_a={left_a:.4f} right_a={right_a:.4f} left_b={left_b:.4f} right_b={right_b:.4f}")
assert right_a == 0.08, f"팀A 오른쪽 윙어(만점) vs 팀B 왼쪽 풀백(바닥) -> cap(0.08) 걸려야 함: {right_a}"
assert left_a == -0.08, f"팀A 왼쪽 윙어(바닥) vs 팀B 오른쪽 풀백(평균) -> cap(-0.08) 걸려야 함: {left_a}"
assert left_b == 0.0 and right_b == 0.0, f"팀B 공격 자원은 전부 평균 -> 0이어야 함: {left_b} {right_b}"

stats = generate_match_stats(MatchStatsInput(teamA=team_a, teamB=team_b, durationMinutes=90))
final_third = next(s for s in stats.sections if s.title == "파이널 서드 진입")
for row in final_third.rows:
    print(row.label, row.a, row.b)

print("ALL OK")
