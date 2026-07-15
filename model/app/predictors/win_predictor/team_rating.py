"""한 팀의 rating = 기본 rating(base_rating) + 전술 조정 4단계."""
from app.predictors.win_predictor.base_rating import compute_base_rating
from app.predictors.win_predictor.context import build_context
from app.predictors.win_predictor.tactics_in_possession import apply_in_possession
from app.predictors.win_predictor.tactics_opponent_half import apply_opponent_half
from app.predictors.win_predictor.tactics_out_of_possession import apply_out_of_possession
from app.predictors.win_predictor.tactics_transitions import apply_transitions
from app.schemas import TeamMatchInput


def team_rating(team_input: TeamMatchInput) -> float:
    context = build_context(team_input)
    rating = compute_base_rating(team_input, context)

    tc = getattr(team_input, "tacticConfig", None)
    if tc:
        rating = apply_in_possession(rating, tc, context)
        rating = apply_opponent_half(rating, tc, context)
        rating = apply_transitions(rating, tc, context)
        rating = apply_out_of_possession(rating, tc, context)

    return rating
