import { useState } from 'react';
import { GameProvider } from './state/GameContext';
import Landing from './components/Landing';
import TeamSelect from './components/TeamSelect';
import TacticalBoard from './components/TacticalBoard';
import './styles/global.css';

function AppInner() {
  const [view, setView] = useState('landing'); // landing | teamSelect | board
  const [boardKey, setBoardKey] = useState(0);
  const [teams, setTeams] = useState(null); // { myTeamId, oppTeamId }

  function startMatch(myTeamId, oppTeamId) {
    setTeams({ myTeamId, oppTeamId });
    setBoardKey(k => k + 1); // TacticalBoard를 새 상태로 다시 마운트
    setView('board');
  }

  return (
    <>
      {view === 'landing' && <Landing onEnter={() => setView('teamSelect')} />}
      {view === 'teamSelect' && <TeamSelect onConfirm={startMatch} />}
      {view === 'board' && teams && (
        <TacticalBoard
          key={boardKey}
          myTeamId={teams.myTeamId}
          oppTeamId={teams.oppTeamId}
          onHome={() => setView('landing')}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}
