import { useEffect, useState } from 'react';
import { computeTeamAnalytics, computeGroupComparison, computeStatLeaders, computeMatchupComparison } from '../utils/teamAnalytics';
import { ATTRIBUTE_LABELS, KEY_ATTRS } from '../data/positionLabels';
import { jerseyNumber } from '../utils/playerDisplay';
import RadarChart from './RadarChart';
import PlayerSelect from './PlayerSelect';

const PLAYER_A_COLOR = '#34e07a'; // 팀 공격력 레이더 색
const MY_COLOR = '#34e07a';
const OPP_COLOR = '#ef5350';

/** model이 붙여 보내는 synergy.category → 표시용 섹션 이름. 이 순서대로 그린다. */
const SYNERGY_CATEGORIES = [
  ['style', '전술 정체성'],
  ['inPossession', '공격 전개'],
  ['opponentHalf', '상대 진영'],
  ['transitions', '공수 전환'],
  ['outOfPossession', '수비 형태'],
  ['squad', '스쿼드 구성'],
];

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

/** 두 팀의 전술 정체성(스타일 라벨 + 스쿼드 적합도)을 나란히 보여주는 배지 줄. */
function StyleBadges({ team, oppTeam, winProb, oppWinProb }) {
  const sides = [
    { side: 'mine', name: team.name, outcome: winProb },
    { side: 'opp', name: oppTeam.name, outcome: oppWinProb },
  ];

  return (
    <div className="analytics-card glass analytics-card-large">
      <div className="analytics-card-title">전술 정체성</div>
      <div className="style-badge-row">
        {sides.map(({ side, name, outcome }) => (
          <div className={`style-badge ${side}`} key={side}>
            <div className="style-badge-team">{name}</div>
            <div className="style-badge-label">{outcome?.styleLabel || '—'}</div>
            <div className="style-badge-fit">
              <div className="style-badge-meter">
                <div className={`style-badge-meter-fill ${side}`} style={{ width: `${outcome?.styleFit ?? 0}%` }} />
              </div>
              <span className="num">{outcome?.styleFit ?? '—'}</span>
              <span className="style-badge-unit">점</span>
            </div>
          </div>
        ))}
      </div>
      <div className="analytics-note">스쿼드가 지금 짜둔 전술을 얼마나 소화하는지의 적합도 (50점 = 보통)</div>
    </div>
  );
}

