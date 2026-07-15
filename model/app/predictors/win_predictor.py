"""
승률 예측 진입점 - 라우터(app/routers/win_probability.py)는 이 predict_win_probability() 하나만 호출한다.

아직 학습된 모델이 연결되지 않아서 지금은 항상 NotImplementedError가 발생한다 (의도된 상태).
교체 방법은 app/predictors/xg_predictor.py 상단 설명과 동일하다
(app/ml/ 에 아티팩트 배치 -> predict_win_probability() 안 TODO 구현).
"""
import os

from app.schemas import WinProbabilityInput, WinProbabilityOutput

_model = None  # lazy-load 캐시


def predict_win_probability(payload: WinProbabilityInput) -> WinProbabilityOutput:
    """TODO(팀원): 학습된 승률 모델 연결.

    1. payload(양팀 골키퍼 + 필드 플레이어 10명 + 포메이션 + 전술)를 모델이 기대하는 feature 배열로 변환.
       선수 속성은 attacking/defending 같은 합성등급으로 미리 압축하지 말고 10개 원본 스탯을
       그대로 넣을 것 - 학습된 모델이 스스로 가중치를 찾도록 하는 게 목적.
    2. model = _load_model()
    3. 추론 결과를 WinProbabilityOutput(teamA=TeamOutcome(win, draw, loss), teamB=...) 형태로 변환해서 반환
       (win+draw+loss 합이 1이 되도록 정규화할 것)
    """
    raise NotImplementedError("학습된 승률 모델이 아직 연결되지 않았습니다 (app/predictors/win_predictor.py)")


def _load_model():
    global _model
    if _model is None:
        import joblib

        model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "win_probability_model.joblib")
        _model = joblib.load(model_path)
    return _model
