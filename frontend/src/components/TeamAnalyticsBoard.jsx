import { useEffect, useState } from 'react';
import { computeTeamAnalytics } from '../utils/teamAnalytics';
import { ATTRIBUTE_LABELS } from '../data/positionLabels';
import { TACTIC_GROUPS } from '../data/tacticFields';
import { jerseyNumber } from '../utils/playerDisplay';
import RadarChart from './RadarChart';
import AiSuggestionPanel from './AiSuggestionPanel';
import PlayerSelect from './PlayerSelect';

const PLAYER_A_COLOR = '#34e07a'; // 팀 공격력 레이더 색
const MY_COLOR = '#34e07a';
const OPP_COLOR = '#ef5350';

const TACTIC_LABELS = Object.values(TACTIC_GROUPS)
  .flatMap(group => group.flatMap(subgroup => subgroup.fields))
  .reduce((acc, field) => {
    acc[field.key] = field.label;
    return acc;
  }, {});

function startingElevenMap(roster, goalkeeperId, startingPlayerIds) {
  const byId = Object.fromEntries((roster || []).map(p => [p.id, p]));
  const map = {};
  if (byId[goalkeeperId]) map[goalkeeperId] = { data: byId[goalkeeperId] };
  (startingPlayerIds || []).forEach(id => {
    if (byId[id]) map[id] = { data: byId[id] };
  });
  return map;
}

function RadarLegend({ team, oppTeam }) {
  return (
    <div className="dash-radar-legend">
      <span><i style={{ background: PLAYER_A_COLOR }} />{team.name}</span>
      <span><i style={{ background: OPP_COLOR }} />{oppTeam.name}</span>
    </div>
  );
}