/** GK/DF/MF/FW 라인별 스탯을 좌(우리)·우(상대) 마주보는 막대로 비교한다. */
function GroupComparison({ team, oppTeam, players, oppPlayers }) {
  const lines = computeGroupComparison(players, oppPlayers);

  return (
    <div className="analytics-card glass analytics-card-large">
      <div className="analytics-card-title">포지션별 능력치 비교 (선발 평균)</div>
      <RadarLegend team={team} oppTeam={oppTeam} />

      <div className="grp-lines">
        {lines.map(line => (
          <div className="grp-line" key={line.key}>
            <div className="grp-line-head">
              {line.label}
              <span className="grp-line-count">{line.mineCount} : {line.oppCount}</span>
            </div>
            {line.rows.map(row => {
              // 표시값(반올림) 기준으로 비교해야 화면상 같은 숫자인데 한쪽만 강조되는 일이 없다.
              const mineVal = Math.round(row.mine);
              const oppVal = Math.round(row.opp);
              const lead = mineVal === oppVal ? 'tie' : mineVal > oppVal ? 'mine' : 'opp';
              return (
                <div className="grp-row" key={row.key}>
                  <span className={`grp-val num mine ${lead === 'mine' ? 'lead' : ''}`}>{mineVal}</span>
                  <div className="grp-track mine">
                    <div className={`grp-fill mine ${lead === 'mine' ? 'lead' : ''}`} style={{ width: `${row.mine}%` }} />
                  </div>
                  <span className="grp-attr">{row.label}</span>
                  <div className="grp-track opp">
                    <div className={`grp-fill opp ${lead === 'opp' ? 'lead' : ''}`} style={{ width: `${row.opp}%` }} />
                  </div>
                  <span className={`grp-val num opp ${lead === 'opp' ? 'lead' : ''}`}>{oppVal}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 스탯별 1위 선수를 두 팀 나란히 놓고, 더 높은 쪽을 강조한다. */
function StatLeaderCompare({ team, oppTeam, players, oppPlayers }) {
  const mine = computeStatLeaders(players);
  const opp = computeStatLeaders(oppPlayers);

  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title">스탯 리더 비교 (선발 11인)</div>
      <RadarLegend team={team} oppTeam={oppTeam} />

      <div className="leader-list">
        {mine.map((m, i) => {
          const o = opp[i];
          // computeStatLeaders는 두 팀 모두 같은 카테고리 순서로 돌려주므로 인덱스로 짝지어도 안전하다.
          const lead = m.value === o.value ? 'tie' : m.value > o.value ? 'mine' : 'opp';
          return (
            <div className="leader-row" key={m.key}>
              <div className={`leader-side mine ${lead === 'mine' ? 'lead' : ''}`}>
                <span className="leader-name">{m.player?.name ?? '—'}</span>
                {m.player && <span className="leader-no num">{jerseyNumber(m.player.id)}</span>}
                <span className="leader-val num">{m.value}</span>
              </div>
              <div className="leader-cat">{m.title}</div>
              <div className={`leader-side opp ${lead === 'opp' ? 'lead' : ''}`}>
                <span className="leader-val num">{o.value}</span>
                {o.player && <span className="leader-no num">{jerseyNumber(o.player.id)}</span>}
                <span className="leader-name">{o.player?.name ?? '—'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 실제로 맞상대하는 같은 포지션끼리(우리 ST vs 상대 ST 등) 대표 스탯을 비교한다. */
function PositionMatchup({ team, oppTeam, players, oppPlayers }) {
  const rows = computeMatchupComparison(players, oppPlayers);

  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title">포지션별 맞대결</div>
      <RadarLegend team={team} oppTeam={oppTeam} />

      <div className="leader-list">
        {rows.map(row => {
          const mineVal = Math.round(row.mine);
          const oppVal = Math.round(row.opp);
          const lead = mineVal === oppVal ? 'tie' : mineVal > oppVal ? 'mine' : 'opp';
          return (
            <div className="leader-row" key={row.key}>
              <div className={`leader-side mine ${lead === 'mine' ? 'lead' : ''}`}>
                {row.mineCount > 1 && <span className="leader-no num">×{row.mineCount}</span>}
                <span className="leader-val num">{mineVal}</span>
              </div>
              <div className="leader-cat">{row.label}</div>
              <div className={`leader-side opp ${lead === 'opp' ? 'lead' : ''}`}>
                <span className="leader-val num">{oppVal}</span>
                {row.oppCount > 1 && <span className="leader-no num">×{row.oppCount}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** model이 계산한 전술 시너지/페널티를 섹션별로 전부 펼친다. */
function SynergyReport({ synergies }) {
  if (!synergies || synergies.length === 0) {
    return (
      <div className="analytics-card glass">
        <div className="analytics-card-title">시너지 리포트</div>
        <div className="analytics-empty">분석 데이터가 없습니다. 먼저 예측 승률을 계산해주세요.</div>
      </div>
    );
  }

  const goodCount = synergies.filter(s => s.tone === 'good').length;
  const sections = SYNERGY_CATEGORIES
    .map(([key, label]) => ({ key, label, items: synergies.filter(s => s.category === key) }))
    .filter(section => section.items.length > 0);

  return (
    <div className="analytics-card glass">
      <div className="analytics-card-title">
        시너지 리포트
        <span className="synergy-tally">
          <b className="good">시너지 {goodCount}</b>
          <b className="bad">페널티 {synergies.length - goodCount}</b>
        </span>
      </div>

      <div className="synergy-sections">
        {sections.map(section => (
          <div className="synergy-section" key={section.key}>
            <div className="synergy-section-title">{section.label}</div>
            {section.items.map(item => (
              <div className={`synergy-item ${item.tone}`} key={item.key}>
                <span className="synergy-mark">{item.tone === 'good' ? '▲' : '▼'}</span>
                <div className="synergy-body">
                  <div className="synergy-label">{item.label}</div>
                  {item.detail && <div className="synergy-detail">{item.detail}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamAnalysisPanel({ team, oppTeam, players, oppPlayers, winProb, oppWinProb }) {
  const { attack, defense, strengths, weaknesses, max } = computeTeamAnalytics(players);
  const { attack: oppAttack, defense: oppDefense } = computeTeamAnalytics(oppPlayers);
  const toAxes = arr => arr.map(s => ({ key: s.key, label: s.label }));
  const toValues = arr => Object.fromEntries(arr.map(s => [s.key, s.value]));

  return (
    <div className="analytics-grid team-grid">
      <StyleBadges team={team} oppTeam={oppTeam} winProb={winProb} oppWinProb={oppWinProb} />

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

      <GroupComparison team={team} oppTeam={oppTeam} players={players} oppPlayers={oppPlayers} />

      <SynergyReport synergies={winProb?.synergies} />

      <div className="analytics-stack">
        <AttrChips title="강점 TOP 3" items={strengths} tone="good" />
        <AttrChips title="약점 TOP 3" items={weaknesses} tone="bad" />
      </div>
    </div>
  );
}

/** 선수 비교 헤드라인용 "포지션별 대표 스탯" - 그 포지션의 핵심 스탯(KEY_ATTRS) 평균을 대표값으로 쓴다. */
function positionStat(attributes, pos) {
  const keys = KEY_ATTRS[pos] ?? ATTRIBUTE_LABELS.map(([key]) => key);
  const sum = keys.reduce((s, key) => s + attributes[key], 0);
  return Math.round(sum / keys.length);
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
                <div className="compare-headline">
                  {myPlayer.positions.map(pos => (
                    <div className="compare-headline-item" key={pos}>
                      <span className="compare-headline-pos">{pos}</span>
                      <span className="compare-headline-val num">{positionStat(myPlayer.attributes, pos)}</span>
                    </div>
                  ))}
                </div>
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
                <div className="compare-headline">
                  {oppPlayer.positions.map(pos => (
                    <div className="compare-headline-item" key={pos}>
                      <span className="compare-headline-pos">{pos}</span>
                      <span className="compare-headline-val num">{positionStat(oppPlayer.attributes, pos)}</span>
                    </div>
                  ))}
                </div>
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
            <div className="compare-stats">
              {axes.map(ax => {
                const myVal = myPlayer.attributes[ax.key];
                const oppVal = oppPlayer.attributes[ax.key];
                const diff = myVal - oppVal;
                return (
                  <div className="compare-row" key={ax.key}>
                    <div className="compare-row-side left">
                      {diff > 0 && <span className="compare-row-diff mine">{diff}</span>}
                      {diff > 0 && <span className="compare-row-arrow mine">▲</span>}
                      <span className={`compare-row-val num ${diff > 0 ? 'stat-lead mine' : ''}`}>{myVal}</span>
                    </div>
                    <div className="compare-row-label">{ax.label}</div>
                    <div className="compare-row-side right">
                      <span className={`compare-row-val num ${diff < 0 ? 'stat-lead opp' : ''}`}>{oppVal}</span>
                      {diff < 0 && <span className="compare-row-arrow opp">▲</span>}
                      {diff < 0 && <span className="compare-row-diff opp">{-diff}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TeamAnalyticsBoard({ team, oppTeam, oppTacticPreset, players, winProb, oppWinProb, onCalculateWinProbability }) {
  useEffect(() => {
    if (!winProb) {
      onCalculateWinProbability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const oppPlayers = startingElevenMap(oppTeam.players, oppTacticPreset?.goalkeeperId, oppTacticPreset?.startingPlayerIds);

  return (
    <div className="analytics-page">
      <div className="analytics-split">
        <TeamAnalysisPanel
          team={team}
          oppTeam={oppTeam}
          players={players}
          oppPlayers={oppPlayers}
          winProb={winProb}
          oppWinProb={oppWinProb}
        />
        <div className="analytics-right-col">
          <PlayerComparePanel team={team} oppTeam={oppTeam} />
          <div className="matchup-split">
            <StatLeaderCompare team={team} oppTeam={oppTeam} players={players} oppPlayers={oppPlayers} />
            <PositionMatchup team={team} oppTeam={oppTeam} players={players} oppPlayers={oppPlayers} />
          </div>
        </div>
      </div>
    </div>
  );
}
