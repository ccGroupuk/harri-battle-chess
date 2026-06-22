import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft, Globe, Search, Swords, Clock,
  User, RefreshCw, Flag
} from "lucide-react";
import { GameBoard, MoveInfo } from "@/components/GameBoard";
import {
  BoardState, PieceColor, INITIAL_BOARD, moveToUCI,
  PieceType
} from "@/lib/chess-engine";
import type { Piece, PlayerPurchase, ShopItem } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type MatchPhase = "idle" | "seeking" | "matched" | "playing" | "ended";

interface GameInfo {
  gameId: string;
  myColor: PieceColor;
  opponentName: string;
}

interface ClockState {
  white: number;
  black: number;
}

function generatePlayerId(): string {
  const stored = localStorage.getItem("online_player_id");
  if (stored) return stored;
  const id = Math.random().toString(36).substring(2, 12);
  localStorage.setItem("online_player_id", id);
  return id;
}

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function OnlineMatch() {
  const [username, setUsername] = useState(localStorage.getItem("online_username") || "");
  const [usernameInput, setUsernameInput] = useState(localStorage.getItem("online_username") || "");
  const [phase, setPhase] = useState<MatchPhase>("idle");
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [turn, setTurn] = useState<PieceColor>("w");
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [clocks, setClocks] = useState<ClockState>({ white: 300000, black: 300000 });
  const [gameResult, setGameResult] = useState<{ reason: string; winner?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const playerId = useRef(generatePlayerId());
  const currentPlayerId = localStorage.getItem("currentPlayerId");
  const xpAwardedRef = useRef(false);

  const awardXpMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: number, amount: number }) => {
      const res = await apiRequest("POST", `/api/leaderboard/${id}/xp`, { amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    }
  });

  useEffect(() => {
    if (phase === "ended" && gameResult && currentPlayerId && gameInfo && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      let xpAmount = 0;
      
      if (gameResult.winner === gameInfo.myColor) {
        xpAmount = 500;
      } else if (gameResult.winner) {
        xpAmount = 2;
      } else {
        xpAmount = 1;
      }
      
      awardXpMutation.mutate({ 
        id: parseInt(currentPlayerId), 
        amount: xpAmount 
      });
    }
  }, [phase, gameResult, currentPlayerId, gameInfo]);

  const parsedPlayerId = currentPlayerId ? parseInt(currentPlayerId) : null;
  const { data: equippedItems = [] } = useQuery<PlayerPurchase[]>({
    queryKey: ["/api/shop/equipped", parsedPlayerId],
    enabled: !!parsedPlayerId,
  });

  const { data: shopItems = [] } = useQuery<ShopItem[]>({
    queryKey: ["/api/shop/items"],
  });

  const equippedBoardTheme = (() => {
    let theme: any = undefined;

    const equippedBoard = equippedItems.find(p => {
      const item = shopItems.find(i => i.id === p.itemId);
      return item?.type === 'board';
    });

    if (equippedBoard) {
      const item = shopItems.find(i => i.id === equippedBoard.itemId);
      if (item?.data && typeof item.data === 'object' && 'lightColor' in item.data) {
        theme = {
          lightColor: (item.data as any).lightColor as string,
          darkColor: (item.data as any).darkColor as string,
        };
      } else if (item?.data && typeof item.data === 'object' && 'backgroundImage' in item.data) {
        theme = {
          lightColor: 'transparent',
          darkColor: 'transparent',
          backgroundImage: (item.data as any).backgroundImage as string,
        };
      }
    }

    const equippedPiece = equippedItems.find(p => {
      const item = shopItems.find(i => i.id === p.itemId);
      return item?.type === 'piece_style';
    });

    if (equippedPiece) {
      const item = shopItems.find(i => i.id === equippedPiece.itemId);
      if (item?.data && typeof item.data === 'object' && 'textureUrl' in item.data) {
        if (!theme) theme = { lightColor: '#cbd5e1', darkColor: '#1e293b' };
        
        // Since we play as myColor, we apply our selected piece style to our color
        const myColor = gameInfo?.myColor || 'w';
        if (myColor === 'w') {
          theme.heroPieceStyle = { textureUrl: (item.data as any).textureUrl as string };
        } else {
          theme.villainPieceStyle = { textureUrl: (item.data as any).textureUrl as string };
        }
      }
    }

    return theme;
  })();

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const applyMovesToBoard = useCallback(
    (
      movesStr: string
    ): { board: BoardState; turn: PieceColor } => {
      if (!movesStr.trim()) {
        return {
          board: INITIAL_BOARD.map((r) => r.map((c) => (c ? { ...c } : null))),
          turn: "w",
        };
      }

      const moves = movesStr.trim().split(" ");
      let currentBoard: BoardState = INITIAL_BOARD.map((r) =>
        r.map((c) => (c ? { ...c } : null))
      );
      let currentTurn: PieceColor = "w";

      for (const uciMove of moves) {
        if (uciMove.length < 4) continue;
        const fromC = uciMove.charCodeAt(0) - 97;
        const fromR = 8 - parseInt(uciMove[1]);
        const toC = uciMove.charCodeAt(2) - 97;
        const toR = 8 - parseInt(uciMove[3]);

        if (fromR < 0 || fromR > 7 || fromC < 0 || fromC > 7) continue;
        if (toR < 0 || toR > 7 || toC < 0 || toC > 7) continue;

        const newBoard = currentBoard.map((r) =>
          r.map((c) => (c ? { ...c } : null))
        );
        newBoard[toR][toC] = newBoard[fromR][fromC];
        newBoard[fromR][fromC] = null;

        if (uciMove.length === 5) {
          const promoMap: Record<string, PieceType> = {
            q: "queen",
            r: "rook",
            b: "bishop",
            n: "knight",
          };
          const piece = newBoard[toR][toC];
          if (piece && promoMap[uciMove[4]]) {
            piece.type = promoMap[uciMove[4]];
          }
        }

        const piece = newBoard[toR][toC];
        if (piece?.type === "king") {
          if (toC - fromC === 2) {
            newBoard[toR][toC - 1] = newBoard[toR][7];
            newBoard[toR][7] = null;
          } else if (fromC - toC === 2) {
            newBoard[toR][toC + 1] = newBoard[toR][0];
            newBoard[toR][0] = null;
          }
        }

        if (piece?.type === "pawn" && toC !== fromC && !currentBoard[toR][toC]) {
          newBoard[fromR][toC] = null;
        }

        currentBoard = newBoard;
        currentTurn = currentTurn === "w" ? "b" : "w";
      }

      return { board: currentBoard, turn: currentTurn };
    },
    []
  );

  const handleSeek = () => {
    if (!usernameInput.trim()) {
      setError("Please enter a username");
      return;
    }

    const name = usernameInput.trim();
    setUsername(name);
    localStorage.setItem("online_username", name);
    setError(null);
    setPhase("seeking");
    setGameResult(null);
    setBoard(INITIAL_BOARD);
    setTurn("w");

    const es = new EventSource(
      `/api/online/join?username=${encodeURIComponent(name)}&playerId=${playerId.current}`
    );
    eventSourceRef.current = es;

    es.addEventListener("matched", (e) => {
      const data = JSON.parse(e.data);
      setGameInfo({
        gameId: data.gameId,
        myColor: data.myColor,
        opponentName:
          data.myColor === "w" ? data.black.username : data.white.username,
      });
      setClocks({ white: data.whiteTime, black: data.blackTime });
      setPhase("playing");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    });

    es.addEventListener("move", (e) => {
      const data = JSON.parse(e.data);
      const { board: newBoard, turn: newTurn } = applyMovesToBoard(data.moves);
      setBoard(newBoard);
      setTurn(newTurn);
      setClocks({ white: data.whiteTime, black: data.blackTime });
    });

    es.addEventListener("gameOver", (e) => {
      const data = JSON.parse(e.data);
      setPhase("ended");
      setGameResult({ reason: data.reason, winner: data.winner });
      if (data.moves) {
        const { board: finalBoard, turn: finalTurn } = applyMovesToBoard(data.moves);
        setBoard(finalBoard);
        setTurn(finalTurn);
      }
      cleanup();
    });

    es.addEventListener("error", () => {
      if (phase === "seeking") {
        setError("Connection lost. Try again.");
        setPhase("idle");
      }
      cleanup();
    });

    es.addEventListener("cancelled", () => {
      setPhase("idle");
      cleanup();
    });
  };

  const handleCancelSeek = async () => {
    cleanup();
    try {
      await fetch("/api/online/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: playerId.current }),
      });
    } catch {}
    setPhase("idle");
  };

  const handleResign = async () => {
    if (!gameInfo) return;
    await fetch("/api/online/resign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: gameInfo.gameId,
        playerId: playerId.current,
      }),
    });
  };

  const handleRawMove = async (move: MoveInfo) => {
    if (!gameInfo || phase !== "playing") return;
    if (turn !== gameInfo.myColor) return;

    const uci = moveToUCI(
      move.from[0],
      move.from[1],
      move.to[0],
      move.to[1],
      move.promotion
    );

    const res = await fetch("/api/online/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId: gameInfo.gameId,
        playerId: playerId.current,
        uci,
      }),
    });

    if (!res.ok) {
      setError("Invalid move. Try again.");
      setTimeout(() => setError(null), 2000);
    }
  };

  const handleBoardMove = (_newBoard: BoardState, _nextTurn: PieceColor, capturedPieceType?: string) => {
    if (capturedPieceType && currentPlayerId && isMyTurn) {
      let captureXp = 10;
      if (capturedPieceType === 'pawn') captureXp = 5;
      else if (capturedPieceType === 'queen') captureXp = 25;
      
      awardXpMutation.mutate({ 
        id: parseInt(currentPlayerId), 
        amount: captureXp 
      });
    }
  };

  const handleRematch = () => {
    setPhase("idle");
    setGameResult(null);
    setBoard(INITIAL_BOARD);
    setTurn("w");
    setGameInfo(null);
    xpAwardedRef.current = false;
  };

  const isMyTurn = gameInfo ? turn === gameInfo.myColor : false;

  const pieceValues: Record<string, number> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
  };

  const calculateScores = () => {
    const startingMaterial = 8 * 1 + 2 * 3 + 2 * 3 + 2 * 5 + 1 * 9;
    let whiteRemaining = 0;
    let blackRemaining = 0;

    for (const row of board) {
      for (const piece of row) {
        if (piece) {
          const value = pieceValues[piece.type] || 0;
          if (piece.color === "w") whiteRemaining += value;
          else blackRemaining += value;
        }
      }
    }

    return {
      whiteScore: startingMaterial - blackRemaining,
      blackScore: startingMaterial - whiteRemaining,
    };
  };

  const { whiteScore, blackScore } = calculateScores();

  const getResultText = () => {
    if (!gameResult) return "";
    const { reason, winner } = gameResult;
    const myColor = gameInfo?.myColor === "w" ? "w" : "b";
    const iWon = winner === myColor;
    if (reason === "checkmate")
      return iWon ? "You Win by Checkmate!" : "You Lost by Checkmate";
    if (reason === "resign")
      return iWon ? "Opponent Resigned - You Win!" : "You Resigned";
    if (reason === "timeout")
      return iWon ? "Opponent Timed Out - You Win!" : "You Timed Out";
    if (reason === "stalemate") return "Stalemate - Draw!";
    if (reason === "draw") return "Draw!";
    if (reason === "aborted") return "Game Aborted";
    return `Game Over (${reason})`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-[#00ff88]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-[#ff00ff]/5 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-card/95 backdrop-blur-md border-2 border-[#00ff88] rounded-2xl p-8 shadow-[0_0_60px_rgba(0,255,136,0.3)] text-center"
            >
              <Swords className="w-16 h-16 text-[#00ff88] mx-auto mb-4" />
              <h2 className="text-3xl font-comic text-[#00ff88] mb-2">
                MATCHED!
              </h2>
              <p className="text-lg text-foreground">
                vs {gameInfo?.opponentName}
              </p>
              <Badge className="mt-3 bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/50">
                You play as {gameInfo?.myColor === "w" ? "White" : "Black"}
              </Badge>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Base
          </Link>

          <Card className="p-6 bg-card/50 backdrop-blur border-[#00ff88]/20 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#00ff88]" />
              <span className="text-sm font-tech text-[#00ff88] uppercase tracking-wider">
                Online Match
              </span>
            </div>

            {phase === "idle" && !gameInfo && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm text-center">
                  Enter your username to find an opponent!
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Your username"
                      data-testid="input-username"
                      className="pl-10 bg-background/50 border-[#00ff88]/30 focus:border-[#00ff88]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSeek();
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSeek}
                    data-testid="button-find-match"
                    className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc66] text-black font-bold hover:from-[#00ff99] hover:to-[#00dd77] shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.5)]"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Play Random Online
                  </Button>
                </div>
              </div>
            )}

            {phase === "seeking" && (
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User className="w-4 h-4 text-[#00ff88]" />
                  <span className="text-sm font-bold text-foreground">
                    {username}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#ff00ff]" />
                  <span className="text-sm text-foreground">
                    Waiting for opponent...
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">5 min + 0</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSeek}
                  data-testid="button-cancel-seek"
                  className="border-destructive/50 text-destructive"
                >
                  Cancel
                </Button>
              </div>
            )}

            {(phase === "playing" || phase === "matched") && gameInfo && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-[#00ff88]/30 bg-[#00ff88]/5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">
                      vs {gameInfo.opponentName}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    You are {gameInfo.myColor === "w" ? "White" : "Black"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`p-3 rounded-lg border-2 transition-all ${turn === "w" ? "border-blue-500 bg-blue-500/10" : "border-transparent opacity-60"}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <User className="w-3 h-3 text-blue-400" />
                      <span className="text-xs font-bold text-blue-400">
                        White
                      </span>
                      {gameInfo.myColor === "w" && (
                        <span className="text-[10px] text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span
                        className="font-mono text-sm font-bold"
                        data-testid="text-white-clock"
                      >
                        {formatClock(clocks.white)}
                      </span>
                    </div>
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid="text-white-score"
                    >
                      Score: {whiteScore}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg border-2 transition-all ${turn === "b" ? "border-red-500 bg-red-500/10" : "border-transparent opacity-60"}`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <User className="w-3 h-3 text-red-500" />
                      <span className="text-xs font-bold text-red-500">
                        Black
                      </span>
                      {gameInfo.myColor === "b" && (
                        <span className="text-[10px] text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span
                        className="font-mono text-sm font-bold"
                        data-testid="text-black-clock"
                      >
                        {formatClock(clocks.black)}
                      </span>
                    </div>
                    <span
                      className="text-xs text-muted-foreground"
                      data-testid="text-black-score"
                    >
                      Score: {blackScore}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  {isMyTurn ? (
                    <Badge className="bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/50">
                      Your turn
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Opponent thinking...</Badge>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResign}
                  data-testid="button-resign"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Resign
                </Button>
              </div>
            )}

            {phase === "ended" && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-lg border border-accent/50 bg-accent/10">
                  <Swords className="w-10 h-10 text-accent mx-auto mb-2" />
                  <h3 className="text-xl font-comic text-accent">
                    {getResultText()}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRematch}
                    data-testid="button-rematch"
                    className="flex-1 bg-gradient-to-r from-[#ff00ff] to-[#cc00cc] text-white font-bold"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    New Match
                  </Button>
                  <Link href="/">
                    <Button variant="outline">Home</Button>
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive text-center">
                {error}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col items-center justify-center order-1 lg:order-2">
          {phase === "seeking" ? (
            <div className="w-full max-w-[600px] aspect-square flex items-center justify-center rounded-lg border-4 border-muted bg-zinc-900/50 relative overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00ff88]/5 to-[#ff00ff]/5 animate-pulse" />
              </div>
              <div className="text-center z-10 space-y-4">
                <div className="relative">
                  <RefreshCw className="w-16 h-16 text-[#ff00ff] mx-auto animate-spin" />
                  <div className="absolute inset-0 blur-xl bg-[#ff00ff]/20 rounded-full animate-pulse" />
                </div>
                <h3 className="text-2xl font-comic text-foreground">
                  Searching...
                </h3>
                <p className="text-muted-foreground text-sm">
                  Looking for a worthy opponent
                </p>
              </div>
            </div>
          ) : (
            <GameBoard
              board={board}
              turn={turn}
              onMove={handleBoardMove}
              onRawMove={handleRawMove}
              disabled={phase !== "playing" || !isMyTurn}
              boardTheme={equippedBoardTheme}
            />
          )}

          {phase === "playing" && (
            <div className="mt-4 flex items-center gap-2 text-muted-foreground">
              {isMyTurn ? (
                <span className="text-sm text-[#00ff88] font-bold">
                  Your move!
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Opponent is thinking...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
