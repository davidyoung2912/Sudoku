export type Grid = number[][];

export interface CellCoords {
  row: number;
  col: number;
}

export enum Difficulty {
  ONE_STAR = 1,
  TWO_STAR = 2,
  THREE_STAR = 3,
  FOUR_STAR = 4,
  FIVE_STAR = 5,
}

export interface SudokuData {
  initial: Grid;
  solution: Grid;
}

export type GameState = 'menu' | 'loading' | 'playing' | 'completed';
