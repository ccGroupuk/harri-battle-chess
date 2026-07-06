// Game logic constants and helpers
import { type PieceType, type PieceColor, type Piece, type GameBoard } from "@shared/schema";

export type BoardState = GameBoard;
export { type PieceType, type PieceColor, type Piece };

export interface CastlingRights {
  whiteKingSide: boolean;
  whiteQueenSide: boolean;
  blackKingSide: boolean;
  blackQueenSide: boolean;
}

export const INITIAL_CASTLING_RIGHTS: CastlingRights = {
  whiteKingSide: true,
  whiteQueenSide: true,
  blackKingSide: true,
  blackQueenSide: true,
};

export const INITIAL_BOARD: BoardState = [
  [
    { type: 'rook', color: 'b' }, { type: 'knight', color: 'b' }, { type: 'bishop', color: 'b' }, { type: 'queen', color: 'b' },
    { type: 'king', color: 'b' }, { type: 'bishop', color: 'b' }, { type: 'knight', color: 'b' }, { type: 'rook', color: 'b' }
  ],
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'b' as PieceColor })),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'w' as PieceColor })),
  [
    { type: 'rook', color: 'w' }, { type: 'knight', color: 'w' }, { type: 'bishop', color: 'w' }, { type: 'queen', color: 'w' },
    { type: 'king', color: 'w' }, { type: 'bishop', color: 'w' }, { type: 'knight', color: 'w' }, { type: 'rook', color: 'w' }
  ]
];

export const HERO_NAMES: Record<PieceType, { w: string, b: string }> = {
  king: { w: "Captain America", b: "Red Skull" },
  queen: { w: "Wonder Woman", b: "Hela" },
  bishop: { w: "Dr. Strange", b: "Loki" },
  knight: { w: "Black Panther", b: "Killmonger" },
  rook: { w: "Spider-Man", b: "Venom" },
  pawn: { w: "Ant-Man", b: "Ultron Drone" },
};

function isValidCoordinate(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function findKing(board: BoardState, color: PieceColor): [number, number] | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece?.type === 'king' && piece.color === color) {
        return [r, c];
      }
    }
  }
  return null;
}

