import { useState, useEffect } from 'react';
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

  // ⭐ [핵심 1] 앱 접속 시 백그라운드에서 대한민국 스쿼드와 경기 상태를 미리 100% 세팅!
  useEffect(() => {
    resetMatch();
  }, []);

  // ⭐ [핵심 2] '시작하기' 버튼 클릭 시 스쿼드 초기화를 보장하고 보드 화면으로 이동!
  function startMatch() {
    resetMatch(); // 경기 및 라인업 상태를 최신 선발 스쿼드로 리셋
    setBoardKey(k => k + 1); // TacticalBoard를 완전히 새로운 상태로 마운트 (버그 방지)
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