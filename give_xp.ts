import { db } from "./server/db";
import { leaderboard } from "./shared/schema";
import { eq, ilike } from "drizzle-orm";

async function run() {
  const users = await db.select().from(leaderboard);
  console.log("All leaderboard users:", users);
  
  const harriUsers = users.filter(u => u.name.toLowerCase().includes('harri'));
  
  if (harriUsers.length > 0) {
    for (const user of harriUsers) {
      await db.update(leaderboard).set({ xp: 999999999 }).where(eq(leaderboard.id, user.id));
      console.log(`Updated ${user.name} (ID: ${user.id}) with 999999999 XP!`);
    }
  } else {
    console.log("No user found with name containing 'harri'. Creating one now...");
    const [newUser] = await db.insert(leaderboard).values({
      name: "Harri",
      xp: 999999999,
      wins: 1000,
      losses: 0,
    }).returning();
    console.log(`Created Harri with ID ${newUser.id} and unlimited XP!`);
  }
  process.exit(0);
}

run().catch(console.error);
