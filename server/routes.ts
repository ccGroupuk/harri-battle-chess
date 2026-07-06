import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { type PieceType, insertLeaderboardSchema, insertShopItemSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import {
  joinQueue, cancelQueue, makeGameMove, resignGame as resignOnlineGame,
  reportCheckmate, reportDraw, reconnectToGame
} from "./online-matchmaking";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register object storage routes
  registerObjectStorageRoutes(app);
  
  app.post(api.games.create.path, async (req, res) => {
    try {
      const input = api.games.create.input.parse(req.body);
      const board = input.board ? (input.board as any) : initializeBoard();
      const game = await storage.createGame({
        board,
        turn: 'w',
        isGameOver: false,
        gameMode: input.gameMode || 'local',
      });
      res.status(201).json(game);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        throw err;
      }
    }
  });

  app.get(api.games.get.path, async (req, res) => {
    const game = await storage.getGame(Number(req.params.id));
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  });

  app.put(api.games.update.path, async (req, res) => {
    try {
      const input = api.games.update.input.parse(req.body);
      const game = await storage.updateGame(Number(req.params.id), input);
      res.json(game);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      }
    }
  });

  // Leaderboard endpoints
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const entries = await storage.getLeaderboard();
      res.json(entries);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  app.post("/api/leaderboard", async (req, res) => {
    try {
      const input = insertLeaderboardSchema.parse(req.body);
      const entry = await storage.createLeaderboardEntry(input);
      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to create leaderboard entry" });
      }
    }
  });

  app.put("/api/leaderboard/:id", async (req, res) => {
    try {
      const input = insertLeaderboardSchema.partial().parse(req.body);
      const entry = await storage.updateLeaderboardEntry(Number(req.params.id), input);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to update leaderboard entry" });
      }
    }
  });

  app.delete("/api/leaderboard/:id", async (req, res) => {
    try {
      await storage.deleteLeaderboardEntry(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete leaderboard entry" });
    }
  });

  app.post("/api/leaderboard/:id/xp", async (req, res) => {
    try {
      const amount = z.number().int().parse(req.body.amount);
      if (amount === 0) {
        return res.status(400).json({ message: "Invalid XP amount" });
      }
      const entry = await storage.incrementXp(Number(req.params.id), amount);
      res.json(entry);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid XP amount" });
      } else {
        res.status(500).json({ message: "Failed to award XP" });
      }
    }
  });

  // Shop endpoints
  app.get("/api/shop/items", async (req, res) => {
    try {
      const items = await storage.getShopItems();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch shop items" });
    }
  });

  app.post("/api/shop/items", async (req, res) => {
    try {
      const input = insertShopItemSchema.parse(req.body);
      const item = await storage.createShopItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to create shop item" });
      }
    }
  });

  app.get("/api/shop/purchases/:playerId", async (req, res) => {
    try {
      const purchases = await storage.getPlayerPurchases(Number(req.params.playerId));
      res.json(purchases);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/shop/purchase", async (req, res) => {
    try {
      const input = z.object({
        playerId: z.number().int().positive(),
        itemId: z.number().int().positive(),
      }).parse(req.body);

      // Check if player exists and has enough XP
      const player = await storage.getLeaderboardEntry(input.playerId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      const item = await storage.getShopItem(input.itemId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Check if player already owns this item
      const existingPurchases = await storage.getPlayerPurchases(input.playerId);
      if (existingPurchases.some(p => p.itemId === input.itemId)) {
        return res.status(400).json({ message: "You already own this item" });
      }

      if (player.xp < item.price) {
        return res.status(400).json({ message: "Not enough XP" });
      }

      // Atomic purchase: deduct XP and create purchase in one operation
      const purchase = await storage.atomicPurchase(input.playerId, input.itemId, item.price);
      res.status(201).json(purchase);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else if (err instanceof Error && err.message.includes("already own")) {
        res.status(400).json({ message: err.message });
      } else {
        res.status(500).json({ message: "Failed to purchase item" });
      }
    }
  });

  app.post("/api/shop/equip", async (req, res) => {
    try {
      const input = z.object({
        playerId: z.number().int().positive(),
        purchaseId: z.number().int().positive(),
      }).parse(req.body);

      const purchase = await storage.equipItem(input.playerId, input.purchaseId, "");
      res.json(purchase);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Failed to equip item" });
      }
    }
  });

  app.get("/api/shop/equipped/:playerId", async (req, res) => {
    try {
      const equipped = await storage.getEquippedItems(Number(req.params.playerId));
      res.json(equipped);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch equipped items" });
    }
  });

  app.get("/api/online/join", (req, res) => {
    const username = req.query.username as string;
    const playerId = req.query.playerId as string;
    if (!username || !playerId) {
      return res.status(400).json({ message: "Username and playerId required" });
    }
    const joined = joinQueue(playerId, username, res);
    if (!joined) {
      return res.status(409).json({ message: "Already in an active game" });
    }
  });

  app.post("/api/online/cancel", (req, res) => {
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ message: "playerId required" });
    cancelQueue(playerId);
    res.json({ ok: true });
  });

  app.post("/api/online/move", (req, res) => {
    const { gameId, playerId, uci } = req.body;
    if (!gameId || !playerId || !uci) {
      return res.status(400).json({ message: "gameId, playerId, and uci required" });
    }
    const result = makeGameMove(gameId, playerId, uci);
    if (result.success) {
      res.json({ ok: true });
    } else {
      res.status(400).json({ message: result.error });
    }
  });

  app.post("/api/online/resign", (req, res) => {
    const { gameId, playerId } = req.body;
    if (!gameId || !playerId) {
      return res.status(400).json({ message: "gameId and playerId required" });
    }
    resignOnlineGame(gameId, playerId);
    res.json({ ok: true });
  });

  app.post("/api/online/checkmate", (req, res) => {
    const { gameId, winner } = req.body;
    if (!gameId || !winner) {
      return res.status(400).json({ message: "gameId and winner required" });
    }
    reportCheckmate(gameId, winner);
    res.json({ ok: true });
  });

  app.post("/api/online/draw", (req, res) => {
    const { gameId, reason } = req.body;
    if (!gameId) return res.status(400).json({ message: "gameId required" });
    reportDraw(gameId, reason || "stalemate");
    res.json({ ok: true });
  });

  app.get("/api/online/reconnect/:gameId/:playerId", (req, res) => {
    const success = reconnectToGame(req.params.gameId, req.params.playerId, res);
    if (!success) {
      res.status(404).json({ message: "Game not found or already ended" });
    }
  });

  return httpServer;
}

function initializeBoard() {
  const board = Array(8).fill(null).map(() => Array(8).fill(null));

  // Helper to place pieces
  const placeRow = (row: number, color: 'w' | 'b', pieces: string[]) => {
    pieces.forEach((type, col) => {
      board[row][col] = { type, color };
    });
  };

  const backRow: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  const pawnRow: PieceType[] = Array(8).fill('pawn');

  placeRow(0, 'b', backRow);
  placeRow(1, 'b', pawnRow);
  placeRow(6, 'w', pawnRow);
  placeRow(7, 'w', backRow);

  return board;
}
