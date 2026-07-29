"""
xG 예측 진입점 - 라우터(app/routers/xg.py)는 이 predict_xg() 하나만 호출한다.

아직 학습된 모델이 연결되지 않아서 지금은 항상 NotImplementedError가 발생한다 (의도된 상태).
팀원이 학습된 모델을 만들어오면:
  1. app/ml/ 에 모델 아티팩트 파일을 넣는다 (예: xg_model.joblib)
  2. 아래 predict_xg() 안의 TODO를 채운다 (모델 로드 + payload -> feature 변환 + 추론)
라우터/스키마는 건드릴 필요 없다 - 입력(XgPositionsInput)이나 출력(float) 형태 자체를
바꿔야 한다면 app/schemas.py와 이 함수 시그니처만 같이 바꾸면 된다.
"""
import os

from app.schemas import XgPositionsInput

_model = None  # lazy-load 캐시


def predict_xg(payload: XgPositionsInput) -> float:
    """TODO(팀원): 학습된 xG 모델 연결.

    1. payload(슈터/수비수 벡터, 선수 속성 10개, 수비 전술)를 모델이 기대하는 feature 배열로 변환.
       선수 속성은 attacking/defending 같은 합성등급으로 미리 압축하지 말고 10개 원본 스탯을
       그대로 넣을 것 - 학습된 모델이 스스로 가중치를 찾도록 하는 게 목적.
    2. model = _load_model()
    3. model.predict([features])[0] 등으로 추론 후 0~1 사이 float로 변환해서 반환
    """
    raise NotImplementedError("학습된 xG 모델이 아직 연결되지 않았습니다 (app/predictors/xg_predictor.py)")


def _load_model():
    global _model
    if _model is None:
        import joblib

        model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "xg_model.joblib")
        _model = joblib.load(model_path)
    return _model
