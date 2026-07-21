import { useState } from 'react';
import { GameProvider } from './state/GameContext';
import Landing from './components/Landing';
import TeamSelect from './components/TeamSelect';
import TacticalBoard from './components/TacticalBoard';
import Tournament from './components/Tournament';
import './styles/global.css';

function AppInner() {
  const [view, setView] = useState('landing'); // landing | teamSelect | board | tournament
  const [boardKey, setBoardKey] = useState(0);
  const [teams, setTeams] = useState(null); // { myTeamId, oppTeamId }

  function startTournament(myTeamId) {
    setTeams({ myTeamId, oppTeamId: null });
    setView('tournament');
  }

  // 토너먼트 화면의 "포메이션으로"에서 넘어올 때 — 8강 1경기 상대를 연습 상대로 삼는다.
  function goToBoard(oppTeamId) {
    setTeams(t => ({ ...t, oppTeamId }));
    setBoardKey(k => k + 1); // TacticalBoard를 새 상태로 다시 마운트
    setView('board');
  }

  return (
    <>
      {view === 'landing' && <Landing onEnter={() => setView('teamSelect')} />}
      {view === 'teamSelect' && <TeamSelect onStartTournament={startTournament} />}
      {view === 'board' && teams?.oppTeamId && (
        <TacticalBoard
          key={boardKey}
          myTeamId={teams.myTeamId}
          oppTeamId={teams.oppTeamId}
          onHome={() => setView('landing')}
          onChangeTeams={() => setView('teamSelect')}
        />
      )}
      {view === 'tournament' && teams && (
        <Tournament
          myTeamId={teams.myTeamId}
          onBack={goToBoard}
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