function getRawMoves(board: BoardState, r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];

  const moves: [number, number][] = [];
  const color = piece.color;
  const direction = color === 'w' ? -1 : 1;

  const addIfValid = (nr: number, nc: number) => {
    if (isValidCoordinate(nr, nc)) {
      const target = board[nr][nc];
      if (!target || target.color !== color) {
        moves.push([nr, nc]);
      }
    }
  };

  const addSlidingMoves = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (isValidCoordinate(nr, nc)) {
        const target = board[nr][nc];
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (target.color !== color) moves.push([nr, nc]);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  };

  switch (piece.type) {
    case 'pawn':
      if (isValidCoordinate(r + direction, c) && !board[r + direction][c]) {
        moves.push([r + direction, c]);
        const startRow = color === 'w' ? 6 : 1;
        if (r === startRow && !board[r + direction * 2][c]) {
          moves.push([r + direction * 2, c]);
        }
      }
      [[direction, -1], [direction, 1]].forEach(([dr, dc]) => {
        const nr = r + dr, nc = c + dc;
        if (isValidCoordinate(nr, nc)) {
          const target = board[nr][nc];
          if (target && target.color !== color) {
            moves.push([nr, nc]);
          }
        }
      });
      break;

    case 'knight':
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
        .forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
      break;

    case 'bishop':
      addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;

    case 'rook':
      addSlidingMoves([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;

    case 'queen':
      addSlidingMoves([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;

    case 'king':
      [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        .forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
      break;
  }

  return moves;
}

function getAttackSquares(board: BoardState, r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];

  const attacks: [number, number][] = [];

  const addIfValid = (nr: number, nc: number) => {
    if (isValidCoordinate(nr, nc)) {
      attacks.push([nr, nc]);
    }
  };

  const addSlidingAttacks = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (isValidCoordinate(nr, nc)) {
        attacks.push([nr, nc]);
        if (board[nr][nc]) break;
        nr += dr;
        nc += dc;
      }
    }
  };

  switch (piece.type) {
    case 'pawn':
      const direction = piece.color === 'w' ? -1 : 1;
      if (isValidCoordinate(r + direction, c - 1)) attacks.push([r + direction, c - 1]);
      if (isValidCoordinate(r + direction, c + 1)) attacks.push([r + direction, c + 1]);
      break;

    case 'knight':
      [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
        .forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
      break;

    case 'bishop':
      addSlidingAttacks([[-1, -1], [-1, 1], [1, -1], [1, 1]]);
      break;

    case 'rook':
      addSlidingAttacks([[-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;

    case 'queen':
      addSlidingAttacks([[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
      break;

    case 'king':
      [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
        .forEach(([dr, dc]) => addIfValid(r + dr, c + dc));
      break;
  }

  return attacks;
}

export function isSquareAttacked(board: BoardState, r: number, c: number, byColor: PieceColor): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.color === byColor) {
        const attacks = getAttackSquares(board, row, col);
        if (attacks.some(([ar, ac]) => ar === r && ac === c)) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isInCheck(board: BoardState, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(board, kingPos[0], kingPos[1], opponentColor);
}

export function applyMove(board: BoardState, fromR: number, fromC: number, toR: number, toC: number): BoardState {
  const newBoard: BoardState = board.map((row: (Piece | null)[]) => row.map((cell: Piece | null) => cell ? { ...cell } : null));
  const piece = newBoard[fromR][fromC];

  if (piece?.type === 'king' && Math.abs(toC - fromC) === 2) {
    newBoard[toR][toC] = piece;
    newBoard[fromR][fromC] = null;
    if (toC === 6) {
      newBoard[fromR][5] = newBoard[fromR][7];
      newBoard[fromR][7] = null;
    } else if (toC === 2) {
      newBoard[fromR][3] = newBoard[fromR][0];
      newBoard[fromR][0] = null;
    }
  } else {
    newBoard[toR][toC] = newBoard[fromR][fromC];
    newBoard[fromR][fromC] = null;
  }

  return newBoard;
}

export function getCastlingMoves(board: BoardState, r: number, c: number, castlingRights: CastlingRights): [number, number][] {
  const piece = board[r][c];
  if (!piece || piece.type !== 'king') return [];

  const moves: [number, number][] = [];
  const color = piece.color;
  const opponentColor = color === 'w' ? 'b' : 'w';
  const row = color === 'w' ? 7 : 0;

  if (r !== row || c !== 4) return [];
  if (isInCheck(board, color)) return [];

  const kingSide = color === 'w' ? castlingRights.whiteKingSide : castlingRights.blackKingSide;
  if (kingSide) {
    const rookPiece = board[row][7];
    if (rookPiece?.type === 'rook' && rookPiece.color === color) {
      if (!board[row][5] && !board[row][6]) {
        if (!isSquareAttacked(board, row, 5, opponentColor) &&
            !isSquareAttacked(board, row, 6, opponentColor)) {
          moves.push([row, 6]);
        }
      }
    }
  }

  const queenSide = color === 'w' ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide;
  if (queenSide) {
    const rookPiece = board[row][0];
    if (rookPiece?.type === 'rook' && rookPiece.color === color) {
      if (!board[row][1] && !board[row][2] && !board[row][3]) {
        if (!isSquareAttacked(board, row, 2, opponentColor) &&
            !isSquareAttacked(board, row, 3, opponentColor)) {
          moves.push([row, 2]);
        }
      }
    }
  }

  return moves;
}

export function updateCastlingRights(castlingRights: CastlingRights, fromR: number, fromC: number, piece: Piece): CastlingRights {
  const newRights = { ...castlingRights };

  if (piece.type === 'king') {
    if (piece.color === 'w') {
      newRights.whiteKingSide = false;
      newRights.whiteQueenSide = false;
    } else {
      newRights.blackKingSide = false;
      newRights.blackQueenSide = false;
    }
  }

  if (piece.type === 'rook') {
    if (piece.color === 'w') {
      if (fromR === 7 && fromC === 0) newRights.whiteQueenSide = false;
      if (fromR === 7 && fromC === 7) newRights.whiteKingSide = false;
    } else {
      if (fromR === 0 && fromC === 0) newRights.blackQueenSide = false;
      if (fromR === 0 && fromC === 7) newRights.blackKingSide = false;
    }
  }

  return newRights;
}

export function getValidMoves(board: BoardState, r: number, c: number, castlingRights?: CastlingRights): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, r, c);
  const legalMoves: [number, number][] = [];

  for (const [toR, toC] of rawMoves) {
    const newBoard = applyMove(board, r, c, toR, toC);
    if (!isInCheck(newBoard, piece.color)) {
      legalMoves.push([toR, toC]);
    }
  }

  if (castlingRights && piece.type === 'king') {
    const castlingMoves = getCastlingMoves(board, r, c, castlingRights);
    legalMoves.push(...castlingMoves);
  }

  return legalMoves;
}

export function hasLegalMoves(board: BoardState, color: PieceColor, castlingRights?: CastlingRights): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        if (getValidMoves(board, r, c, castlingRights).length > 0) {
          return true;
        }
      }
    }
  }
  return false;
}

export function isCheckmate(board: BoardState, color: PieceColor, castlingRights?: CastlingRights): boolean {
  return isInCheck(board, color) && !hasLegalMoves(board, color, castlingRights);
}

export function isStalemate(board: BoardState, color: PieceColor, castlingRights?: CastlingRights): boolean {
  return !isInCheck(board, color) && !hasLegalMoves(board, color, castlingRights);
}

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate';

export function getGameStatus(board: BoardState, currentTurn: PieceColor, castlingRights?: CastlingRights): { status: GameStatus; winner?: PieceColor } {
  const inCheck = isInCheck(board, currentTurn);
  const hasMovesLeft = hasLegalMoves(board, currentTurn, castlingRights);

  if (!hasMovesLeft) {
    if (inCheck) {
      return { status: 'checkmate', winner: currentTurn === 'w' ? 'b' : 'w' };
    } else {
      return { status: 'stalemate' };
    }
  }

  if (inCheck) {
    return { status: 'check' };
  }

  return { status: 'playing' };
}

export function isCastlingMove(fromR: number, fromC: number, toR: number, toC: number, board: BoardState): boolean {
  const piece = board[fromR][fromC];
  return !!piece && piece.type === 'king' && Math.abs(toC - fromC) === 2;
}

const FEN_PIECE_MAP: Record<string, { type: PieceType; color: PieceColor }> = {
  'P': { type: 'pawn', color: 'w' },
  'R': { type: 'rook', color: 'w' },
  'N': { type: 'knight', color: 'w' },
  'B': { type: 'bishop', color: 'w' },
  'Q': { type: 'queen', color: 'w' },
  'K': { type: 'king', color: 'w' },
  'p': { type: 'pawn', color: 'b' },
  'r': { type: 'rook', color: 'b' },
  'n': { type: 'knight', color: 'b' },
  'b': { type: 'bishop', color: 'b' },
  'q': { type: 'queen', color: 'b' },
  'k': { type: 'king', color: 'b' },
};

const PIECE_TO_FEN: Record<string, string> = {
  'pawn-w': 'P', 'rook-w': 'R', 'knight-w': 'N', 'bishop-w': 'B', 'queen-w': 'Q', 'king-w': 'K',
  'pawn-b': 'p', 'rook-b': 'r', 'knight-b': 'n', 'bishop-b': 'b', 'queen-b': 'q', 'king-b': 'k',
};

export function parseFEN(fen: string): { board: BoardState; turn: PieceColor; castlingRights: CastlingRights } {
  const parts = fen.split(' ');
  const boardPart = parts[0];
  const turnPart = parts[1] || 'w';
  const castlingPart = parts[2] || 'KQkq';

  const board: BoardState = [];
  const rows = boardPart.split('/');

  for (const row of rows) {
    const boardRow: (Piece | null)[] = [];
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        for (let i = 0; i < parseInt(ch); i++) {
          boardRow.push(null);
        }
      } else {
        const piece = FEN_PIECE_MAP[ch];
        if (piece) {
          boardRow.push({ ...piece });
        }
      }
    }
    board.push(boardRow);
  }

  const castlingRights: CastlingRights = {
    whiteKingSide: castlingPart.includes('K'),
    whiteQueenSide: castlingPart.includes('Q'),
    blackKingSide: castlingPart.includes('k'),
    blackQueenSide: castlingPart.includes('q'),
  };

  return { board, turn: turnPart as PieceColor, castlingRights };
}

export function boardToFEN(board: BoardState, turn: PieceColor, castlingRights?: CastlingRights): string {
  const rows: string[] = [];
  for (const row of board) {
    let fenRow = '';
    let emptyCount = 0;
    for (const piece of row) {
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount;
          emptyCount = 0;
        }
        fenRow += PIECE_TO_FEN[`${piece.type}-${piece.color}`] || '?';
      }
    }
    if (emptyCount > 0) fenRow += emptyCount;
    rows.push(fenRow);
  }

  let castlingStr = '';
  if (castlingRights) {
    if (castlingRights.whiteKingSide) castlingStr += 'K';
    if (castlingRights.whiteQueenSide) castlingStr += 'Q';
    if (castlingRights.blackKingSide) castlingStr += 'k';
    if (castlingRights.blackQueenSide) castlingStr += 'q';
  }
  if (!castlingStr) castlingStr = '-';

  return rows.join('/') + ' ' + turn + ' ' + castlingStr + ' - 0 1';
}

