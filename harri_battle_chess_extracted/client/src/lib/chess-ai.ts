import { BoardState, PieceType, PieceColor, getValidMoves, applyMove } from "./chess-engine";

export type Difficulty = 'easy' | 'medium' | 'hard';

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 100,
  knight: 320,
  bishop: 330,
  rook: 500,
  queen: 900,
  king: 20000,
};

const POSITION_BONUS: Record<PieceType, number[][]> = {
  pawn: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  knight: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  bishop: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  rook: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  queen: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  king: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

function evaluateBoard(board: BoardState, color: PieceColor): number {
  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceValue = PIECE_VALUES[piece.type];
      const positionBonus = piece.color === 'b'
        ? POSITION_BONUS[piece.type][r][c]
        : POSITION_BONUS[piece.type][7 - r][c];

      const totalValue = pieceValue + positionBonus;

      if (piece.color === color) {
        score += totalValue;
      } else {
        score -= totalValue;
      }
    }
  }

  return score;
}

function getAllMoves(board: BoardState, color: PieceColor): { from: [number, number]; to: [number, number]; capture: boolean }[] {
  const moves: { from: [number, number]; to: [number, number]; capture: boolean }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, r, c);
        for (const [tr, tc] of validMoves) {
          moves.push({ 
            from: [r, c], 
            to: [tr, tc],
            capture: board[tr][tc] !== null
          });
        }
      }
    }
  }

  return moves;
}

function makeMove(board: BoardState, from: [number, number], to: [number, number]): BoardState {
  return applyMove(board, from[0], from[1], to[0], to[1]);
}

function sortMoves(moves: { from: [number, number]; to: [number, number]; capture: boolean }[]) {
  return moves.sort((a, b) => (b.capture ? 1 : 0) - (a.capture ? 1 : 0));
}

function minimax(
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiColor: PieceColor
): number {
  if (depth === 0) {
    return evaluateBoard(board, aiColor);
  }

  const currentColor: PieceColor = isMaximizing ? aiColor : (aiColor === 'w' ? 'b' : 'w');
  let moves = getAllMoves(board, currentColor);

  if (moves.length === 0) {
    return isMaximizing ? -50000 : 50000;
  }

  moves = sortMoves(moves);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.from, move.to);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiColor);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = makeMove(board, move.from, move.to);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiColor);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(
  board: BoardState,
  aiColor: PieceColor,
  difficulty: Difficulty
): { from: [number, number]; to: [number, number] } | null {
  const moves = getAllMoves(board, aiColor);

  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (difficulty === 'medium') {
    let bestMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      const newBoard = makeMove(board, move.from, move.to);
      const score = evaluateBoard(newBoard, aiColor);

      if (Math.random() < 0.2) {
        continue;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  if (difficulty === 'hard') {
    let bestMove = moves[0];
    let bestScore = -Infinity;
    const depth = 2;

    const sortedMoves = sortMoves([...moves]);

    for (const move of sortedMoves) {
      const newBoard = makeMove(board, move.from, move.to);
      const score = minimax(newBoard, depth, -Infinity, Infinity, false, aiColor);

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  return moves[0];
}
