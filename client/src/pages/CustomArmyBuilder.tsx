import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Shield, AlertTriangle } from "lucide-react";
import { PieceType, PieceColor, Piece } from "@shared/schema";
import { INITIAL_BOARD } from "@/lib/chess-engine";
import { useCreateGame } from "@/hooks/use-game";
import { PieceIcon, PIECE_NAMES } from "@/components/PieceIcon";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_PIECES: PieceType[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'copycat'];

export default function CustomArmyBuilder() {
  const [, setLocation] = useLocation();
  const createGame = useCreateGame();
  const { toast } = useToast();
  
  const [selectedPieceType, setSelectedPieceType] = useState<PieceType>('pawn');
  
  // Custom board state: 2 rows of 8 cells for the player's 16 pieces
  // row 0 is the back row (row 7 in full board), row 1 is the pawn row (row 6 in full board)
  const [customGrid, setCustomGrid] = useState<(Piece | null)[][]>(() => [
    Array(8).fill(null), // Back row
    Array(8).fill(null), // Pawn row
  ]);

  const handleCellClick = (r: number, c: number) => {
    const newGrid = [...customGrid];
    newGrid[r] = [...newGrid[r]];
    
    // If clicking on an existing piece of the same type, remove it
    if (newGrid[r][c]?.type === selectedPieceType) {
      newGrid[r][c] = null;
    } else {
      // Place the selected piece
      newGrid[r][c] = { type: selectedPieceType, color: 'w' };
    }
    
    setCustomGrid(newGrid);
  };

  const handleClear = () => {
    setCustomGrid([Array(8).fill(null), Array(8).fill(null)]);
  };
  
  const handleDefault = () => {
    setCustomGrid([
      [
        { type: 'rook', color: 'w' }, { type: 'knight', color: 'w' }, { type: 'bishop', color: 'w' }, { type: 'queen', color: 'w' },
        { type: 'king', color: 'w' }, { type: 'bishop', color: 'w' }, { type: 'knight', color: 'w' }, { type: 'rook', color: 'w' }
      ],
      Array(8).fill(null).map(() => ({ type: 'pawn' as PieceType, color: 'w' as PieceColor }))
    ]);
  };

  const startCustomGame = async () => {
    // Validation
    let pieceCount = 0;
    let kingCount = 0;

    customGrid.forEach(row => {
      row.forEach(cell => {
        if (cell) {
          pieceCount++;
          if (cell.type === 'king') kingCount++;
        }
      });
    });

    if (pieceCount !== 16) {
      toast({
        title: "Invalid Army",
        description: `You must place exactly 16 pieces. You have placed ${pieceCount}.`,
        variant: "destructive"
      });
      return;
    }

    if (kingCount !== 1) {
      toast({
        title: "Invalid Army",
        description: `You must have exactly 1 King. You have ${kingCount}.`,
        variant: "destructive"
      });
      return;
    }

    // Build the full 8x8 board
    // Top 2 rows are standard black pieces
    // Middle 4 rows are empty
    // Bottom 2 rows are the custom white pieces (Note: customGrid[0] goes to row 7, customGrid[1] goes to row 6)
    
    const fullBoard = [
      INITIAL_BOARD[0].map(p => p ? { ...p } : null), // Black back row
      INITIAL_BOARD[1].map(p => p ? { ...p } : null), // Black pawn row
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      customGrid[1].map(p => p ? { ...p } : null),    // White pawn row (custom)
      customGrid[0].map(p => p ? { ...p } : null),    // White back row (custom)
    ];

    try {
      const game = await createGame.mutateAsync({ 
        gameMode: 'custom', 
        board: fullBoard as any 
      });
      setLocation(`/game/${game.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const startAIGame = async () => {
    // Validation
    let pieceCount = 0;
    let kingCount = 0;

    customGrid.forEach(row => {
      row.forEach(cell => {
        if (cell) {
          pieceCount++;
          if (cell.type === 'king') kingCount++;
        }
      });
    });

    if (pieceCount !== 16) {
      toast({
        title: "Invalid Army",
        description: `You must place exactly 16 pieces. You have placed ${pieceCount}.`,
        variant: "destructive"
      });
      return;
    }

    if (kingCount !== 1) {
      toast({
        title: "Invalid Army",
        description: `You must have exactly 1 King. You have ${kingCount}.`,
        variant: "destructive"
      });
      return;
    }

    const fullBoard = [
      INITIAL_BOARD[0].map(p => p ? { ...p } : null),
      INITIAL_BOARD[1].map(p => p ? { ...p } : null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      Array(8).fill(null),
      customGrid[1].map(p => p ? { ...p } : null),
      customGrid[0].map(p => p ? { ...p } : null),
    ];

    try {
      const game = await createGame.mutateAsync({ 
        gameMode: 'ai_medium', 
        board: fullBoard as any 
      });
      setLocation(`/game/${game.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-comic font-bold">CUSTOM ARMY BUILDER</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleClear}>Clear</Button>
          <Button variant="outline" onClick={handleDefault}>Default</Button>
          <Button onClick={startCustomGame} disabled={createGame.isPending} className="font-bold">
            <Play className="w-4 h-4 mr-2" />
            VS PLAYER
          </Button>
          <Button onClick={startAIGame} disabled={createGame.isPending} className="font-bold bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            VS AI
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row p-4 gap-6 max-w-6xl mx-auto w-full">
        {/* Left column: Piece Palette */}
        <div className="md:w-1/3 flex flex-col gap-4">
          <Card className="p-4 bg-card/80 border-border">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              1. Select Piece
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {AVAILABLE_PIECES.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedPieceType(type)}
                  className={`p-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 transition-all ${
                    selectedPieceType === type 
                      ? 'border-primary bg-primary/20 ring-2 ring-primary/50' 
                      : 'border-border/50 hover:border-primary/50 bg-background/50'
                  }`}
                >
                  <div className="w-10 h-10 pointer-events-none">
                    <PieceIcon piece={{ type, color: 'w' }} />
                  </div>
                  <span className="text-xs font-semibold">{PIECE_NAMES[type]}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-3 rounded bg-accent/20 border border-accent text-sm text-muted-foreground flex gap-3">
              <AlertTriangle className="w-5 h-5 text-accent shrink-0" />
              <p>
                Select a piece type above, then click on the grid slots on the right to place it. You must place exactly <strong>16 pieces</strong> including exactly <strong>1 King</strong>.
              </p>
            </div>
          </Card>
        </div>

        {/* Right column: The Grid */}
        <div className="md:w-2/3 flex flex-col items-center justify-center">
          <Card className="p-8 bg-zinc-900 border-zinc-700 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/assets/hero.png')] opacity-10 bg-cover bg-center pointer-events-none" />
            
            <h2 className="text-2xl font-bold mb-6 text-center font-comic text-white drop-shadow-lg relative z-10">
              2. Place Your Heroes
            </h2>
            
            <div className="flex flex-col gap-1 relative z-10 p-2 bg-zinc-800 rounded-lg shadow-inner">
              {customGrid.map((row, rIndex) => (
                <div key={rIndex} className="flex gap-1">
                  {row.map((cell, cIndex) => {
                    // alternate colors for a chess-board feel
                    const isDark = (rIndex + cIndex) % 2 === 1;
                    return (
                      <button
                        key={cIndex}
                        onClick={() => handleCellClick(rIndex, cIndex)}
                        className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center transition-colors border-2 hover:border-primary/50
                          ${isDark ? 'bg-zinc-700/80' : 'bg-zinc-600/80'}
                          ${!cell ? 'border-dashed border-zinc-500/30' : 'border-transparent'}
                        `}
                      >
                        {cell && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 pointer-events-none">
                            <PieceIcon piece={cell} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between text-zinc-400 text-sm font-medium relative z-10 px-2">
              <span>Back Row</span>
              <span>Front Row (Pawns)</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
