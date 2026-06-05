import "dotenv/config";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { prepareDeck } from "@bsking/game-engine";
import type { DeckType } from "@bsking/game-engine";
import { generatePlayerToken } from "@/lib/auth";
import { getRoundRoles } from "@/lib/round-roles";
import { gameRounds, players, rooms } from "./schema";

const DEFAULT_PLAYER_NAMES = [
  "Host",
  "Alice",
  "Bob",
  "Charlie",
  "Diana",
  "Eve",
  "Frank",
];

function generateCode(): string {
  return randomBytes(4)
    .toString("base64url")
    .replace(/[-_]/g, "")
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, "0");
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  const deckType: DeckType = "absurd-truths";
  const roundCount = 5;
  const timerSecs = 30;
  const playerNames = DEFAULT_PLAYER_NAMES.slice(0, 7);

  console.log("Seeding one playable room...");

  let code = generateCode();

  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db
      .select({ id: rooms.id })
      .from(rooms)
      .where(eq(rooms.code, code))
      .limit(1);

    if (existing.length === 0) {
      break;
    }

    code = generateCode();
  }

  const [room] = await db
    .insert(rooms)
    .values({
      code,
      status: "playing",
      currentPhase: "reading",
      currentRoundNumber: 1,
      deckType,
      config: { deckType, roundCount, timerSecs },
      updatedAt: new Date(),
    })
    .returning({ id: rooms.id, code: rooms.code });

  const seededPlayers: Array<{
    id: string;
    name: string;
    secret: string;
  }> = [];

  for (const name of playerNames) {
    const token = generatePlayerToken();
    const [player] = await db
      .insert(players)
      .values({
        roomId: room.id,
        name,
        secretHash: token.hash,
      })
      .returning({ id: players.id });

    seededPlayers.push({
      id: player.id,
      name,
      secret: token.plaintext,
    });
  }

  await db
    .update(rooms)
    .set({
      createdBy: seededPlayers[0]!.id,
      updatedAt: new Date(),
    })
    .where(eq(rooms.id, room.id));

  const roundOneRoles = getRoundRoles(seededPlayers);

  await db
    .update(players)
    .set({ role: "judge" })
    .where(eq(players.id, roundOneRoles.judgePlayerId));

  await db
    .update(players)
    .set({ role: "honest" })
    .where(eq(players.id, roundOneRoles.honestPlayerId));

  for (const liarPlayerId of roundOneRoles.liarPlayerIds) {
    await db
      .update(players)
      .set({ role: "liar" })
      .where(eq(players.id, liarPlayerId));
  }

  const cards = prepareDeck(deckType, roundCount);

  for (let index = 0; index < cards.length; index++) {
    const roundNumber = index + 1;
    const roundRoles = getRoundRoles(seededPlayers);

    await db.insert(gameRounds).values({
      roomId: room.id,
      roundNumber,
      judgePlayerId: roundRoles.judgePlayerId,
      honestPlayerId: roundRoles.honestPlayerId,
      cardPhrase: cards[index]!.phrase,
      cardAnswer: cards[index]!.answer,
      categories: cards[index]!.categories ?? [],
    });
  }

  console.log(`Created room: ${room.code}`);
  console.log("Share these credentials if you want to skip manual registration:");

  for (const [index, player] of seededPlayers.entries()) {
    const label = index === 0 ? `${player.name} (host)` : player.name;
    console.log(
      JSON.stringify({
        player: label,
        roomCode: room.code,
        playerId: player.id,
        playerSecret: player.secret,
      })
    );
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
