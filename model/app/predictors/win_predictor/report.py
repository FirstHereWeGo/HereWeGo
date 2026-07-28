"""전술 시너지/페널티 리포트 수집기.

tactics_*.py가 rating을 조정할 때, 그 판정이 왜 나왔는지(요구 스탯 vs 실제 팀 평균)를
같이 기록해 둔다. 기록된 항목은 승률 응답의 `synergies`로 나가 프론트 "시너지 리포트"
패널에 카테고리별로 그려진다.

지금까지는 페널티만 문자열로 모았지만(=`penalties`), 보너스 쪽도 같은 규칙으로 이미
계산하고 있었기 때문에 양쪽 다 기록한다. `penalties`는 기존 소비자(match_stats 등)를
위해 그대로 유지된다.
"""
from app.predictors.win_predictor.context import TeamContext

# 카테고리 = TacticConfig 섹션. 프론트가 이 순서대로 묶어서 보여준다.
STYLE = "style"
IN_POSSESSION = "inPossession"
OPPONENT_HALF = "opponentHalf"
TRANSITIONS = "transitions"
OUT_OF_POSSESSION = "outOfPossession"
SQUAD = "squad"


def need(label: str, actual: float, threshold: float, unit: str = "", higher: bool = True) -> str:
    """'요구치 vs 실제' 한 조각. 예: need("미드 패스", 11.2, 13) -> "미드 패스 13 이상 (현재 11.2)"."""
    bound = "이상" if higher else "이하"
    return f"{label} {threshold:g}{unit} {bound} (현재 {actual:.1f}{unit})"


def have(label: str, actual: float, unit: str = "") -> str:
    """임계값 없이 실제 수치만 보여줄 때. 예: have("팀 평균 연령", 29.4, "세")."""
    return f"{label} {actual:.1f}{unit}"


def _record(context: TeamContext, tone: str, category: str, label: str, reasons: tuple[str, ...]) -> None:
    items = context.synergies
    items.append(
        {
            # 같은 라벨이 두 번 걸릴 수 있어 순번을 섞어 리액트 key 충돌을 막는다.
            "key": f"{category}-{len(items)}",
            "category": category,
            "tone": tone,
            "label": label,
            "detail": " · ".join(r for r in reasons if r),
        }
    )

    if tone == "bad":
        context.penalty_codes.append(label)
        # match_stats.py가 아직 읽는 레거시 경로 - 같이 갱신해 준다.
        setattr(TeamContext, "_last_penalty_codes", list(context.penalty_codes))


def bonus(context: TeamContext, category: str, label: str, *reasons: str) -> None:
    """전술과 스쿼드가 맞아떨어져 rating이 올라간 경우."""
    _record(context, "good", category, label, reasons)


def penalty(context: TeamContext, category: str, label: str, *reasons: str) -> None:
    """전술이 스쿼드와 어긋나 rating이 깎인 경우."""
    _record(context, "bad", category, label, reasons)
