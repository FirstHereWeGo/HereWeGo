import { useGameState } from '../state/GameContext';
import { SCENES } from '../data/squad';
import Sidebar from './Sidebar';
import PitchBoard from './PitchBoard';
import TacticalGauge from './TacticalGauge';
import PlayerCard from './PlayerCard';
import BenchList from './BenchList';

export default function TacticalBoard({ onBackToScene, onShowResult }) {
  const state = useGameState();
  if (!state.scene) return null;
  const sc = SCENES[state.scene];

  return (
    <section className="view-board">
      <div className="matchbar">
        <div className="mb-score">
          <span>대한민국</span><span className="num">0 : 1</span><span>남아공</span>
        </div>
        <div className="mb-clock num">{sc.clock}</div>
        <div className="mb-scene">{sc.label}</div>
        <div className="mb-spacer" />
        <button className="btn-ghost" onClick={onBackToScene}>장면 다시 선택</button>
        <button className="btn-result" onClick={onShowResult}>결과 보기 ▸</button>
      </div>

      <div className="board-body">
        <Sidebar />
        <PitchBoard />
        <aside className="rightbar">
          <TacticalGauge />
          <PlayerCard />
          <BenchList />
        </aside>
      </div>
    </section>
  );
}