export function coordToUCI(r: number, c: number): string {
  const file = String.fromCharCode(97 + c);
  const rank = (8 - r).toString();
  return file + rank;
}

export function uciToCoord(uci: string): [number, number] {
  const c = uci.charCodeAt(0) - 97;
  const r = 8 - parseInt(uci[1]);
  return [r, c];
}

export function moveToUCI(fromR: number, fromC: number, toR: number, toC: number, promotion?: PieceType): string {
  let uci = coordToUCI(fromR, fromC) + coordToUCI(toR, toC);
  if (promotion) {
    const promoMap: Record<string, string> = { queen: 'q', rook: 'r', bishop: 'b', knight: 'n' };
    uci += promoMap[promotion] || '';
  }
  return uci;
}

export function parseUCIMove(uci: string): { from: [number, number]; to: [number, number]; promotion?: PieceType } {
  const from = uciToCoord(uci.substring(0, 2));
  const to = uciToCoord(uci.substring(2, 4));
  let promotion: PieceType | undefined;
  if (uci.length === 5) {
    const promoMap: Record<string, PieceType> = { q: 'queen', r: 'rook', b: 'bishop', n: 'knight' };
    promotion = promoMap[uci[4]];
  }
  return { from, to, promotion };
}

export function isGameOver(board: BoardState): boolean {
  let whiteKing = false;
  let blackKing = false;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.type === 'king') {
        if (p.color === 'w') whiteKing = true;
        if (p.color === 'b') blackKing = true;
      }
    }
  }

  return !whiteKing || !blackKing;
}
