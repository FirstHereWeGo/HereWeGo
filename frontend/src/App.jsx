import { useState } from 'react';
import { GameProvider, useGameActions } from './state/GameContext';
import Landing from './components/Landing';
import TacticalBoard from './components/TacticalBoard';
import ResultView from './components/ResultView';
import './styles/global.css';

function AppInner() {
  const [view, setView] = useState('landing'); // landing | board | result
  const [summary, setSummary] = useState(null);
  const [boardKey, setBoardKey] = useState(0);
  const { resetMatch } = useGameActions();

  function startMatch() {
    resetMatch();
    setBoardKey(k => k + 1); // 보드 전체 리마운트로 매치 상태 초기화
    setView('board');
  }
  function handleFinish(s) {
    setSummary(s);
    setView('result');
  }

  return (
    <>
      {view === 'landing' && <Landing onEnter={startMatch} />}
      {view === 'board' && <TacticalBoard key={boardKey} onFinish={handleFinish} />}
      {view === 'result' && (
        <ResultView summary={summary} onRestart={startMatch} onHome={() => setView('landing')} />
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
