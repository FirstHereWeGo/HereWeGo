"""TacticConfig.inPossession 기반 rating_adjustment 조정."""
from app.predictors.win_predictor.context import TeamContext, attr, avg, gk_overall
from app.schemas import TacticConfig


def _record_penalty(context: TeamContext, code: str) -> None:
    penalties = getattr(context, "penalty_codes", None)
    if penalties is None:
        penalties = []
        setattr(context, "penalty_codes", penalties)
    penalties.append(code)
    setattr(TeamContext, "_last_penalty_codes", list(penalties))


def apply_in_possession(tc: TacticConfig, context: TeamContext) -> float:
    rating_adjustment = 0.0
    ip = getattr(tc, "inPossession", None)
    if not ip:
        return rating_adjustment

    field_players = context.field_players
    midfielders = context.midfielders
    attackers = context.attackers
    wingers = context.wingers
    cbs = context.cbs
    gk = context.gk

    buildup = getattr(ip, "buildupStyle", "mixed")
    passing_directness = getattr(ip, "passingDirectness", 50)
    tempo = getattr(ip, "tempo", 50)
    attacking_width = getattr(ip, "attackingWidth", 50)
    target_wide = getattr(ip, "targetWide", False)
    target_central = getattr(ip, "targetCentral", False)
    overlap_left = getattr(ip, "overlapLeft", False)
    overlap_right = getattr(ip, "overlapRight", False)
    build_from_back = getattr(ip, "buildFromBack", False)

    # 짧은 빌드업 + 낮은 직선성 -> 미드필드 시너지 보너스 또는 턴오버 페널티
    if buildup == "short" and passing_directness < 50:
        mid_pass_avg = avg(lambda p: attr(p, "passing"), midfielders)
        mid_vision_avg = avg(lambda p: attr(p, "vision"), midfielders)
        mid_agility_avg = avg(lambda p: attr(p, "agility"), midfielders)
        if mid_pass_avg >= 13 and mid_vision_avg >= 13 and mid_agility_avg >= 13:
            rating_adjustment += 16.0  # 시너지 보너스 (4배 증가: 4 → 16)
        else:
            # 패널티: 미드필드 패스/시야/민첩성이 부족해 짧은 빌드업이 끊김
            _record_penalty(context, "미드필드 패스/시야/민첩성이 부족해 짧은 빌드업이 끊김")
            rating_adjustment -= 48.0  # 턴오버 페널티

    # 다이렉트 빌드업 + 높은 직선성 -> CB 패스 + 공격수 피지컬 활용
    if buildup == "direct" and passing_directness > 50:
        cb_pass_avg = avg(lambda p: attr(p, "passing"), cbs)
        atk_strength_avg = avg(lambda p: attr(p, "strength"), attackers)
        atk_pace_avg = avg(lambda p: attr(p, "pace"), attackers)
        atk_pos_avg = avg(lambda p: attr(p, "positioning"), attackers)
        if cb_pass_avg >= 11 and (atk_strength_avg >= 11 or atk_pace_avg >= 12):
            rating_adjustment += 12.0
        else:
            # 패널티: 센터백 패스 능력이나 공격수의 피지컬/주력이 부족해 직선 전개가 안 맞음
            _record_penalty(context, "센터백 패스 능력이나 공격수의 피지컬/주력이 부족해 직선 전개가 안 맞음")
            rating_adjustment -= 20.0

    # 넓은 공격 폭 + targetWide
    if attacking_width > 65 and target_wide:
        # 윙 자원이 필요함
        if len(wingers) < 2:
            # 좁은 스쿼드 구성과 전술이 어긋남
            # 패널티: 폭을 넓히는 전술인데 윙어/사이드 자원이 부족함
            _record_penalty(context, "폭을 넓히는 전술인데 윙어/사이드 자원이 부족함")
            rating_adjustment -= 56.0
        else:
            wings_pace_avg = avg(lambda p: attr(p, "pace"), wingers)
            wings_drib_avg = avg(lambda p: attr(p, "dribbling"), wingers)
            rating_adjustment += (wings_pace_avg + wings_drib_avg - 20) * 0.15

    # 좁은 공격 폭 + targetCentral
    if attacking_width < 35 and target_central:
        central_players = [p for p in field_players if any(pos in ("CM", "AM", "ST") for pos in getattr(p, "positions", []))]
        cent_pass_avg = avg(lambda p: attr(p, "passing"), central_players)
        cent_vision_avg = avg(lambda p: attr(p, "vision"), central_players)
        cent_agility_avg = avg(lambda p: attr(p, "agility"), central_players)
        central_score = cent_pass_avg + cent_vision_avg + cent_agility_avg - 30
        # 패널티: 중앙 집중 전술인데 중앙 자원의 패스/시야/민첩성이 부족함
        if central_players and (cent_pass_avg + cent_vision_avg + cent_agility_avg) < 30:
            _record_penalty(context, "중앙 집중 전술인데 중앙 자원의 패스/시야/민첩성이 부족함")
        if central_score < 0:
            rating_adjustment += central_score * 0.72
        else:
            rating_adjustment += central_score * 0.18

    # 오버랩
    if overlap_left or overlap_right:
        # 사이드별 선수 구분이 없어 좌/우를 동일하게 취급
        overlap_players = [p for p in field_players if any(pos in ("FB", "WB") for pos in getattr(p, "positions", []))]
        ov_pace_avg = avg(lambda p: attr(p, "pace"), overlap_players)
        ov_pos_avg = avg(lambda p: attr(p, "positioning"), overlap_players)
        if ov_pace_avg >= 14 and ov_pos_avg >= 14:
            rating_adjustment += 10.0
            # 리스크: CB가 느리거나 마킹이 약하면 큰 취약점
            cb_pace_avg = avg(lambda p: attr(p, "pace"), cbs)
            cb_mark_avg = avg(lambda p: attr(p, "marking"), cbs)
            if cb_pace_avg <= 11 or cb_mark_avg <= 11:
                # 패널티: 오버랩 뒤 공간을 커버할 센터백 속도/마킹이 부족함
                _record_penalty(context, "오버랩 뒤 공간을 커버할 센터백 속도/마킹이 부족함")
                rating_adjustment -= 40.0
        else:
            # 패널티: 풀백/윙백의 전진 자원과 위치 선정이 부족해 오버랩이 살아나지 않음
            _record_penalty(context, "풀백/윙백의 전진 자원과 위치 선정이 부족해 오버랩이 살아나지 않음")
            rating_adjustment -= 12.0

    # 빌드업 시 GK 참여
    if build_from_back:
        gk_over = gk_overall(gk)
        cb_pass_avg = avg(lambda p: attr(p, "passing"), cbs)
        cb_vision_avg = avg(lambda p: attr(p, "vision"), cbs)
        cb_agility_avg = avg(lambda p: attr(p, "agility"), cbs)
        if gk_over >= 12 and cb_pass_avg >= 11 and cb_vision_avg >= 11 and cb_agility_avg >= 10:
            rating_adjustment += 12.0
        else:
            # 턴오버 -> 큰 페널티
            # 패널티: 골키퍼/센터백의 후방 빌드업 능력이 부족해 위험한 실수가 발생함
            _record_penalty(context, "골키퍼/센터백의 후방 빌드업 능력이 부족해 위험한 실수가 발생함")
            rating_adjustment -= 64.0

    # 템포
    if tempo > 70:
        team_agility_avg = avg(lambda p: attr(p, "agility"), field_players)
        team_pass_avg = avg(lambda p: attr(p, "passing"), field_players)
        team_vision_avg = avg(lambda p: attr(p, "vision"), field_players)
        if team_agility_avg >= 12 and team_pass_avg >= 12 and team_vision_avg >= 12:
            rating_adjustment += (tempo - 70) * 0.08
        else:
            # 패널티: 빠른 템포를 버틸 팀 전체의 민첩성/패스/시야가 부족함
            _record_penalty(context, "빠른 템포를 버틸 팀 전체의 민첩성/패스/시야가 부족함")
            rating_adjustment -= (tempo - 70) * 0.72

    return rating_adjustment
