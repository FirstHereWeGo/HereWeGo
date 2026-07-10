# 프로젝트 구조

```
project-root/
├── frontend/          # Next.js
│   ├── Dockerfile
│   └── Dockerfile.dev
├── backend/           # FastAPI (Python)
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── main.py
├── model/             # FastAPI (Python) - xG 계산 등
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── main.py
├── docker-compose.yml       # 프로덕션/배포용
├── docker-compose.dev.yml   # 개발용 (hot reload)
└── .env.example
```

## 최초 1회: 네트워크 생성

프론트/백엔드/모델 컨테이너가 공유하는 `herewego-net` 네트워크를 미리 만들어둬야 합니다 (이미 있으면 스킵).

```bash
docker network create herewego-net
```

## 개발할 때 (코드 저장 즉시 반영)

```bash
docker-compose -f docker-compose.dev.yml up
```

- frontend: http://localhost:3000
- backend: http://localhost:4000
- model: http://localhost:8000

코드를 고치면 볼륨 마운트 덕분에 컨테이너 안에서 바로 감지되어 자동 재시작/리로드됩니다.

## 배포/최종 제출할 때

```bash
docker-compose up --build
```

프로덕션 Dockerfile은 빌드 시점에 코드를 이미지에 굽기 때문에, 코드를 바꿨다면 반드시 `--build` 옵션으로 다시 빌드해야 반영됩니다.

## 참고

- `frontend`가 브라우저에서 직접 `backend`를 호출하는 구조라 `NEXT_PUBLIC_API_URL`은 `localhost` 기준으로 설정되어 있습니다.
- `backend` → `model` 호출은 컨테이너 네트워크 안에서 이루어지므로 서비스 이름(`model`)을 그대로 씁니다.
- `backend`와 `model` 모두 Python(FastAPI)이지만, 무거운 ML 라이브러리를 쓰는 `model`을 독립적으로 배포/스케일링하기 위해 서비스를 분리한 상태로 유지합니다.
- 실제 서비스 코드(선수 데이터, 전술 로직, xG 계산 등)는 각 폴더 안 예시 파일(`main.py`)을 참고해서 직접 채워 넣으면 됩니다.
