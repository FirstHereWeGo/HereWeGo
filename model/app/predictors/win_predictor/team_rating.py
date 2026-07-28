"""한 팀의 rating = 기본 rating(base_rating) + 전술 조정 4단계."""
from app.predictors.win_predictor.base_rating import compute_base_rating
from app.predictors.win_predictor.context import build_context
from app.predictors.win_predictor.tactics_in_possession import apply_in_possession
from app.predictors.win_predictor.tactics_opponent_half import apply_opponent_half
from app.predictors.win_predictor.tactics_out_of_possession import (
    apply_out_of_possession,
)
from app.predictors.win_predictor.tactics_style import apply_style
from app.predictors.win_predictor.tactics_transitions import apply_transitions
from app.schemas import TeamMatchInput


def team_rating(team_input: TeamMatchInput, context=None) -> dict[str, float]:
    """전술 조정까지 끝난 팀 rating 조각들을 돌려준다.

    `context`를 넘기면 그 TeamContext를 그대로 써서, 계산 중 쌓인
    시너지/페널티 판정(report.py)을 호출자가 꺼내 쓸 수 있다.
    """
    if context is None:
        context = build_context(team_input)
    base_rating = compute_base_rating(team_input, context)

    ratings: dict[str, float] = {
        "base": base_rating,
        "inPossession": 0.0,
        "opponentHalf": 0.0,
        "transitions": 0.0,
        "outOfPossession": 0.0,
        "style": 0.0,
    }

    tc = getattr(team_input, "tacticConfig", None)
    if tc:
        ratings["inPossession"] = apply_in_possession(tc, context)
        ratings["opponentHalf"] = apply_opponent_half(tc, context)
        ratings["transitions"] = apply_transitions(tc, context)
        ratings["outOfPossession"] = apply_out_of_possession(tc, context)
        ratings["style"] = apply_style(tc, context)

    total_rating = sum(ratings.values())
    ratings["total"] = total_rating

    return ratings
