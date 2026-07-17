import { useState } from 'react';
import { GameProvider } from './state/GameContext';
import Landing from './components/Landing';
import TacticalBoard from './components/TacticalBoard';
import './styles/global.css';

function AppInner() {
  const [view, setView] = useState('landing'); // landing | board
  const [boardKey, setBoardKey] = useState(0);

  function startMatch() {
    setBoardKey(k => k + 1); // TacticalBoard를 새 상태로 다시 마운트
    setView('board');
  }

  return (
    <>
      {view === 'landing' && <Landing onEnter={startMatch} />}
      {view === 'board' && <TacticalBoard key={boardKey} onHome={() => setView('landing')} />}
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
