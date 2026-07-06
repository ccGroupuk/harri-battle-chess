import { useEffect, useState, useCallback, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useGame, useUpdateGame } from "@/hooks/use-game";
import { GameBoard } from "@/components/GameBoard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, Trophy, Bot, User, Swords, Star } from "lucide-react";
import { Link } from "wouter";
import { getGameStatus, BoardState, PieceType, isInCheck, CastlingRights, INITIAL_CASTLING_RIGHTS, updateCastlingRights, applyMove } from "@/lib/chess-engine";
import { getAIMove, Difficulty } from "@/lib/chess-ai";
import { PieceIcon } from "@/components/PieceIcon";
import { PieceLegend } from "@/components/PieceLegend";
import { CapturedPieces } from "@/components/CapturedPieces";
import { GameMode, LeaderboardEntry, PlayerPurchase, ShopItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function GameRoom() {
  const [, params] = useRoute("/game/:id");
  const gameId = params?.id;
  
  const { data: game, isLoading, error } = useGame(gameId);
  const updateGameMutation = useUpdateGame();

  const [localBoard, setLocalBoard] = useState<BoardState | null>(null);
  const [localTurn, setLocalTurn] = useState<'w'|'b'>('w');
  const [castlingRights, setCastlingRights] = useState<CastlingRights>({ ...INITIAL_CASTLING_RIGHTS });
  const [isAIThinking, setIsAIThinking] = useState(false);
  const aiMoveInProgress = useRef(false);
  const xpAwardedRef = useRef(false);

  // Get current player ID from localStorage
  const currentPlayerId = localStorage.getItem("currentPlayerId");

  // Fetch current player data for XP display
  const { data: leaderboardEntries = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const currentPlayer = currentPlayerId 
    ? leaderboardEntries.find(e => e.id === parseInt(currentPlayerId)) 
    : null;

  // Fetch equipped items for current player
  const { data: equippedItems = [] } = useQuery<PlayerPurchase[]>({
    queryKey: ["/api/shop/equipped", currentPlayerId],
    enabled: !!currentPlayerId,
  });

  // Fetch all shop items to get board theme data
  const { data: shopItems = [] } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  // Get equipped board theme
  const equippedBoardTheme = (() => {
    const equippedBoard = equippedItems.find(p => {
      const item = shopItems.find(i => i.id === p.itemId);
      return item?.type === 'board';
    });
    if (equippedBoard) {
      const item = shopItems.find(i => i.id === equippedBoard.itemId);
      if (item?.data && typeof item.data === 'object' && 'lightColor' in item.data) {
        return {
          lightColor: (item.data as any).lightColor as string,
          darkColor: (item.data as any).darkColor as string,
        };
      }
    }
    return undefined;
  })();

  // Mutation to award XP (atomic increment)
  const awardXpMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number; amount: number }) => {
      return apiRequest("POST", `/api/leaderboard/${id}/xp`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
  });

  const gameMode = game?.gameMode as GameMode || 'local';
  const isAIGame = gameMode.startsWith('ai_');
  const isHarriSmash = gameMode === 'harri_smash';
  
  const getAIDifficulty = (): Difficulty | null => {
    if (gameMode === 'ai_easy') return 'easy';
    if (gameMode === 'ai_medium') return 'medium';
    if (gameMode === 'ai_hard') return 'hard';
    if (gameMode === 'harri_smash') return 'hard';
    return null;
  };

  useEffect(() => {
    if (game) {
      setLocalBoard(game.board as BoardState);
      setLocalTurn(game.turn as 'w' | 'b');
    }
  }, [game]);

  // Award XP based on game outcome: Win = 5 XP, Loss = 2 XP, Draw = 1 XP
  useEffect(() => {
    if (game?.isGameOver && currentPlayerId && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      let xpAmount = 0;
      
      if (game.winner === 'w') {
        // Player wins (heroes win)
        xpAmount = 5;
      } else if (game.winner === 'b') {
        // Player loses (villains win)
        xpAmount = 2;
      } else {
        // Draw (stalemate)
        xpAmount = 1;
      }
      
      awardXpMutation.mutate({ 
        id: parseInt(currentPlayerId), 
        amount: xpAmount 
      });
    }
  }, [game?.isGameOver, game?.winner, currentPlayerId]);

  const executeMove = useCallback((newBoard: BoardState, nextTurn: 'w' | 'b') => {
    if (!gameId) return;

    // Check for checkmate/stalemate for the player who will move next
    const status = getGameStatus(newBoard, nextTurn, castlingRights);
    const gameEnded = status.status === 'checkmate' || status.status === 'stalemate';
    const winner = status.winner || null;

    updateGameMutation.mutate({
      id: parseInt(gameId),
      board: newBoard,
      turn: nextTurn,
      isGameOver: gameEnded,
      winner
    });
  }, [gameId, updateGameMutation]);

  const handleMove = (newBoard: BoardState, nextTurn: 'w' | 'b') => {
    setLocalBoard(newBoard);
    setLocalTurn(nextTurn);
    executeMove(newBoard, nextTurn);
  };

  useEffect(() => {
    if (!localBoard || game?.isGameOver) return;
    if (localTurn !== 'b') return;
    if (aiMoveInProgress.current) return;
    
    const difficulty = getAIDifficulty();
    if (!difficulty) return;
    
    aiMoveInProgress.current = true;
    setIsAIThinking(true);
    
    // Small delay for UI feedback, then compute AI move
    const timeout = setTimeout(() => {
      try {
        const aiMove = getAIMove(localBoard, 'b', difficulty);
        
        if (aiMove) {
          const [fromR, fromC] = aiMove.from;
          const [toR, toC] = aiMove.to;
          
          const movingPiece = localBoard[fromR][fromC];
          const newBoard = applyMove(localBoard, fromR, fromC, toR, toC);
          
          if (movingPiece) {
            setCastlingRights(prev => updateCastlingRights(prev, fromR, fromC, movingPiece));
          }
          
          const piece = newBoard[toR][toC];
          if (piece?.type === 'pawn' && (toR === 0 || toR === 7)) {
            piece.type = 'queen';
          }
          
          setLocalBoard(newBoard);
          setLocalTurn('w');
          
          const status = getGameStatus(newBoard, 'w', castlingRights);
          const gameEnded = status.status === 'checkmate' || status.status === 'stalemate';
          
          updateGameMutation.mutate({
            id: parseInt(gameId!),
            board: newBoard,
            turn: 'w',
            isGameOver: gameEnded,
            winner: status.winner || null
          });
        }
      } catch (err) {
        console.error('AI move error:', err);
      } finally {
        setIsAIThinking(false);
        aiMoveInProgress.current = false;
      }
    }, 400);
    
    return () => {
      clearTimeout(timeout);
      aiMoveInProgress.current = false;
    };
  }, [localTurn, game?.isGameOver]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin text-primary">
          <RefreshCw className="w-12 h-12" />
        </div>
      </div>
    );
  }

  if (error || !game || !localBoard) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-4">
        <h1 className="text-3xl font-comic text-destructive">Mission Failed</h1>
        <p className="text-muted-foreground">Could not load game session.</p>
        <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Return to Base
        </Link>
      </div>
    );
  }

  const isWhiteTurn = localTurn === 'w';
  // In local mode, both players can move on their turn
  // In AI mode, only white (player) can move
  const playerCanMove = !game.isGameOver && !isAIThinking && (gameMode === 'local' || isWhiteTurn);
  
  // Check current game status for display
  const currentStatus = localBoard ? getGameStatus(localBoard, localTurn) : { status: 'playing' as const };
  const isWhiteInCheck = localBoard ? isInCheck(localBoard, 'w') : false;
  const isBlackInCheck = localBoard ? isInCheck(localBoard, 'b') : false;

  // Calculate material scores
  const pieceValues: Record<string, number> = {
    pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 0
  };

  const calculateScores = () => {
    const startingMaterial = 8 * 1 + 2 * 3 + 2 * 3 + 2 * 5 + 1 * 9;
    let whiteRemaining = 0;
    let blackRemaining = 0;
    if (localBoard) {
      for (const row of localBoard) {
        for (const piece of row) {
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            if (piece.color === 'w') whiteRemaining += value;
            else blackRemaining += value;
          }
        }
      }
    }
    return { whiteScore: startingMaterial - blackRemaining, blackScore: startingMaterial - whiteRemaining };
  };

  const { whiteScore, blackScore } = calculateScores();

  const getModeLabel = () => {
    switch(gameMode) {
      case 'local': return 'Local Battle';
      case 'ai_easy': return 'vs AI (Easy)';
      case 'ai_medium': return 'vs AI (Medium)';
      case 'ai_hard': return 'vs AI (Hard)';
      case 'harri_smash': return 'Harri Smash Mode';
      default: return 'Battle';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8 relative">
      {/* XP Display in corner */}
      {currentPlayer && (
        <div 
          className="fixed top-4 right-4 bg-gradient-to-r from-yellow-600 to-amber-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50"
          data-testid="xp-display"
        >
          <Star className="w-5 h-5" />
          <span className="font-bold">{currentPlayer.xp} XP</span>
          <span className="text-xs opacity-80">({currentPlayer.name})</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr_220px] gap-6">
        
        {/* Left Panel: Game Info */}
        <div className="space-y-4 order-2 lg:order-1">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Base
          </Link>
          
          <Card className="p-5 bg-card/50 backdrop-blur border-primary/20 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-3">
              {isAIGame && <Bot className="w-5 h-5 text-muted-foreground" />}
              {isHarriSmash && <Swords className="w-5 h-5 text-purple-500" />}
              <span className="text-sm font-tech text-muted-foreground uppercase tracking-wider">
                {getModeLabel()}
              </span>
            </div>

            <h2 className="text-2xl font-comic tracking-wide mb-4 text-center uppercase">
              <span className="text-primary">Civil</span> <span className="text-foreground">War</span>
            </h2>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${isWhiteTurn ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-transparent opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="font-tech text-lg font-bold text-blue-400">HEROES</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech text-lg font-bold text-blue-400" data-testid="text-white-score">{whiteScore}</span>
                    {isWhiteTurn && !isAIThinking && <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">You (White)</p>
                {isWhiteInCheck && !game.isGameOver && (
                  <p className="text-xs font-bold text-yellow-400 animate-pulse mt-1">CHECK!</p>
                )}
              </div>

              <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${!isWhiteTurn ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-transparent opacity-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isHarriSmash ? (
                      <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-red-500">
                        <img src="/assets/hero.png" alt="Harri" className="w-full h-full object-cover" />
                      </div>
                    ) : isAIGame ? (
                      <Bot className="w-4 h-4 text-red-500" />
                    ) : (
                      <User className="w-4 h-4 text-red-500" />
                    )}
                    <span className="font-tech text-lg font-bold text-red-500">
                      {isHarriSmash ? 'HARRI' : 'VILLAINS'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-tech text-lg font-bold text-red-500" data-testid="text-black-score">{blackScore}</span>
                    {!isWhiteTurn && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isHarriSmash ? 'The Champion (Black)' : isAIGame ? 'AI (Black)' : 'Player 2 (Black)'}
                </p>
                {isBlackInCheck && !game.isGameOver && (
                  <p className="text-xs font-bold text-yellow-400 animate-pulse mt-1">CHECK!</p>
                )}
                {isAIThinking && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>
            </div>

            {game.isGameOver && (
              <div className="mt-6 p-4 bg-accent/20 border border-accent/50 rounded-xl text-center animate-in zoom-in">
                <Trophy className="w-10 h-10 text-accent mx-auto mb-2" />
                <h3 className="text-xl font-comic text-accent mb-1">
                  {currentStatus.status === 'stalemate' ? 'STALEMATE' : 'CHECKMATE!'}
                </h3>
                <p className="font-tech text-base">
                  {currentStatus.status === 'stalemate'
                    ? "It's a draw!"
                    : game.winner === 'w' 
                      ? "HEROES WIN!" 
                      : isHarriSmash 
                        ? "HARRI SMASHES!"
                        : isAIGame 
                          ? "VILLAINS WIN!" 
                          : "VILLAINS CONQUER!"}
                </p>
              </div>
            )}
          </Card>

          {isHarriSmash && (
            <Card className="p-4 bg-gradient-to-br from-purple-900/30 to-red-900/30 border-purple-500/30">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] mb-3">
                  <img src="/assets/hero.png" alt="Harri" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-comic text-lg text-purple-400">HARRI</h3>
                <p className="text-[10px] text-purple-400/70 mt-1 italic">"You dare challenge me?"</p>
              </div>
            </Card>
          )}

          <div className="hidden lg:block text-xs text-muted-foreground text-center font-mono opacity-50">
            SESSION ID: {game.id}
          </div>
        </div>

        {/* Center: Board */}
        <div className="flex flex-col items-center justify-center order-1 lg:order-2">
          <GameBoard 
            board={localBoard} 
            turn={localTurn} 
            onMove={handleMove}
            disabled={!playerCanMove || (isAIGame && localTurn === 'b')}
            boardTheme={equippedBoardTheme}
            castlingRights={castlingRights}
            onCastlingRightsChange={setCastlingRights}
          />
          
          {isAIThinking && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">
                {isHarriSmash ? "Harri is plotting..." : "AI is thinking..."}
              </span>
            </div>
          )}
        </div>

        {/* Right Panel: Captured Pieces & Legend */}
        <div className="space-y-4 order-3">
          <CapturedPieces board={localBoard} />
          <PieceLegend />
        </div>
      </div>
    </div>
  );
}
