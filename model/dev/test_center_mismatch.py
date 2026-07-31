"""_center_channel_bonuses / channel_split의 하프스페이스 평균 반영 확인용 임시 스크립트.
Poisson 총량 랜덤 노이즈가 미세한 효과 크기를 가릴 수 있어, 이 스크립트 안에서만
np.random.poisson을 평균값 그대로 반환하도록 결정론적으로 패치한다."""
import numpy as np
np.random.poisson = lambda lam, *a, **kw: lam

from app.predictors.match_predictor.match_stats import _center_channel_bonuses, generate_match_stats
from app.schemas import AttributeBlock, GoalkeepingBlock, Formation, Player, TacticConfig, TeamMatchInput, MatchStatsInput

# 4-2-3-1: FB, CB, CB, FB, CM, CM, WG, AM, WG, ST
formation = Formation(id="4-2-3-1", name="4-2-3-1", positions=["FB", "CB", "CB", "FB", "CM", "CM", "WG", "AM", "WG", "ST"])

AVG = dict(pace=50, agility=50, strength=50, finishing=50, dribbling=50, passing=50, vision=50, positioning=50, tackling=50, marking=50)

def mk_player(id_, positions, **overrides):
    attrs = {**AVG, **overrides}
    return Player(id=id_, name=id_, positions=positions, age=25, height=180, leftFoot=3, rightFoot=3,
                  attributes=AttributeBlock(**attrs))

def mk_gk(id_):
    return Player(id=id_, name=id_, positions=["GK"], age=25, height=190, leftFoot=3, rightFoot=3,
                  attributes=GoalkeepingBlock(reflexes=70, decisions=70, handling=70, positioning=70, passing=70))

# 팀A의 AM = 패스/시야 만점(중앙 창의성 최강), 팀B의 CM들은 태클/마킹 평균 그대로.
players_a = [
    mk_player("a_rfb", ["FB"]), mk_player("a_cb1", ["CB"]), mk_player("a_cb2", ["CB"]), mk_player("a_lfb", ["FB"]),
    mk_player("a_cm1", ["CM"]), mk_player("a_cm2", ["CM"]),
    mk_player("a_rwg", ["WG"]), mk_player("a_am", ["AM"], passing=100, vision=100),
    mk_player("a_lwg", ["WG"]), mk_player("a_st", ["ST"]),
]
players_b = [
    mk_player("b_rfb", ["FB"]), mk_player("b_cb1", ["CB"]), mk_player("b_cb2", ["CB"]), mk_player("b_lfb", ["FB"]),
    mk_player("b_cm1", ["CM"]), mk_player("b_cm2", ["CM"]),
    mk_player("b_rwg", ["WG"]), mk_player("b_am", ["AM"]),
    mk_player("b_lwg", ["WG"]), mk_player("b_st", ["ST"]),
]

team_a = TeamMatchInput(goalkeeper=mk_gk("a_gk"), players=players_a, formation=formation, tacticConfig=TacticConfig())
team_b = TeamMatchInput(goalkeeper=mk_gk("b_gk"), players=players_b, formation=formation, tacticConfig=TacticConfig())

center_a, center_b = _center_channel_bonuses(team_a, team_b)
print(f"center_a={center_a:.4f} center_b={center_b:.4f}")
# atk_a = AM(만점)+CM 2명(평균) 평균이라 캡까지는 안 가지만(희석), 그래도 양수여야 함.
assert 0 < center_a < 0.08, f"팀A AM 만점이 CM 평균에 희석되어 0과 cap 사이여야 함: {center_a}"
assert center_b == 0.0, f"팀B AM/CM 전부 평균 vs 팀A CM 평균 -> 0이어야 함: {center_b}"

stats = generate_match_stats(MatchStatsInput(teamA=team_a, teamB=team_b, durationMinutes=90))
final_third = next(s for s in stats.sections if s.title == "파이널 서드 진입")
by_label = {row.label: (row.a, row.b) for row in final_third.rows}
for label, (a, b) in by_label.items():
    print(label, a, b)

# 팀A는 중앙에서만 우위 - 왼쪽/오른쪽은 완전 평균이라 wide_bonus=0, 중앙만 +0.08.
# 하프스페이스(왼쪽 중앙/오른쪽 중앙)는 (wide_bonus 0 + center_bonus 0.08)/2 = 0.04로 중앙보다는 작지만
# 순수 중앙(centeR)보다는 확실히 더 커야 정상 - 중앙 채널 자체가 가장 크게 늘어야 한다.
assert by_label["중앙 채널"][0] > by_label["중앙 채널"][1], "팀A 중앙 채널이 팀B보다 커야 함"
assert by_label["왼쪽 중앙 채널"][0] > by_label["왼쪽 중앙 채널"][1], "팀A 왼쪽 중앙도 팀B보다 커야 함(하프스페이스 반영)"
assert by_label["오른쪽 중앙 채널"][0] > by_label["오른쪽 중앙 채널"][1], "팀A 오른쪽 중앙도 팀B보다 커야 함(하프스페이스 반영)"

print("ALL OK")
