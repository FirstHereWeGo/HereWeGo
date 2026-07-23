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
  const [tournamentStarted, setTournamentStarted] = useState(false);

  function startTournament(myTeamId) {
    setTeams({ myTeamId, oppTeamId: null });
    setTournamentStarted(true);
    setView('tournament');
  }

  // "전술 수정" 버튼에서 넘어올 때 — 대진표에서 계산한 이번 라운드 상대로 Board를 연다.
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
          onTournament={() => setView('tournament')}
        />
      )}
      {/* Board와 왕복해도 대진표 진행 상황이 유지되도록 한번 시작하면 계속 마운트해두고 숨김만 처리한다. */}
      {tournamentStarted && teams && (
        <div style={{ display: view === 'tournament' ? 'contents' : 'none' }}>
          <Tournament
            myTeamId={teams.myTeamId}
            onBack={goToBoard}
            onHome={() => setView('landing')}
          />
        </div>
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
