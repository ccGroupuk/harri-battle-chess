import { db } from "../server/db";
import { leaderboard } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";
import { hashPassword } from "../server/auth";

async function run() {
  const users = await db.select().from(leaderboard).where(ilike(leaderboard.name, '%harri%'));
  
  if (users.length > 0) {
    const hashedPassword = await hashPassword("Harri05");
    for (const user of users) {
      await db.update(leaderboard)
        .set({ password: hashedPassword })
        .where(eq(leaderboard.id, user.id));
      console.log(`Successfully set password for ${user.name} to Harri05`);
    }
  } else {
    console.log("No Harri profile found! You must run the give_xp script first or register manually.");
  }
  process.exit(0);
}

run().catch(console.error);
