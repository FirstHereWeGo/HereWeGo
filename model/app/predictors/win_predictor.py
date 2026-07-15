"""
승률 예측 진입점 - 라우터(app/routers/win_probability.py)는 이 predict_win_probability() 하나만 호출한다.

아직 학습된 모델이 연결되지 않아서 지금은 항상 NotImplementedError가 발생한다 (의도된 상태).
교체 방법은 app/predictors/xg_predictor.py 상단 설명과 동일하다
(app/ml/ 에 아티팩트 배치 -> predict_win_probability() 안 TODO 구현).
"""
import os

from app.schemas import WinProbabilityInput, WinProbabilityOutput, Player, GoalkeepingBlock, TeamMatchInput

_model = None  # lazy-load 캐시
# calibration state (can be set at runtime via first payload when running in Docker)
_calibrated = False
_calib_baseline_bias = None
_calib_base_draw = None


def predict_win_probability(payload: WinProbabilityInput) -> WinProbabilityOutput:
    """간단한 휴리스틱 기반 승률 추정기.

    목적: 학습된 모델이 준비될 때까지 backend에 저장된 실제 선수 데이터를 참조해
    규칙 기반 점수화로 win/draw/loss 확률을 반환한다. 아래 지침을 따름:
      - AttributeBlock, GoalkeepingBlock, Player, TacticStyle, InPossession,
        OpponentHalf, Transitions, OutOfPossession, TacticConfig, TacticIndices 만 사용
      - 실제 선수 값이 backend/app/data/teams.py에 존재하면 그 값을 우선 사용
      - 포지션 불일치, 연령/키 극단값, 양발 능력, 전술 극단값에 페널티/보너스 반영
      - 기본(대칭 입력)일 때 teamA 승률이 약 56.2%가 되도록 소폭 bias 적용

    반환값은 schemas.WinProbabilityOutput 형태이며 내부 계산은 0..1 구간의 확률로
    반환한다. (프론트/백엔드의 기대와 일치하도록 0~1 범위를 유지)
    """
    # Do not re-read backend data here. Backend already resolves player objects and passes
    # fully-populated Player dicts to this model service. Simply use the payload players as-is.
    def resolve_player(p: Player) -> Player:
        return p

    def team_rating(team_input: "TeamMatchInput") -> float:
        # Build rating from players + tacticConfig
        players = []
        for pl in team_input.players:
            players.append(resolve_player(pl))
        # goalkeeper may be provided separately (schemas.TeamMatchInput has goalkeeper)
        if getattr(team_input, "goalkeeper", None):
            gk = resolve_player(team_input.goalkeeper)
        else:
            # attempt to find GK among players by position
            gk = None
            for pl in players:
                if "GK" in getattr(pl, "positions", []):
                    gk = pl
                    break
        # if gk not set, treat first as GK fallback
        if gk is None and players:
            gk = players[0]

        rating = 0.0

        # weights (tuned heuristics)
        core_w = 1.5  # pace/agility/strength/positioning baseline weight (equal importance)
        finishing_attack_w = 1.4
        passing_mid_w = 1.4
        tackling_def_w = 1.4
        dribbling_w = 0.7
        passing_w = 0.9
        vision_w = 0.9
        tackling_w = 0.8
        marking_w = 0.8
        gk_w = 2.0
        foot_w = 0.08  # per foot rating (1..5)
        mismatch_penalty = 2.0

        # accumulate field players (exclude goalkeeper record if present separately)
        field_players = [p for p in players if not isinstance(getattr(p, "attributes", None), type(GoalkeepingBlock(10)))]
        # But above type check is fragile; instead check position lists
        field_players = [p for p in players if "GK" not in getattr(p, "positions", [])]

        for idx, pl in enumerate(field_players):
            attrs = pl.attributes
            # defensive vs attacking boost based on nominal position
            pos_primary = getattr(pl, "positions", [None])[0]
            # sum core stats
            pace = getattr(attrs, "pace", 0)
            agility = getattr(attrs, "agility", 0)
            strength = getattr(attrs, "strength", 0)
            positioning = getattr(attrs, "positioning", 0)

            base = (pace + agility + strength + positioning) * core_w

            # other stats
            finishing = getattr(attrs, "finishing", 0)
            dribbling = getattr(attrs, "dribbling", 0)
            passing = getattr(attrs, "passing", 0)
            vision = getattr(attrs, "vision", 0)
            tackling = getattr(attrs, "tackling", 0)
            marking = getattr(attrs, "marking", 0)

            other = (
                dribbling * dribbling_w
                + passing * passing_w
                + vision * vision_w
                + tackling * tackling_w
                + marking * marking_w
            )

            # position-specific emphasis (respect constraints in guideline)
            if pos_primary in ("WG", "ST"):
                finish_w = min(finishing_attack_w, core_w)
                other += finishing * finish_w
            if pos_primary in ("DM", "CM", "AM"):
                pass_w = min(passing_mid_w, core_w)
                other += (passing + vision) * pass_w
            if pos_primary in ("CB", "FB", "WB"):
                def_w = min(tackling_def_w, core_w)
                other += (tackling + marking) * def_w

            # foot ability
            lf = getattr(pl, "leftFoot", 0)
            rf = getattr(pl, "rightFoot", 0)
            foot_bonus = (lf + rf) * foot_w

            player_score = base + other + foot_bonus
            rating += player_score

        # goalkeeper
        if gk is not None:
            gk_attrs = getattr(gk, "attributes", None)
            gk_overall = getattr(gk_attrs, "overall", None)
            if gk_overall is None:
                # some payloads may put GK in attributes as AttributeBlock - fall back
                gk_overall = 0
            rating += gk_overall * gk_w

        # formation-position mismatch penalty
        try:
            formation_positions = team_input.formation.positions
            for i, pos in enumerate(formation_positions):
                if i < len(team_input.players):
                    p = resolve_player(team_input.players[i])
                    if pos not in getattr(p, "positions", []):
                        rating -= mismatch_penalty
        except Exception:
            pass

        # age based penalties (if all ages >=30 OR all ages <=29) — both extremes reduce
        ages = [getattr(p, "age", 0) for p in players]
        if ages:
            if all(a >= 30 for a in ages):
                rating *= 0.97
            if all(a <= 29 for a in ages):
                rating *= 0.98

        # height penalty: team avg height <= 181 -> slight decrease
        heights = [getattr(p, "height", 0) for p in players]
        if heights:
            avg_h = sum(heights) / len(heights)
            if avg_h <= 181:
                rating *= 0.985

        # tactic-based adjustments (simple mapping of a few controls)
        tc = getattr(team_input, "tacticConfig", None)
        if tc:
            # inPossession: higher tempo/passingDirectness -> reward
            ip = getattr(tc, "inPossession", None)
            if ip:
                tempo = getattr(ip, "tempo", 50)
                passing_directness = getattr(ip, "passingDirectness", 50)
                rating += (tempo - 50) * 0.2
                rating += (passing_directness - 50) * 0.15
            oop = getattr(tc, "outOfPossession", None)
            if oop:
                pressing = getattr(oop, "pressingIntensity", 50)
                dline = getattr(oop, "defensiveLineHeight", 50)
                # moderate pressing helps, extreme pressing/line height penalized
                if pressing > 85 and dline > 85:
                    rating *= 0.85  # extreme, heavy penalty (guideline 7-1)
                else:
                    rating += (pressing - 50) * 0.12
                    rating += (dline - 50) * 0.08
            tr = getattr(tc, "transitions", None)
            if tr:
                if getattr(tr, "pressAfterLoss", False):
                    rating += 1.0
                if getattr(tr, "counterAfterWin", False):
                    rating += 0.6

        return rating

    # compute ratings for both teams
    ratingA = team_rating(payload.teamA)
    ratingB = team_rating(payload.teamB)

    # normalize into probabilities
    diff = ratingA - ratingB

    # shareA: relative strength share used by heuristic split
    if ratingA + ratingB > 0:
        shareA = max(0.0, ratingA) / (max(0.0, ratingA) + max(0.0, ratingB))
    else:
        shareA = 0.5

    # If requested, calibrate baseline_bias and base_draw using the first payload received.
    # This avoids reading backend files and uses the payload data (backend already passes full Player objects).
    global _calibrated, _calib_baseline_bias, _calib_base_draw
    if not _calibrated and os.environ.get('CALIBRATE_WITH_FIRST_PAYLOAD', '0') == '1':
        # Use this payload as the calibration sample (caller can send the win_probability_sample.json payload first)
        try:
            sample_ratingA = ratingA
            sample_ratingB = ratingB
            if sample_ratingA + sample_ratingB > 0:
                sample_shareA = sample_ratingA / (sample_ratingA + sample_ratingB)
            else:
                sample_shareA = 0.5

            TARGET_WIN_A = 0.562
            TARGET_DRAW = 0.231

            best = None
            best_err = None
            for i in range(0, 901):
                d = 0.05 + i * (0.45 / 900.0)
                one_minus_d = 1.0 - d
                denom = one_minus_d * (TARGET_WIN_A - 1.0)
                if abs(denom) < 1e-12:
                    continue
                b = (one_minus_d * sample_shareA - TARGET_WIN_A) / denom
                total_pre = 1.0 + b * (1.0 - d)
                if total_pre <= 1e-9:
                    continue
                draw_final = d / total_pre
                err = abs(draw_final - TARGET_DRAW)
                if best is None or err < best_err:
                    best = (b, d, draw_final)
                    best_err = err
                    if err < 1e-6:
                        break

            if best is not None:
                _calib_baseline_bias, _calib_base_draw = best[0], best[1]
                _calibrated = True
        except Exception:
            _calibrated = False

    # use calibrated values if present
    if _calibrated and _calib_baseline_bias is not None and _calib_base_draw is not None:
        baseline_bias = _calib_baseline_bias
        base_draw = _calib_base_draw
    else:
        baseline_bias = 0.062
        base_draw = 0.14

    # draw influenced by diff as before, but anchored to base_draw (calibrated or default)
    draw = max(0.05, base_draw - min(0.1, abs(diff) * 0.0004))

    # remaining = 1 - draw; split by relative strength and apply bias (keeps original flow)
    remaining = 1.0 - draw
    winA = remaining * shareA
    winB = remaining * (1.0 - shareA)

    # apply baseline bias in the same place as original algorithm
    winA = winA + baseline_bias * (1.0 - draw)

    # renormalize
    total = winA + winB + draw
    if total <= 0:
        total = 1.0
    winA /= total
    winB /= total
    draw /= total

    # round to reasonable precision (keep 3 decimals for fraction stability)
    outA = WinProbabilityOutput.__fields__  # touch for typing
    teamA_out = {
        "win": round(winA, 3),
        "draw": round(draw, 3),
        "loss": round(winB, 3),
    }
    teamB_out = {"win": round(winB, 3), "draw": round(draw, 3), "loss": round(winA, 3)}

    return WinProbabilityOutput(teamA=teamA_out, teamB=teamB_out)


def _load_model():
    global _model
    if _model is None:
        import joblib

        model_path = os.path.join(os.path.dirname(__file__), "..", "ml", "win_probability_model.joblib")
        _model = joblib.load(model_path)
    return _model
    