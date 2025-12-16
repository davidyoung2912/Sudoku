import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Star, RefreshCw, Play, Zap, RotateCcw, Timer, Trophy, AlertCircle } from 'lucide-react';
import { Difficulty, Grid, GameState } from './types';
import { generateSudokuPuzzle } from './services/gemini';
import { copyGrid, isBoardComplete, findImpossibleCells } from './services/logic';
import { SudokuBoard } from './components/SudokuBoard';
import { Spinner } from './components/Spinner';

const EmptyGrid: Grid = Array(9).fill(null).map(() => Array(9).fill(0));

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [difficulty, setDifficulty] = useState<number>(1);
  const [initialBoard, setInitialBoard] = useState<Grid>(EmptyGrid);
  const [currentBoard, setCurrentBoard] = useState<Grid>(EmptyGrid);
  const [solutionBoard, setSolutionBoard] = useState<Grid>(EmptyGrid);
  const [error, setError] = useState<string | null>(null);
  
  // New Game Stats
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [impossibleCells, setImpossibleCells] = useState<string[]>([]);
  const [hasGivenUp, setHasGivenUp] = useState(false);

  const timerInterval = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      timerInterval.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (!isActive && timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [isActive]);

  const startGame = async (stars: number) => {
    setDifficulty(stars);
    setGameState('loading');
    setError(null);

    try {
      const data = await generateSudokuPuzzle(stars);
      setInitialBoard(data.initial);
      setCurrentBoard(copyGrid(data.initial)); 
      setSolutionBoard(data.solution);
      
      // Reset stats
      setTimer(0);
      setMistakes(0);
      setTotalMoves(0);
      setImpossibleCells([]);
      setHasGivenUp(false);
      setIsActive(true);
      setGameState('playing');
    } catch (err) {
      console.error(err);
      setError("Failed to generate puzzle. Please check your internet or API key.");
      setGameState('menu');
    }
  };

  const handleCellChange = useCallback((row: number, col: number, val: number) => {
    // Logic for scoring tracking
    if (val !== 0) {
      setTotalMoves(prev => prev + 1);
      if (solutionBoard[row][col] !== 0 && val !== solutionBoard[row][col]) {
        setMistakes(prev => prev + 1);
      }
    }

    const newBoard = copyGrid(currentBoard);
    newBoard[row][col] = val;
    setCurrentBoard(newBoard);

    // Check for impossible cells (cells with no valid moves)
    const impossible = findImpossibleCells(newBoard);
    setImpossibleCells(impossible);

  }, [currentBoard, solutionBoard]);

  const handleSolve = () => {
    setIsActive(false);
    setHasGivenUp(true);
    setCurrentBoard(copyGrid(solutionBoard));
    setImpossibleCells([]);
  };

  const handleRestart = () => {
    setCurrentBoard(copyGrid(initialBoard));
    setTimer(0);
    setMistakes(0);
    setTotalMoves(0);
    setImpossibleCells([]);
    setHasGivenUp(false);
    setIsActive(true);
  };

  const handleNewGame = () => {
    setIsActive(false);
    setGameState('menu');
    setInitialBoard(EmptyGrid);
    setCurrentBoard(EmptyGrid);
    setSolutionBoard(EmptyGrid);
    setImpossibleCells([]);
    setHasGivenUp(false);
  };

  const isComplete = gameState === 'playing' && isBoardComplete(currentBoard) && !hasGivenUp;
  
  useEffect(() => {
    if (isComplete) {
      setIsActive(false);
    }
  }, [isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const baseScore = difficulty * 1000;
    const timeDeduction = timer * 2;
    const mistakeDeduction = mistakes * 50;
    return Math.max(0, baseScore - timeDeduction - mistakeDeduction);
  };

  const getAccuracy = () => {
    if (totalMoves === 0) return 100;
    const correctMoves = Math.max(0, totalMoves - mistakes);
    return Math.round((correctMoves / totalMoves) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center py-8 sm:py-12 px-4 font-sans">
      
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center justify-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
             <Star className="w-8 h-8 fill-current" />
          </div>
          Stellar Sudoku
        </h1>
      </header>

      <main className="w-full max-w-3xl flex flex-col items-center">
        
        {gameState === 'menu' && (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Select Difficulty</h2>
            
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => startGame(star)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 group"
                >
                  <span className="font-semibold text-slate-700 group-hover:text-indigo-700 text-lg">
                    {star === 1 ? 'Rookie' : 
                     star === 2 ? 'Apprentice' : 
                     star === 3 ? 'Expert' : 
                     star === 4 ? 'Master' : 'Grandmaster'}
                  </span>
                  <div className="flex gap-0.5">
                    {Array(5).fill(0).map((_, i) => (
                      <Star 
                        key={i} 
                        size={20} 
                        className={i < star ? "fill-amber-400 text-amber-400" : "text-slate-200"}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}
          </div>
        )}

        {gameState === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-pulse py-12">
            <Spinner />
            <p className="text-lg font-medium text-slate-600">Consulting the stars...</p>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col items-center gap-6 w-full animate-in fade-in duration-500">
            
            <div className="flex items-center justify-between w-full max-w-md bg-white p-3 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600">
                  <Timer size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Time</p>
                  <p className="text-lg font-mono font-semibold text-slate-800 leading-none">{formatTime(timer)}</p>
                </div>
              </div>

              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-500">Diff:</span>
                 <div className="flex">
                   {Array(difficulty).fill(0).map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                   ))}
                 </div>
              </div>
            </div>

            <div className="relative">
              <SudokuBoard 
                initialBoard={initialBoard} 
                currentBoard={currentBoard}
                impossibleCells={impossibleCells}
                onCellChange={handleCellChange}
              />
              
              {isComplete && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg animate-in fade-in zoom-in duration-300">
                  <div className="bg-white p-6 rounded-2xl shadow-2xl border-4 border-green-500 text-center transform w-64">
                    <div className="inline-flex p-3 rounded-full bg-green-100 text-green-600 mb-3">
                       <Trophy size={32} className="fill-current" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1">Solved!</h3>
                    
                    <div className="space-y-2 my-4 text-sm">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Score</span>
                        <span className="font-bold text-slate-800">{calculateScore()}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500">Time</span>
                        <span className="font-medium text-slate-800">{formatTime(timer)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Accuracy</span>
                        <span className="font-medium text-slate-800">{getAccuracy()}%</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleNewGame}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition shadow-lg"
                    >
                      Next Puzzle
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              <button
                onClick={handleRestart}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all shadow-sm hover:shadow-md"
              >
                <RotateCcw size={20} />
                <span className="font-semibold text-xs">Restart</span>
              </button>

              <button
                onClick={handleSolve}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-white rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-indigo-600 transition-all shadow-sm hover:shadow-md"
              >
                <Zap size={20} />
                <span className="font-semibold text-xs">Solve</span>
              </button>

              <button
                onClick={handleNewGame}
                className="flex flex-col items-center justify-center gap-1 p-3 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all shadow-sm hover:shadow-md"
              >
                <RefreshCw size={20} />
                <span className="font-semibold text-xs">New Game</span>
              </button>
            </div>
            
            {impossibleCells.length > 0 && !isComplete && (
               <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-full text-sm font-medium animate-bounce">
                 <AlertCircle size={16} />
                 <span>{impossibleCells.length} cell{impossibleCells.length > 1 ? 's' : ''} blocked! Check your moves.</span>
               </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
};

export default App;