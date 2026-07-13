import { useState } from 'react';
import { GameProvider, useGameActions, useGameState } from './state/GameContext';
import Landing from './components/Landing';
import SceneSelect from './components/SceneSelect';
import TacticalBoard from './components/TacticalBoard';
import ResultView from './components/ResultView';
import './styles/global.css';

function AppInner() {
  const [view, setView] = useState('landing'); // landing | scene | board | result
  const { startScene, recalc } = useGameActions();
  const state = useGameState();

  function handlePickScene(key) {
    startScene(key);
    setView('board');
    // 초기 xG/승률 계산
    setTimeout(recalc, 0);
  }

  function handleShowResult() {
    recalc();
    setView('result');
  }

  function handleRetry() {
    if (state.scene) handlePickScene(state.scene);
  }

  return (
    <>
      {view === 'landing' && <Landing onEnter={() => setView('scene')} />}
      {view === 'scene' && (
        <SceneSelect onPick={handlePickScene} onBack={() => setView('landing')} />
      )}
      {view === 'board' && (
        <TacticalBoard
          onBackToScene={() => setView('scene')}
          onShowResult={handleShowResult}
        />
      )}
      {view === 'result' && (
        <ResultView
          onRetry={handleRetry}
          onPickScene={() => setView('scene')}
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
