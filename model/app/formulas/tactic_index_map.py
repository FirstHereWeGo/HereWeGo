"""
FM 패널의 전술 컨트롤(TacticConfig) -> 7개 합성 지표(TacticIndices) 변환.

2-pass 구조:
  1) 전술 유형/성향 드롭다운이 7개 지표 전체에 매크로 프리셋을 먼저 적용
  2) 개별 슬라이더/토글이 그 위에 델타를 더함 (압박 실행, 수비 라인은 지표값을 직접 좌우하는 "히어로 컨트롤")
"""
from app.schemas import TacticConfig, TacticIndices

BASELINE = 50.0

# 1) 전술 유형/성향 매크로 프리셋 - 7개 지표에 대한 델타
STYLE_PRESETS: dict[str, dict[str, float]] = {
    "possession": {"buildupTempo": -5, "riskTaking": -5, "directness": -10},
    "gegenpress": {"pressingIndex": 20, "buildupTempo": 10, "riskTaking": 5},
    "counter": {"riskTaking": 10, "directness": 15, "buildupTempo": -5},
    "direct": {"directness": 20, "buildupTempo": 10},
}
APPROACH_PRESETS: dict[str, dict[str, float]] = {
    "dominant": {"pressingIndex": 15, "buildupTempo": 10, "riskTaking": 10},
    "balanced": {},
    "cautious": {"pressingIndex": -10, "riskTaking": -10, "defensiveLineHeight": -10},
}


def _clamp(value: float) -> float:
    return max(0.0, min(100.0, value))


def compute_tactic_indices(tactic: TacticConfig) -> TacticIndices:
    idx = {
        "attackingWidth": BASELINE,
        "directness": BASELINE,
        "buildupTempo": BASELINE,
        "pressingIndex": BASELINE,
        "defensiveLineHeight": BASELINE,
        "defensiveCompactness": BASELINE,
        "riskTaking": BASELINE,
    }

    # --- pass 1: 매크로 프리셋 ---
    for key, delta in STYLE_PRESETS.get(tactic.style.tacticStyle, {}).items():
        idx[key] += delta
    for key, delta in APPROACH_PRESETS.get(tactic.style.approach, {}).items():
        idx[key] += delta

    # --- pass 2: 공 소유 시 ---
    ip = tactic.inPossession
    idx["attackingWidth"] = idx["attackingWidth"] * 0.3 + ip.attackingWidth * 0.7  # 슬라이더가 지배적
    if ip.overlapLeft:
        idx["attackingWidth"] += 8
    if ip.overlapRight:
        idx["attackingWidth"] += 8
    if ip.targetWide:
        idx["attackingWidth"] += 6
    if ip.targetCentral:
        idx["directness"] += 4
        idx["attackingWidth"] -= 6
    if ip.buildFromBack:
        idx["directness"] -= 12
        idx["buildupTempo"] -= 6
    build_style_delta = {"short": -15, "mixed": 0, "direct": 20}
    idx["directness"] += build_style_delta.get(ip.buildupStyle, 0)
    idx["directness"] = idx["directness"] * 0.4 + ip.passingDirectness * 0.6
    idx["buildupTempo"] = idx["buildupTempo"] * 0.4 + ip.tempo * 0.6
    idx["buildupTempo"] -= ip.timeWasting * 0.2

    # --- pass 2: 상대팀 진영 ---
    oh = tactic.opponentHalf
    crossing_delta = {"low": -4, "mixed": 0, "high": 8}
    idx["attackingWidth"] += crossing_delta.get(oh.crossingApproach, 0)
    idx["directness"] += crossing_delta.get(oh.crossingApproach, 0)
    if oh.playCalmly:
        idx["riskTaking"] -= 10
        idx["directness"] -= 6
    if oh.earlyCrosses:
        idx["directness"] += 10
        idx["riskTaking"] += 6
    if oh.dontHoldBack:
        idx["riskTaking"] += 12
    if oh.exploitSetPieces:
        idx["riskTaking"] += 4
    if oh.dribbleMore:
        idx["riskTaking"] += 10
    else:
        idx["riskTaking"] -= 10
    if oh.playForFreedom:
        idx["riskTaking"] += 10
        idx["buildupTempo"] += 4

    # --- pass 2: 전환 시 ---
    tr = tactic.transitions
    if tr.pressAfterLoss:
        idx["pressingIndex"] += 15
    else:
        idx["pressingIndex"] -= 10
    if tr.counterAfterWin:
        idx["buildupTempo"] += 10
        idx["riskTaking"] += 8
    else:
        idx["buildupTempo"] -= 6
        idx["riskTaking"] -= 6
    if tr.gkDistributeQuick:
        idx["buildupTempo"] += 8
        idx["directness"] += 10
    else:
        idx["buildupTempo"] -= 8
        idx["directness"] -= 6
    if tr.distributionMethod == "long":
        idx["directness"] += 8
    else:
        idx["directness"] -= 8

    # --- pass 2: 소유권 없을 때 ---
    oop = tactic.outOfPossession
    shape_delta = {"narrow": 10, "normal": 0, "wide": -10}
    idx["defensiveCompactness"] += shape_delta.get(oop.defensiveShape, 0)
    idx["pressingIndex"] = idx["pressingIndex"] * 0.3 + oop.pressingIntensity * 0.7  # 히어로 컨트롤
    line_delta = {"low": -10, "mid": 0, "high": 10}
    idx["pressingIndex"] += line_delta.get(oop.pressingLine, 0)
    idx["defensiveCompactness"] += -4 if oop.pressingLine == "high" else 0
    if oop.tackling == "hard_tackle":
        idx["pressingIndex"] += 8
        idx["defensiveCompactness"] -= 6
    else:
        idx["pressingIndex"] -= 4
        idx["defensiveCompactness"] += 6
    idx["defensiveLineHeight"] = idx["defensiveLineHeight"] * 0.3 + oop.defensiveLineHeight * 0.7  # 히어로 컨트롤
    if oop.offsideTrap == "in":
        idx["defensiveCompactness"] += 8
    elif oop.offsideTrap == "out":
        idx["defensiveLineHeight"] -= 4
        idx["defensiveCompactness"] -= 4
    idx["defensiveCompactness"] += -10 if oop.allowCrosses else 10

    return TacticIndices(**{k: _clamp(v) for k, v in idx.items()})
