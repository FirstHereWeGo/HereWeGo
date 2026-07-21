"""단판 랜덤 매치 시뮬레이션 - 90분치 스코어 + 득점 타임라인을 한 번 뽑아 반환한다.

승률 계산과 같은 team_rating()을 재사용하므로, win_predictor 쪽 가중치를 튜닝하면
이 시뮬레이션도 같이 따라간다. 여기서는 rating 차이를 팀당 기대 득점(lambda)으로
바꾸고, 포아송 분포로 골 수를 뽑은 뒤 득점자/득점 시각을 랜덤 배정하는 것만 담당한다.
"""
import math
import random

import numpy as np

from app.predictors.match_predictor.weights import AVG_GOALS_PER_TEAM, MIN_LAMBDA, STRENGTH_SWING
from app.predictors.win_predictor.context import TeamContext, attr, build_context
from app.predictors.win_predictor.probability import SCALE
from app.predictors.win_predictor.team_rating import team_rating
from app.schemas import MatchEvent, MatchSimulationOutput, Player, WinProbabilityInput

# 득점자 추첨 가중치: 포지션별로 finishing/positioning을 얼마나 반영할지
_SCORER_WEIGHT_FLOOR = 0.5  # 어떤 필드 플레이어든 최소한의 득점 가능성은 남겨둠


def _scorer_weight(player: Player) -> float:
    pos = player.positions[0] if player.positions else None
    finishing = attr(player, "finishing")
    positioning = attr(player, "positioning")

    if pos in ("ST", "WG"):
        base = finishing * 1.5 + positioning * 0.5
    elif pos in ("AM", "CM"):
        base = finishing * 0.8 + positioning * 0.5
    elif pos == "DM":
        base = finishing * 0.3 + positioning * 0.3
    else:  # CB/FB/WB
        base = finishing * 0.15

    return max(base, _SCORER_WEIGHT_FLOOR)


def _expected_goals(rating_a: float, rating_b: float) -> tuple[float, float]:
    strength = math.tanh((rating_a - rating_b) / SCALE)  # -1..1
    lambda_a = AVG_GOALS_PER_TEAM * (1 + STRENGTH_SWING * strength)
    lambda_b = AVG_GOALS_PER_TEAM * (1 - STRENGTH_SWING * strength)
    return max(lambda_a, MIN_LAMBDA), max(lambda_b, MIN_LAMBDA)


def _sample_events(context: TeamContext, lam: float, team: str) -> list[MatchEvent]:
    n_goals = int(np.random.poisson(lam))
    if n_goals == 0 or not context.field_players:
        return []

    weights = [_scorer_weight(p) for p in context.field_players]
    scorers = random.choices(context.field_players, weights=weights, k=n_goals)
    minutes = [random.randint(1, 90) for _ in range(n_goals)]

    return [
        MatchEvent(minute=minute, team=team, scorer=scorer.name)
        for minute, scorer in zip(minutes, scorers)
    ]


def simulate_match(payload: WinProbabilityInput) -> MatchSimulationOutput:
    rating_a = team_rating(payload.teamA)
    rating_b = team_rating(payload.teamB)
    lambda_a, lambda_b = _expected_goals(rating_a, rating_b)

    context_a = build_context(payload.teamA)
    context_b = build_context(payload.teamB)

    events = _sample_events(context_a, lambda_a, "teamA") + _sample_events(context_b, lambda_b, "teamB")
    events.sort(key=lambda e: e.minute)

    score_a = sum(1 for e in events if e.team == "teamA")
    score_b = sum(1 for e in events if e.team == "teamB")

    return MatchSimulationOutput(scoreA=score_a, scoreB=score_b, events=events)