function AttrChips({ title, items, tone }) {
  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title">{title}</div>
      <div className="analytics-chip-list">
        {items.map(s => (
          <span key={s.key} className={`analytics-chip ${tone}`}>
            {s.label} <b className="num">{Math.round(s.value)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function PenaltyChips({ title, items, tone }) {
  if (!items || items.length === 0) {
    return (
      <div className="analytics-card glass analytics-card-large">
        <div className="analytics-card-title">{title}</div>
        <div className="analytics-empty">분석 데이터가 없습니다. 먼저 예측 승률을 계산해주세요.</div>
      </div>
    );
  }

  return (
    <div className="analytics-card glass analytics-card-large">
      <div className="analytics-card-title">{title}</div>
      <span className="analytics-chip-list">
        {items.map(p => (
          <span key={p.key} className={`analytics-chip ${tone}`}>
            {p.label}
          </span>
        ))}
      </span>
    </div>
  );
}

function TeamAnalysisPanel({ team, oppTeam, oppTacticPreset, players, winProb, aiSuggestion, aiLoading, aiError, onRequestAiSuggestion }) {
  const { attack, defense, strengths, weaknesses, max } = computeTeamAnalytics(players);
  const oppPlayers = startingElevenMap(oppTeam.players, oppTacticPreset?.goalkeeperId, oppTacticPreset?.startingPlayerIds);
  const { attack: oppAttack, defense: oppDefense } = computeTeamAnalytics(oppPlayers);
  const toAxes = arr => arr.map(s => ({ key: s.key, label: s.label }));
  const toValues = arr => Object.fromEntries(arr.map(s => [s.key, s.value]));

  const topPenalties = winProb?.penalties
    ? [...winProb.penalties]
        .sort(() => 0.5 - Math.random())
        .slice(0, 2)
        .map(penalty => ({ key: penalty, label: penalty }))
    : [];

  return (
    <div className="analytics-grid">
      <div className="analytics-card glass">
        <div className="analytics-card-title">팀 공격력 (선발 평균)</div>
        <RadarChart axes={toAxes(attack)} max={max} series={[
          { name: oppTeam.name, color: OPP_COLOR, values: toValues(oppAttack) },
          { name: team.name, color: PLAYER_A_COLOR, values: toValues(attack) },
        ]} />
        <RadarLegend team={team} oppTeam={oppTeam} />
      </div>
      <div className="analytics-card glass">
        <div className="analytics-card-title">팀 수비력 (선발 평균)</div>
        <RadarChart axes={toAxes(defense)} max={max} series={[
          { name: oppTeam.name, color: OPP_COLOR, values: toValues(oppDefense) },
          { name: team.name, color: PLAYER_A_COLOR, values: toValues(defense) },
        ]} />
        <RadarLegend team={team} oppTeam={oppTeam} />
      </div>

      <AttrChips title="강점 TOP 3" items={strengths} tone="good" />
      <AttrChips title="약점 TOP 3" items={weaknesses} tone="bad" />
      <PenaltyChips title="전술적 결함" items={topPenalties} tone="bad" />

      <AiSuggestionPanel
        suggestion={aiSuggestion}
        loading={aiLoading}
        error={aiError}
        disabled={!winProb}
        onRequest={onRequestAiSuggestion}
      />
    </div>
  );
}

function PlayerPhoto({ player }) {
  return (
    <div className="compare-photo">
      <span className="photo-no num">{jerseyNumber(player.id)}</span>
      <span className="photo-note">PHOTO</span>
      <img
        key={player.id}
        src={`/players/${player.id}.png`}
        alt={player.name}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    </div>
  );
}

function PlayerComparePanel({ team, oppTeam }) {
  const myOutfield = team.players.filter(p => !p.positions.includes('GK'));
  const oppOutfield = oppTeam.players.filter(p => !p.positions.includes('GK'));
  const [myId, setMyId] = useState(myOutfield[0]?.id);
  const [oppId, setOppId] = useState(oppOutfield[0]?.id);
  const myPlayer = myOutfield.find(p => p.id === myId);
  const oppPlayer = oppOutfield.find(p => p.id === oppId);
  const axes = ATTRIBUTE_LABELS.map(([key, label]) => ({ key, label }));

  return (
    <div className="analytics-grid">
      <div className="analytics-card glass compare-card">
        <div className="analytics-card-title">선수 비교 — 우리 팀 vs 상대 팀 (GK 제외)</div>

        <div className="compare-sides">
          <div className="compare-side mine">
            <PlayerSelect players={myOutfield} value={myId} onChange={setMyId} />
            {myPlayer && (
              <>
                <PlayerPhoto player={myPlayer} />
                <div className="compare-side-name">{myPlayer.name}</div>
              </>
            )}
          </div>

          <span className="compare-vs">VS</span>

          <div className="compare-side opp">
            <PlayerSelect players={oppOutfield} value={oppId} onChange={setOppId} />
            {oppPlayer && (
              <>
                <PlayerPhoto player={oppPlayer} />
                <div className="compare-side-name">{oppPlayer.name}</div>
              </>
            )}
          </div>
        </div>

        {myPlayer && oppPlayer && (
          <>
            <RadarChart
              axes={axes} max={100}
              series={[
                { name: oppPlayer.name, color: OPP_COLOR, values: oppPlayer.attributes },
                { name: myPlayer.name, color: MY_COLOR, values: myPlayer.attributes },
              ]}
            />
            <table className="compare-table">
              <thead>
                <tr><th>스탯</th><th>{myPlayer.name}</th><th>{oppPlayer.name}</th></tr>
              </thead>
              <tbody>
                {axes.map(ax => (
                  <tr key={ax.key}>
                    <td>{ax.label}</td>
                    <td className="num">{myPlayer.attributes[ax.key]}</td>
                    <td className="num">{oppPlayer.attributes[ax.key]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeamAnalyticsBoard({ team, oppTeam, oppTacticPreset, players, winProb, onCalculateWinProbability, aiSuggestion, aiLoading, aiError, onRequestAiSuggestion, onBack }) {
  useEffect(() => {
    if (!winProb) {
      onCalculateWinProbability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <button className="btn-ghost" onClick={onBack}>← 포메이션으로</button>
      </div>

      <div className="analytics-split">
        <TeamAnalysisPanel
          team={team}
          oppTeam={oppTeam}
          oppTacticPreset={oppTacticPreset}
          players={players}
          winProb={winProb}
          aiSuggestion={aiSuggestion}
          aiLoading={aiLoading}
          aiError={aiError}
          onRequestAiSuggestion={onRequestAiSuggestion}
        />
        <PlayerComparePanel team={team} oppTeam={oppTeam} />
      </div>
    </div>
  );
}
