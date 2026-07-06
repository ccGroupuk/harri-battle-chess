import type { Response } from "express";

export interface OnlinePlayer {
  id: string;
  username: string;
  res: Response;
}

export interface OnlineGame {
  id: string;
  white: { id: string; username: string };
  black: { id: string; username: string };
  moves: string[];
  turn: "w" | "b";
  status: "playing" | "ended";
  result?: { winner?: "w" | "b"; reason: string };
  whiteTime: number;
  blackTime: number;
  lastMoveAt: number;
  listeners: Map<string, Response>;
}

const waitingQueue: OnlinePlayer[] = [];
const activeGames = new Map<string, OnlineGame>();
const playerToGame = new Map<string, string>();

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function sendSSE(res: Response, event: string, data: unknown) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {}
}

function broadcastToGame(game: OnlineGame, event: string, data: unknown) {
  for (const [, res] of game.listeners) {
    sendSSE(res, event, data);
  }
}

function setupGameDisconnectHandler(playerRes: Response, pId: string, gId: string) {
  playerRes.on("close", () => {
    const g = activeGames.get(gId);
    if (g && g.status === "playing") {
      g.listeners.delete(pId);
      const isWhite = g.white.id === pId;
      const winner = isWhite ? "b" : "w";
      endGame(gId, "disconnect", winner);
    }
  });
}

export function joinQueue(playerId: string, username: string, res: Response): boolean {
  const existing = waitingQueue.findIndex((p) => p.id === playerId);
  if (existing !== -1) {
    try { waitingQueue[existing].res.end(); } catch {}
    waitingQueue.splice(existing, 1);
  }

  const existingGameId = playerToGame.get(playerId);
  if (existingGameId) {
    const game = activeGames.get(existingGameId);
    if (game && game.status === "playing") {
      return false;
    }
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  sendSSE(res, "waiting", { message: "Waiting for opponent..." });

  const player: OnlinePlayer = { id: playerId, username, res };

  if (waitingQueue.length > 0) {
    const opponent = waitingQueue.shift()!;

    const coinFlip = Math.random() < 0.5;
    const whitePlayer = coinFlip ? player : opponent;
    const blackPlayer = coinFlip ? opponent : player;

    const gameId = generateId();
    const now = Date.now();

    const game: OnlineGame = {
      id: gameId,
      white: { id: whitePlayer.id, username: whitePlayer.username },
      black: { id: blackPlayer.id, username: blackPlayer.username },
      moves: [],
      turn: "w",
      status: "playing",
      whiteTime: 300000,
      blackTime: 300000,
      lastMoveAt: now,
      listeners: new Map(),
    };

    game.listeners.set(whitePlayer.id, whitePlayer.res);
    game.listeners.set(blackPlayer.id, blackPlayer.res);

    activeGames.set(gameId, game);
    playerToGame.set(whitePlayer.id, gameId);
    playerToGame.set(blackPlayer.id, gameId);

    const matchData = {
      gameId,
      white: { username: whitePlayer.username },
      black: { username: blackPlayer.username },
      whiteTime: game.whiteTime,
      blackTime: game.blackTime,
    };

    sendSSE(whitePlayer.res, "matched", { ...matchData, myColor: "w" });
    sendSSE(blackPlayer.res, "matched", { ...matchData, myColor: "b" });

    setupGameDisconnectHandler(whitePlayer.res, whitePlayer.id, gameId);
    setupGameDisconnectHandler(blackPlayer.res, blackPlayer.id, gameId);
  } else {
    waitingQueue.push(player);

    res.on("close", () => {
      const idx = waitingQueue.findIndex((p) => p.id === playerId);
      if (idx !== -1) {
        waitingQueue.splice(idx, 1);
      }
    });
  }

  return true;
}

export function cancelQueue(playerId: string): boolean {
  const idx = waitingQueue.findIndex((p) => p.id === playerId);
  if (idx !== -1) {
    const player = waitingQueue[idx];
    sendSSE(player.res, "cancelled", { message: "Search cancelled" });
    try { player.res.end(); } catch {}
    waitingQueue.splice(idx, 1);
    return true;
  }
  return false;
}

export function makeGameMove(
  gameId: string,
  playerId: string,
  uci: string
): { success: boolean; error?: string } {
  const game = activeGames.get(gameId);
  if (!game) return { success: false, error: "Game not found" };
  if (game.status !== "playing") return { success: false, error: "Game is over" };

  const isWhite = game.white.id === playerId;
  const isBlack = game.black.id === playerId;
  if (!isWhite && !isBlack) return { success: false, error: "Not in this game" };

  const playerColor = isWhite ? "w" : "b";
  if (game.turn !== playerColor) return { success: false, error: "Not your turn" };

  const now = Date.now();
  const elapsed = now - game.lastMoveAt;
  if (game.turn === "w") {
    game.whiteTime = Math.max(0, game.whiteTime - elapsed);
  } else {
    game.blackTime = Math.max(0, game.blackTime - elapsed);
  }

  game.moves.push(uci);
  game.turn = game.turn === "w" ? "b" : "w";
  game.lastMoveAt = now;

  broadcastToGame(game, "move", {
    uci,
    moves: game.moves.join(" "),
    turn: game.turn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  });

  return { success: true };
}

export function endGame(
  gameId: string,
  reason: string,
  winner?: "w" | "b"
): boolean {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "playing") return false;

  game.status = "ended";
  game.result = { winner, reason };

  broadcastToGame(game, "gameOver", {
    reason,
    winner,
    moves: game.moves.join(" "),
  });

  for (const [, res] of game.listeners) {
    try { res.end(); } catch {}
  }
  game.listeners.clear();

  setTimeout(() => {
    activeGames.delete(gameId);
    if (game.white.id) playerToGame.delete(game.white.id);
    if (game.black.id) playerToGame.delete(game.black.id);
  }, 60000);

  return true;
}

export function resignGame(gameId: string, playerId: string): boolean {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "playing") return false;

  const isWhite = game.white.id === playerId;
  const winner = isWhite ? "b" : "w";
  return endGame(gameId, "resign", winner);
}

export function reportCheckmate(gameId: string, winner: "w" | "b"): boolean {
  return endGame(gameId, "checkmate", winner);
}

export function reportDraw(gameId: string, reason: string): boolean {
  return endGame(gameId, reason);
}

export function getGame(gameId: string): OnlineGame | undefined {
  return activeGames.get(gameId);
}

export function reconnectToGame(gameId: string, playerId: string, res: Response): boolean {
  const game = activeGames.get(gameId);
  if (!game || game.status !== "playing") return false;

  const isPlayer = game.white.id === playerId || game.black.id === playerId;
  if (!isPlayer) return false;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  game.listeners.set(playerId, res);

  const myColor = game.white.id === playerId ? "w" : "b";
  sendSSE(res, "reconnected", {
    gameId: game.id,
    myColor,
    white: { username: game.white.username },
    black: { username: game.black.username },
    moves: game.moves.join(" "),
    turn: game.turn,
    whiteTime: game.whiteTime,
    blackTime: game.blackTime,
  });

  setupGameDisconnectHandler(res, playerId, gameId);

  return true;
}
