import { Grid } from '../types';

// Standard Sudoku 9x9 Logic

export const isValidMove = (board: Grid, row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num && x !== col) return false;
  }

  // Check col
  for (let y = 0; y < 9; y++) {
    if (board[y][col] === num && y !== row) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentVal = board[startRow + i][startCol + j];
      if (currentVal === num && (startRow + i !== row || startCol + j !== col)) {
        return false;
      }
    }
  }

  return true;
};

export const getValidNumbersForCell = (board: Grid, row: number, col: number): number[] => {
  const validNumbers: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (isValidMove(board, row, col, n)) {
      validNumbers.push(n);
    }
  }
  return validNumbers;
};

export const isBoardComplete = (board: Grid): boolean => {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return false;
      if (!isValidMove(board, r, c, board[r][c])) return false;
    }
  }
  return true;
};

export const copyGrid = (grid: Grid): Grid => {
  return grid.map(row => [...row]);
};

export const findImpossibleCells = (board: Grid): string[] => {
  const impossible: string[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      // Only check empty cells
      if (board[r][c] === 0) {
        const validMoves = getValidNumbersForCell(board, r, c);
        if (validMoves.length === 0) {
          impossible.push(`${r}-${c}`);
        }
      }
    }
  }
  return impossible;
};

// --- Puzzle Generation Logic ---

// Counts the number of solutions for a given grid configuration
// Returns >1 if not unique (stops early for performance)
export const countSolutions = (board: Grid, limit = 2): number => {
  let count = 0;
  
  const solve = (grid: Grid): boolean => {
    let row = -1;
    let col = -1;
    let isEmpty = false;

    // Find first empty cell
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (grid[i][j] === 0) {
          row = i;
          col = j;
          isEmpty = true;
          break;
        }
      }
      if (isEmpty) break;
    }

    // If no empty cells, we found a solution
    if (!isEmpty) {
      count++;
      return count >= limit;
    }

    for (let num = 1; num <= 9; num++) {
      if (isValidMove(grid, row, col, num)) {
        grid[row][col] = num;
        if (solve(grid)) return true;
        grid[row][col] = 0; // Backtrack
      }
    }
    return false;
  };

  // Work on a copy
  const gridCopy = board.map(row => [...row]);
  solve(gridCopy);
  return count;
};

export const carvePuzzle = (solution: Grid, difficulty: number): Grid => {
  // Difficulty Targets (approximate number of clues to remain)
  // Level 1 (Easy): ~45 clues
  // Level 2 (Medium): ~38 clues
  // Level 3 (Hard): ~32 clues
  // Level 4 (Expert): ~28 clues
  // Level 5 (Master): ~24 clues
  const targets: Record<number, number> = { 1: 45, 2: 38, 3: 32, 4: 28, 5: 24 };
  const targetClues = targets[difficulty] || 32;

  let puzzle = solution.map(row => [...row]);
  
  // Create a list of all cell coordinates
  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cells.push([r, c]);
    }
  }

  // Shuffle cells to remove them randomly
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let currentClues = 81;

  for (const [r, c] of cells) {
    if (currentClues <= targetClues) break;

    const backup = puzzle[r][c];
    puzzle[r][c] = 0; // Try removing

    // Check if the puzzle still has exactly one solution
    // We only need to know if it has 1, or >1 (or 0, but starting from solution ensures >=1)
    if (countSolutions(puzzle) !== 1) {
      puzzle[r][c] = backup; // Put it back if removing creates ambiguity
    } else {
      currentClues--;
    }
  }

  return puzzle;
};
