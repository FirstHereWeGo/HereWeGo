# 학습된 모델 아티팩트

학습된 모델 파일을 이 폴더에 넣으세요.

- xG 모델: `xg_model.joblib`
- 승률 모델: `win_probability_model.joblib`

파일명을 다르게 쓰고 싶으면 `app/predictors/xg_predictor.py`, `app/predictors/win_predictor.py`의
`_load_model()` 안 경로를 맞춰서 수정하면 됩니다.

모델을 넣은 뒤 `predict_xg()` / `predict_win_probability()` 함수 안 TODO를 채워서
실제 추론 로직(payload -> feature 변환, model.predict(), 출력 형태 맞추기)을 구현하면
라우터/스키마는 건드리지 않고 교체가 끝납니다.

지금은 두 함수 모두 모델이 없어서 `NotImplementedError`를 던지는 상태입니다 (의도된 동작 —
`/api/xg/rewind`, `/api/win-probability` 호출 시 502로 실패하는 게 정상입니다).
