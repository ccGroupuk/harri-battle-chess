import { db } from "../server/db";
import { leaderboard } from "../shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../server/auth";

async function run() {
  const newPassword = process.argv[2];
  const username = process.argv[3] || "harri";

  if (!newPassword) {
    console.error("Please provide a new password: npx tsx reset-password.ts <password> [username]");
    process.exit(1);
  }

  console.log(`Resetting password for user: ${username}...`);
  
  const hashed = await hashPassword(newPassword);
  
  const result = await db.update(leaderboard)
    .set({ password: hashed })
    .where(eq(leaderboard.name, username))
    .returning();
    
  if (result.length > 0) {
    console.log(`Success! Password for ${username} has been updated.`);
  } else {
    console.log(`User ${username} not found!`);
  }
  
  process.exit(0);
}

run().catch(console.error);
