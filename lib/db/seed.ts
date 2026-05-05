import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { rooms, players, gameRounds, gameMoves } from "./schema";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("Seeding database...");

  // Clean existing data (order matters due to FK constraints)
  await db.delete(gameMoves);
  await db.delete(gameRounds);
  await db.delete(players);
  await db.delete(rooms);

  // Create a test room
  const [room] = await db
    .insert(rooms)
    .values({
      code: "TEST01",
      status: "playing",
      currentPhase: "description",
      deckType: "standard",
      config: { rounds: 5, timer: 60 },
    })
    .returning();

  console.log(`Created room: ${room.id} (${room.code})`);

  // Create 3 players: judge, honest, liar
  const [judge] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: "Judge Judy",
      role: "judge",
      secretHash: "$2b$10$placeholder_hash_judge",
    })
    .returning();

  const [honest] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: "Honest Abe",
      role: "honest",
      secretHash: "$2b$10$placeholder_hash_honest",
    })
    .returning();

  const [liar] = await db
    .insert(players)
    .values({
      roomId: room.id,
      name: "Lying Larry",
      role: "liar",
      secretHash: "$2b$10$placeholder_hash_liar",
    })
    .returning();

  console.log(`Created players: judge=${judge.id}, honest=${honest.id}, liar=${liar.id}`);

  // Create 2 rounds
  const [round1] = await db
    .insert(gameRounds)
    .values({
      roomId: room.id,
      roundNumber: 1,
      cardPhrase: "A suspiciously specific denial",
      cardAnswer: "I did not have sexual relations with that woman",
      categories: ["politics", "denial"],
    })
    .returning();

  const [round2] = await db
    .insert(gameRounds)
    .values({
      roomId: room.id,
      roundNumber: 2,
      cardPhrase: "The worst thing to say at a wedding toast",
      cardAnswer: "I always knew they'd get divorced",
      categories: ["weddings", "social"],
    })
    .returning();

  console.log(`Created rounds: ${round1.id}, ${round2.id}`);

  // Add a sample move
  await db.insert(gameMoves).values({
    roomId: room.id,
    playerId: honest.id,
    roundId: round1.id,
    moveType: "submit_description",
    data: { description: "A famous political scandal quote" },
  });

  console.log("Seed complete.");

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
