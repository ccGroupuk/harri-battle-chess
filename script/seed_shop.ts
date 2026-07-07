import { db } from "../server/db";
import { shopItems } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding shop items...");
  const items = [
    {
      name: "Avengers Compound",
      description: "High-tech metallic board with subtle glowing cyan lines.",
      type: "board",
      price: 1500,
      imageUrl: "/assets/avengers_board.png",
      data: { backgroundImage: "url('/assets/avengers_board.png')" },
    },
    {
      name: "Cosmic Galaxy",
      description: "Swirling purple and gold nebulas with retro neon grid lines.",
      type: "board",
      price: 1500,
      imageUrl: "/assets/guardians_board.png",
      data: { backgroundImage: "url('/assets/guardians_board.png')" },
    },
    {
      name: "Sinister Lair",
      description: "Dark grunge concrete with glowing radioactive green ooze.",
      type: "board",
      price: 1500,
      imageUrl: "/assets/sinister_board.png",
      data: { backgroundImage: "url('/assets/sinister_board.png')" },
    },
    {
      name: "Avengers Roster",
      description: "Iron-Man hot rod red and gold metallic armor pieces.",
      type: "piece_style",
      price: 2000,
      imageUrl: "/assets/avengers_piece_texture.png",
      data: { textureUrl: "/assets/avengers_piece_texture.png" },
    },
    {
      name: "Guardians Crew",
      description: "Cosmic glowing purple and magenta with star-lord gold.",
      type: "piece_style",
      price: 2000,
      imageUrl: "/assets/guardians_piece_texture.png",
      data: { textureUrl: "/assets/guardians_piece_texture.png" },
    },
    {
      name: "Sinister 6 Villains",
      description: "Dark gunmetal grey with veins of glowing radioactive green.",
      type: "piece_style",
      price: 2000,
      imageUrl: "/assets/sinister_piece_texture.png",
      data: { textureUrl: "/assets/sinister_piece_texture.png" },
    },
    {
      name: "Classic Wood Board",
      description: "The OG. Traditional wooden light and dark squares.",
      type: "board",
      price: 500,
      imageUrl: "",
      data: { lightColor: "#f0d9b5", darkColor: "#b58863" },
    },
    {
      name: "Classic Chess Pieces",
      description: "The OG. Traditional classic chess piece symbols.",
      type: "piece_style",
      price: 500,
      imageUrl: "",
      data: { useClassicSvg: true },
    }
  ];

  for (const item of items) {
    const existing = await db.select().from(shopItems).where(eq(shopItems.name, item.name));
    if (existing.length === 0) {
      await db.insert(shopItems).values(item);
      console.log(`Added: ${item.name}`);
    } else {
      console.log(`Skipped (already exists): ${item.name}`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
