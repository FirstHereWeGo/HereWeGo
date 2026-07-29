import RadarChart from './RadarChart';
import StatTornadoRow from './StatTornadoRow';
import PitchZoneMap from './PitchZoneMap';
import PassZoneMap from './PassZoneMap';
import StatMomentumSpark from './StatMomentumSpark';
import { buildStatGroups, buildChannelIntensity, buildPassZones, buildStyleAxes } from '../utils/liveMatchStats';

const GROUP_TITLES = { flow: '경기 흐름', shooting: '슈팅', passing: '패스', duel: '경합' };

export default function LiveMatchDashboard({ stats, events, momentum, colorA, colorB, teamAName, teamBName, mineIsA }) {
  if (!stats) {
    return <div className="dash-skeleton">지표를 불러오는 중...</div>;
  }

  const groups = buildStatGroups(stats);
  const channels = buildChannelIntensity(stats);
  const zones = buildPassZones(stats);
  const style = buildStyleAxes(stats);

  return (
    <div className="livematch-dashboard">
      <div className="dash-col dash-space">
        <div className="dash-panel-title">공간 <span className="dash-panel-sub">파이널 서드 진입 · 채널 강도</span></div>
        <PitchZoneMap channels={channels} colorA={colorA} colorB={colorB} mineIsA={mineIsA} />

        <div className="dash-panel-title dash-panel-title-spaced">패스 성공 <span className="dash-panel-sub">전방·중간·후방 · 받은 패스</span></div>
        <PassZoneMap zones={zones} colorA={colorA} colorB={colorB} mineIsA={mineIsA} />
      </div>

      <div className="dash-col dash-center">
        <div className="dash-panel-title">지표 대결</div>
        {Object.entries(groups).map(([key, rows]) => (
          <div className="tornado-group" key={key}>
            <div className="tornado-group-title">{GROUP_TITLES[key]}</div>
            {rows.map(row => (
              <StatTornadoRow key={row.label} label={row.label} a={row.a} b={row.b} unit={row.unit ?? ''} colorA={colorA} colorB={colorB} />
            ))}
          </div>
        ))}
      </div>

      <div className="dash-col dash-side">
        <div className="dash-panel-title">팀 성향</div>
        <RadarChart
          axes={style.axes}
          max={style.max}
          size={200}
          series={[
            { name: teamAName, color: colorA, values: style.a },
            { name: teamBName, color: colorB, values: style.b },
          ]}
        />
        <div className="dash-radar-legend">
          <span><i style={{ background: colorA }} />{teamAName}</span>
          <span><i style={{ background: colorB }} />{teamBName}</span>
        </div>

        <div className="dash-momentum-block">
          <div className="dash-panel-title dash-panel-title-spaced">흐름 추이 <span className="dash-panel-sub">점유율 · 구간별</span></div>
          <StatMomentumSpark momentum={momentum} events={events} colorA={colorA} colorB={colorB} mineIsA={mineIsA} />
        </div>
      </div>
    </div>
  );
}
