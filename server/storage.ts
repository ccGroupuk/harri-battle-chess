import { db } from "./db";
import { 
  games, leaderboard, shopItems, playerPurchases,
  type Game, type InsertGame, type LeaderboardEntry, type InsertLeaderboardEntry,
  type ShopItem, type InsertShopItem, type PlayerPurchase, type InsertPlayerPurchase
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  createGame(game: InsertGame): Promise<Game>;
  getGame(id: number): Promise<Game | undefined>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game>;
  
  // Leaderboard methods
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  getLeaderboardEntry(id: number): Promise<LeaderboardEntry | undefined>;
  getUserByUsername(username: string): Promise<LeaderboardEntry | undefined>;
  createUser(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry>;
  updateLeaderboardEntry(id: number, entry: Partial<InsertLeaderboardEntry>): Promise<LeaderboardEntry>;
  deleteLeaderboardEntry(id: number): Promise<void>;
  incrementXp(id: number, amount: number): Promise<LeaderboardEntry>;
  
  // Shop methods
  getShopItems(): Promise<ShopItem[]>;
  getShopItem(id: number): Promise<ShopItem | undefined>;
  createShopItem(item: InsertShopItem): Promise<ShopItem>;
  getPlayerPurchases(playerId: number): Promise<PlayerPurchase[]>;
  purchaseItem(playerId: number, itemId: number): Promise<PlayerPurchase>;
  atomicPurchase(playerId: number, itemId: number, price: number): Promise<PlayerPurchase>;
  equipItem(playerId: number, purchaseId: number, itemType: string): Promise<PlayerPurchase>;
  getEquippedItems(playerId: number): Promise<PlayerPurchase[]>;
}

export class DatabaseStorage implements IStorage {
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async updateGame(id: number, updates: Partial<InsertGame>): Promise<Game> {
    const [updated] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return updated;
  }

  // Leaderboard methods
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return db.select().from(leaderboard).orderBy(desc(leaderboard.wins));
  }

  async getLeaderboardEntry(id: number): Promise<LeaderboardEntry | undefined> {
    const [entry] = await db.select().from(leaderboard).where(eq(leaderboard.id, id));
    return entry;
  }

  async getUserByUsername(username: string): Promise<LeaderboardEntry | undefined> {
    const [user] = await db.select().from(leaderboard).where(sql`lower(${leaderboard.name}) = lower(${username})`);
    return user;
  }

  async createUser(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const [created] = await db.insert(leaderboard).values(entry).returning();
    return created;
  }

  async createLeaderboardEntry(entry: InsertLeaderboardEntry): Promise<LeaderboardEntry> {
    const [created] = await db.insert(leaderboard).values(entry).returning();
    return created;
  }

  async updateLeaderboardEntry(id: number, updates: Partial<InsertLeaderboardEntry>): Promise<LeaderboardEntry> {
    const [updated] = await db
      .update(leaderboard)
      .set(updates)
      .where(eq(leaderboard.id, id))
      .returning();
    return updated;
  }

  async deleteLeaderboardEntry(id: number): Promise<void> {
    await db.delete(leaderboard).where(eq(leaderboard.id, id));
  }

  async incrementXp(id: number, amount: number): Promise<LeaderboardEntry> {
    const [updated] = await db
      .update(leaderboard)
      .set({ xp: sql`${leaderboard.xp} + ${amount}` })
      .where(eq(leaderboard.id, id))
      .returning();
    return updated;
  }

  // Shop methods
  async getShopItems(): Promise<ShopItem[]> {
    return db.select().from(shopItems);
  }

  async getShopItem(id: number): Promise<ShopItem | undefined> {
    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, id));
    return item;
  }

  async createShopItem(item: InsertShopItem): Promise<ShopItem> {
    const [created] = await db.insert(shopItems).values(item).returning();
    return created;
  }

  async getPlayerPurchases(playerId: number): Promise<PlayerPurchase[]> {
    return db.select().from(playerPurchases).where(eq(playerPurchases.playerId, playerId));
  }

  async purchaseItem(playerId: number, itemId: number): Promise<PlayerPurchase> {
    const [purchase] = await db.insert(playerPurchases).values({
      playerId,
      itemId,
      equipped: false,
    }).returning();
    return purchase;
  }

  async atomicPurchase(playerId: number, itemId: number, price: number): Promise<PlayerPurchase> {
    // Deduct XP with conditional update (only if sufficient XP)
    const [updated] = await db
      .update(leaderboard)
      .set({ xp: sql`${leaderboard.xp} - ${price}` })
      .where(and(eq(leaderboard.id, playerId), sql`${leaderboard.xp} >= ${price}`))
      .returning();

    if (!updated) {
      throw new Error("Not enough XP or player not found");
    }

    // Create purchase - unique constraint will prevent duplicates
    try {
      const [purchase] = await db.insert(playerPurchases).values({
        playerId,
        itemId,
        equipped: false,
      }).returning();

      return purchase;
    } catch (err: any) {
      // If duplicate key error, refund XP and throw
      if (err.code === '23505') { // PostgreSQL unique violation
        await db
          .update(leaderboard)
          .set({ xp: sql`${leaderboard.xp} + ${price}` })
          .where(eq(leaderboard.id, playerId));
        throw new Error("You already own this item");
      }
      throw err;
    }
  }

  async equipItem(playerId: number, purchaseId: number, itemType: string): Promise<PlayerPurchase> {
    // First, get the purchase to find the item type
    const [purchase] = await db.select().from(playerPurchases).where(eq(playerPurchases.id, purchaseId));
    if (!purchase) throw new Error("Purchase not found");

    // Validate ownership - ensure this purchase belongs to the player
    if (purchase.playerId !== playerId) {
      throw new Error("You don't own this item");
    }

    // Get the item to find its type
    const [item] = await db.select().from(shopItems).where(eq(shopItems.id, purchase.itemId));
    if (!item) throw new Error("Item not found");

    // Unequip all items of the same type for this player
    const playerItems = await db.select().from(playerPurchases).where(eq(playerPurchases.playerId, playerId));
    for (const pi of playerItems) {
      const [piItem] = await db.select().from(shopItems).where(eq(shopItems.id, pi.itemId));
      if (piItem && piItem.type === item.type && pi.equipped) {
        await db.update(playerPurchases).set({ equipped: false }).where(eq(playerPurchases.id, pi.id));
      }
    }

    // Equip the selected item
    const [updated] = await db
      .update(playerPurchases)
      .set({ equipped: true })
      .where(eq(playerPurchases.id, purchaseId))
      .returning();
    return updated;
  }

  async getEquippedItems(playerId: number): Promise<PlayerPurchase[]> {
    return db.select().from(playerPurchases).where(
      and(eq(playerPurchases.playerId, playerId), eq(playerPurchases.equipped, true))
    );
  }
}

export const storage = new DatabaseStorage();
