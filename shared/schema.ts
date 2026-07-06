import { pgTable, text, serial, jsonb, boolean, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type GameMode = 'local' | 'ai_easy' | 'ai_medium' | 'ai_hard' | 'harri_smash' | 'custom';

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  board: jsonb("board").notNull(), // 2D array of pieces
  turn: text("turn").notNull().default("w"), // 'w' or 'b'
  isGameOver: boolean("is_game_over").default(false),
  winner: text("winner"), // 'w', 'b', or 'draw'
  gameMode: text("game_mode").notNull().default("local"), // 'local', 'ai_easy', 'ai_medium', 'ai_hard', 'harri_smash'
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true });

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type GameBoard = (Piece | null)[][];

// Leaderboard table (also serves as users table)
export const leaderboard = pgTable("leaderboard", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  password: text("password").notNull().default(''), // Added for authentication
  photoUrl: text("photo_url"),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  xp: integer("xp").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaderboardSchema = createInsertSchema(leaderboard).omit({ id: true, createdAt: true });

export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardSchema>;

// Shop item types
export type ShopItemType = 'board' | 'piece_style' | 'accessory';

// Shop items table (catalog of items available for purchase)
export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'board', 'piece_style', 'accessory'
  price: integer("price").notNull(), // XP cost
  imageUrl: text("image_url"), // Preview image
  data: jsonb("data"), // Additional styling data (colors, patterns, etc.)
});

export const insertShopItemSchema = createInsertSchema(shopItems).omit({ id: true });

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = z.infer<typeof insertShopItemSchema>;

// Player purchases table (tracks what each player owns)
export const playerPurchases = pgTable("player_purchases", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(), // References leaderboard.id
  itemId: integer("item_id").notNull(), // References shopItems.id
  purchasedAt: timestamp("purchased_at").defaultNow(),
  equipped: boolean("equipped").default(false), // Is this item currently equipped?
}, (table) => [
  uniqueIndex("player_item_unique_idx").on(table.playerId, table.itemId),
]);

export const insertPlayerPurchaseSchema = createInsertSchema(playerPurchases).omit({ id: true, purchasedAt: true });

export type PlayerPurchase = typeof playerPurchases.$inferSelect;
export type InsertPlayerPurchase = z.infer<typeof insertPlayerPurchaseSchema>;
