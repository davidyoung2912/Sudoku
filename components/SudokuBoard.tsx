import React, { useState } from 'react';
import { Grid, CellCoords } from '../types';
import { getValidNumbersForCell } from '../services/logic';
import { NumberPopup } from './NumberPopup';
import clsx from 'clsx';

interface SudokuBoardProps {
  initialBoard: Grid;
  currentBoard: Grid;
  impossibleCells: string[];
  onCellChange: (row: number, col: number, val: number) => void;
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({ initialBoard, currentBoard, impossibleCells, onCellChange }) => {
  const [activeCell, setActiveCell] = useState<CellCoords | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  
  const [validNumbers, setValidNumbers] = useState<number[]>([]);

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    if (initialBoard[row][col] !== 0) {
      return;
    }

    // Create a temp board where current cell is 0 to check possibilities
    const tempBoard = currentBoard.map(r => [...r]);
    tempBoard[row][col] = 0;
    const trueValidMoves = getValidNumbersForCell(tempBoard, row, col);

    setValidNumbers(trueValidMoves);
    setActiveCell({ row, col });
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom
    });
  };

  const handleNumberSelect = (num: number) => {
    if (activeCell) {
      onCellChange(activeCell.row, activeCell.col, num);
      closePopup();
    }
  };

  const handleClearCell = () => {
    if (activeCell) {
      onCellChange(activeCell.row, activeCell.col, 0);
      closePopup();
    }
  };

  const closePopup = () => {
    setActiveCell(null);
    setPopupPosition(null);
  };

  return (
    <>
      <div className="inline-block border-4 border-slate-800 rounded-lg overflow-hidden shadow-xl bg-slate-800 select-none">
        <div className="grid grid-cols-9 gap-[1px] bg-slate-300 border-[1px] border-slate-800">
          {currentBoard.map((row, rIndex) => (
            row.map((cellValue, cIndex) => {
              const isInitial = initialBoard[rIndex][cIndex] !== 0;
              const isRightBorder = (cIndex + 1) % 3 === 0 && cIndex !== 8;
              const isBottomBorder = (rIndex + 1) % 3 === 0 && rIndex !== 8;
              const cellKey = `${rIndex}-${cIndex}`;
              const isImpossible = impossibleCells.includes(cellKey);
              
              return (
                <div
                  key={cellKey}
                  onClick={(e) => handleCellClick(rIndex, cIndex, e)}
                  className={clsx(
                    "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl cursor-pointer transition-colors duration-75",
                    isImpossible && cellValue === 0 ? "bg-red-200 hover:bg-red-300" : "bg-white hover:bg-indigo-50",
                    // Borders for 3x3 grids
                    isRightBorder && "!border-r-2 !border-r-slate-800",
                    isBottomBorder && "!border-b-2 !border-b-slate-800",
                    // Text styling
                    isInitial ? "font-extrabold text-slate-900" : "font-medium text-indigo-600",
                    // Active state
                    activeCell?.row === rIndex && activeCell?.col === cIndex ? "bg-indigo-100 ring-inset ring-2 ring-indigo-500" : ""
                  )}
                >
                  {cellValue !== 0 ? cellValue : ''}
                </div>
              );
            })
          ))}
        </div>
      </div>

      {activeCell && popupPosition && (
        <NumberPopup 
          validNumbers={validNumbers}
          onSelect={handleNumberSelect}
          onClose={closePopup}
          onClear={handleClearCell}
          position={popupPosition}
        />
      )}
    </>
  );
};
