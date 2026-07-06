import { PieceIcon } from "./PieceIcon";
import { PieceType, BoardState } from "@/lib/chess-engine";

interface CapturedPiecesProps {
  board: BoardState;
}

const PIECE_ORDER: PieceType[] = ['queen', 'rook', 'bishop', 'knight', 'pawn'];

const STARTING_COUNTS: Record<PieceType, number> = {
  king: 1,
  queen: 1,
  rook: 2,
  bishop: 2,
  knight: 2,
  pawn: 8,
};

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0,
};

function getCaptured(board: BoardState) {
  const current = {
    w: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
    b: { king: 0, queen: 0, rook: 0, bishop: 0, knight: 0, pawn: 0 },
  };

  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        const c = piece.color as 'w' | 'b';
        const t = piece.type as keyof typeof current.w;
        current[c][t]++;
      }
    }
  }

  const capturedWhite: PieceType[] = [];
  const capturedBlack: PieceType[] = [];

  for (const type of PIECE_ORDER) {
    const wLost = STARTING_COUNTS[type] - current.w[type];
    const bLost = STARTING_COUNTS[type] - current.b[type];
    for (let i = 0; i < wLost; i++) capturedWhite.push(type);
    for (let i = 0; i < bLost; i++) capturedBlack.push(type);
  }

  const whiteMaterialLost = capturedWhite.reduce((s, t) => s + PIECE_VALUES[t], 0);
  const blackMaterialLost = capturedBlack.reduce((s, t) => s + PIECE_VALUES[t], 0);
  const whiteAdvantage = blackMaterialLost - whiteMaterialLost;

  return { capturedWhite, capturedBlack, whiteAdvantage };
}

export function CapturedPieces({ board }: CapturedPiecesProps) {
  const { capturedWhite, capturedBlack, whiteAdvantage } = getCaptured(board);

  return (
    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-3 space-y-3" data-testid="captured-pieces-panel">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Taken Pieces</h3>

      <div className="space-y-2">
        <div data-testid="captured-white-pieces">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">White Lost</span>
            {whiteAdvantage < 0 && (
              <span className="text-[10px] font-bold text-red-400">+{Math.abs(whiteAdvantage)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-0.5 min-h-[28px]">
            {capturedWhite.length === 0 ? (
              <span className="text-[10px] text-muted-foreground italic">None</span>
            ) : (
              capturedWhite.map((type, i) => (
                <div key={`w-${type}-${i}`} className="w-5 h-5" data-testid={`captured-w-${type}-${i}`}>
                  <PieceIcon piece={{ type, color: 'w' }} className="w-full h-full" desaturated />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-border/30" />

        <div data-testid="captured-black-pieces">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Black Lost</span>
            {whiteAdvantage > 0 && (
              <span className="text-[10px] font-bold text-blue-400">+{whiteAdvantage}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-0.5 min-h-[28px]">
            {capturedBlack.length === 0 ? (
              <span className="text-[10px] text-muted-foreground italic">None</span>
            ) : (
              capturedBlack.map((type, i) => (
                <div key={`b-${type}-${i}`} className="w-5 h-5" data-testid={`captured-b-${type}-${i}`}>
                  <PieceIcon piece={{ type, color: 'b' }} className="w-full h-full" desaturated />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
