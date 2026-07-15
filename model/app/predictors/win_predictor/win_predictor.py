"""
승률 예측 진입점 - 라우터(app/routers/win_probability.py)는 이 predict_win_probability() 하나만 호출한다.

실제 계산은 이 폴더의 다른 파일들이 나눠 맡는다:
  - weights.py: 휴리스틱 가중치
  - context.py: 선수 그룹핑(필드 플레이어/GK/포지션별 그룹) + 평균 계산 헬퍼
  - base_rating.py: 전술 조정 전 기본 rating(능력치 합산 + GK + 미스매치/연령/신장 페널티)
  - tactics_in_possession.py / tactics_opponent_half.py / tactics_transitions.py /
    tactics_out_of_possession.py: TacticConfig 4개 섹션별 rating 조정
  - team_rating.py: 위 조각들을 합쳐 팀 하나의 rating을 계산
  - probability.py: 두 팀 rating을 win/draw/loss 확률로 변환

학습된 모델이 준비되면 이 함수를 model 로드 + 추론으로 교체하면 된다
(app/predictors/xg_predictor.py 상단 설명과 동일한 방식, app/ml/ 에 아티팩트 배치).
"""
import os

from app.predictors.win_predictor.probability import ratings_to_output
from app.predictors.win_predictor.team_rating import team_rating
from app.schemas import WinProbabilityInput, WinProbabilityOutput

_model = None  # lazy-load 캐시


def predict_win_probability(payload: WinProbabilityInput) -> WinProbabilityOutput:
    """간단한 휴리스틱 기반 승률 추정기.

    목적: 학습된 모델이 준비될 때까지 backend에 저장된 실제 선수 데이터를 참조해
    규칙 기반 점수화로 win/draw/loss 확률을 반환한다. 아래 지침을 따름:
      - AttributeBlock, GoalkeepingBlock, Player, TacticStyle, InPossession,
        OpponentHalf, Transitions, OutOfPossession, TacticConfig, TacticIndices 만 사용
      - 실제 선수 값이 backend/app/data/teams.py에 존재하면 그 값을 우선 사용
      - 포지션 불일치, 연령/키 극단값, 양발 능력, 전술 극단값에 페널티/보너스 반영

    반환값은 schemas.WinProbabilityOutput 형태이며 내부 계산은 0..1 구간의 확률로
    반환한다. (프론트/백엔드의 기대와 일치하도록 0~1 범위를 유지)
    """
    rating_a = team_rating(payload.teamA)
    rating_b = team_rating(payload.teamB)

    return ratings_to_output(rating_a, rating_b)


def _load_model():
    global _model
    if _model is None:
        import joblib

        model_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "win_probability_model.joblib")
        _model = joblib.load(model_path)
    return _model
