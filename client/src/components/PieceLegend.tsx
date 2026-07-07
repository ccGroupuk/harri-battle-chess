import { PieceIcon } from "./PieceIcon";
import { PieceType, HERO_NAMES } from "@/lib/chess-engine";

const PIECE_ORDER: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn', 'copycat'];

export function PieceLegend() {
  return (
    <div className="bg-card/50 backdrop-blur border border-border/50 rounded-lg p-3" data-testid="piece-legend">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 text-center">Heroes vs Villains</h3>
      <div className="space-y-1">
        {PIECE_ORDER.map((type) => (
          <div key={type} className="flex items-center gap-1.5" data-testid={`legend-${type}`}>
            <div className="w-6 h-6 flex-shrink-0">
              <PieceIcon piece={{ type, color: 'w' }} className="w-full h-full" />
            </div>
            <span className="text-[10px] text-blue-300 flex-1 truncate">
              {HERO_NAMES[type].w}
            </span>
            <span className="text-[10px] text-muted-foreground">vs</span>
            <span className="text-[10px] text-red-300 flex-1 truncate text-right">
              {HERO_NAMES[type].b}
            </span>
            <div className="w-6 h-6 flex-shrink-0">
              <PieceIcon piece={{ type, color: 'b' }} className="w-full h-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
