import re

from fastapi import APIRouter

from app.data.teams import get_team
from app.schemas.ai_suggestion import AiSuggestionRequest, AiSuggestionResponse
from app.schemas.win_probability import TeamOutcome
from app.services import gemini_client
from app.services.team_resolver import resolve_team

router = APIRouter(prefix="/api")


def _format_player(player: dict, tag: str | None = None) -> str:
    attrs = ", ".join(f"{k}={v}" for k, v in player["attributes"].items())
    positions = "/".join(player["positions"])
    prefix = f"[{tag}] " if tag else ""
    return f"- {prefix}{player['name']} ({positions}, {player['age']}세): {attrs}"


def _format_tactic(tactic: dict) -> str:
    lines = []
    for section, fields in tactic.items():
        field_str = ", ".join(f"{k}={v}" for k, v in fields.items())
        lines.append(f"  {section}: {field_str}")
    return "\n".join(lines)


def _build_prompt(my: dict, bench: list[dict], opp: dict, win_prob: TeamOutcome) -> str:
    penalties = ", ".join(win_prob.penalties) if win_prob.penalties else "없음"

    my_players = "\n".join(_format_player(p) for p in my["players"])
    bench_players = "\n".join(_format_player(p) for p in bench) if bench else "(벤치 자원 없음)"
    opp_players = "\n".join(_format_player(p) for p in opp["players"])

    return f"""당신은 축구 코치입니다. 아래 데이터만 근거로, 우리 팀이 전술 설정이나 선발 선수를 어떻게 바꾸면 좋을지 한국어로 조언해서 감독을 도우세요.
추상적인 일반론이 아니라 실제 선수 이름과 스탯 수치를 근거로, 구체적인 포지션/전술 옵션 변경이나 벤치 선수로의 교체를 제안하세요. 스탯은 선수 간 상대 비교용 수치입니다.

[출력 형식 - 반드시 지킬 것]
- 총 5줄 이내로 요약하세요. 줄마다 한 문장, 군더더기 설명 없이 핵심만.
- 서식 없는 일반 텍스트로만 작성하세요. **, *, #, -, 마크다운 강조, 번호 매기기, 이모지를 쓰지 마세요.
- 각 줄은 그냥 줄바꿈으로만 구분하세요 (불릿 기호 없이).

[현재 예측 결과 (우리 팀 기준)]
승률 {win_prob.win * 100:.0f}% / 무승부 {win_prob.draw * 100:.0f}% / 패배 {win_prob.loss * 100:.0f}%
전술적 결함: {penalties}

[우리 팀 포메이션: {my['formation']['name']}]
[우리 팀 전술 설정]
{_format_tactic(my['tacticConfig'])}

[우리 팀 선발 골키퍼]
{_format_player(my['goalkeeper'])}

[우리 팀 선발 필드 플레이어 10명]
{my_players}

[우리 팀 벤치 자원]
{bench_players}

[상대 팀 포메이션: {opp['formation']['name']}]
[상대 팀 전술 설정]
{_format_tactic(opp['tacticConfig'])}

[상대 팀 선발 골키퍼]
{_format_player(opp['goalkeeper'])}

[상대 팀 선발 필드 플레이어 10명]
{opp_players}
"""


def _strip_markdown(text: str) -> str:
    """프론트 말풍선은 마크다운을 렌더링하지 않는 순수 텍스트라, 모델이 프롬프트 지시를
    무시하고 강조 기호를 넣는 경우를 대비해 여기서 한 번 더 걷어낸다."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)  # **강조**
    text = re.sub(r"(?<!\*)\*(?!\*)(.+?)\*(?!\*)", r"\1", text)  # *강조*
    text = re.sub(r"^\s*[-*#]+\s*", "", text, flags=re.MULTILINE)  # 줄머리 마크다운 불릿/헤딩
    return text.strip()


@router.post("/ai-suggestion")
async def ai_suggestion(payload: AiSuggestionRequest) -> AiSuggestionResponse:
    my = resolve_team(payload.teamA)
    opp = resolve_team(payload.teamB)

    my_team = get_team(payload.teamA.teamId)
    starting_ids = {payload.teamA.startingXI.goalkeeperId, *payload.teamA.startingXI.playerIds}
    bench = [p.model_dump() for p in my_team.players if p.id not in starting_ids]

    prompt = _build_prompt(my, bench, opp, payload.winProb)
    suggestion = await gemini_client.generate_suggestion(prompt)
    return AiSuggestionResponse(suggestion=_strip_markdown(suggestion))
