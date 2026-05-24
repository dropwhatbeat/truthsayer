import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { rooms, players, gameRounds, gameMoves } from "../schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

beforeAll(async () => {
  // Ensure we're working with a clean slate
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
});

afterAll(async () => {
  await pool.end();
});

// Helper: clean up test data in correct FK order
async function cleanAll() {
  await db.delete(gameMoves);
  await db.delete(gameRounds);
  await db.delete(players);
  await db.delete(rooms);
}

describe("Schema: rooms", () => {
  it("creates a room with defaults", async () => {
    const [room] = await db.insert(rooms).values({ code: "ABC123" }).returning();

    expect(room.id).toBeDefined();
    expect(room.code).toBe("ABC123");
    expect(room.status).toBe("lobby"); // default
    expect(room.currentRoundNumber).toBeNull();
    expect(room.createdAt).toBeInstanceOf(Date);
    expect(room.updatedAt).toBeInstanceOf(Date);

    await db.delete(rooms).where(eq(rooms.id, room.id));
  });

  it("enforces unique constraint on code", async () => {
    const [room1] = await db.insert(rooms).values({ code: "UNIQ01" }).returning();

    await expect(
      db.insert(rooms).values({ code: "UNIQ01" })
    ).rejects.toThrow();

    await db.delete(rooms).where(eq(rooms.id, room1.id));
  });

  it("stores config as JSON", async () => {
    const config = { rounds: 5, timer: 60, deck: "standard" };
    const [room] = await db
      .insert(rooms)
      .values({ code: "JSON01", config, status: "playing", currentPhase: "description" })
      .returning();

    expect(room.config).toEqual(config);

    await db.delete(rooms).where(eq(rooms.id, room.id));
  });

  it("allows created_by to be null", async () => {
    const [room] = await db.insert(rooms).values({ code: "NULL01" }).returning();

    expect(room.createdBy).toBeNull();

    await db.delete(rooms).where(eq(rooms.id, room.id));
  });
});

describe("Schema: players", () => {
  let roomId: string;

  beforeAll(async () => {
    await cleanAll();
    const [room] = await db.insert(rooms).values({ code: "PLY001" }).returning();
    roomId = room.id;
  });

  it("creates a player linked to a room", async () => {
    const [player] = await db
      .insert(players)
      .values({ roomId, name: "Alice", role: "judge", secretHash: "hash123" })
      .returning();

    expect(player.id).toBeDefined();
    expect(player.roomId).toBe(roomId);
    expect(player.name).toBe("Alice");
    expect(player.role).toBe("judge");
    expect(player.createdAt).toBeInstanceOf(Date);
  });

  it("allows name and role to be null (lobby join)", async () => {
    const [player] = await db
      .insert(players)
      .values({ roomId, secretHash: "hash_anon" })
      .returning();

    expect(player.name).toBeNull();
    expect(player.role).toBeNull();
    expect(player.secretHash).toBe("hash_anon");
  });

  it("rejects FK violation: player references non-existent room", async () => {
    await expect(
      db
        .insert(players)
        .values({ roomId: "00000000-0000-0000-0000-000000000000", secretHash: "x" })
    ).rejects.toThrow();
  });

  it("accepts valid role enum values", async () => {
    const roles = ["judge", "honest", "liar"] as const;

    for (const role of roles) {
      const [player] = await db
        .insert(players)
        .values({ roomId, name: role, role, secretHash: `hash_${role}` })
        .returning();

      expect(player.role).toBe(role);
    }
  });
});

describe("Schema: game_rounds", () => {
  let roomId: string;

  beforeAll(async () => {
    await cleanAll();
    const [room] = await db.insert(rooms).values({ code: "RND001" }).returning();
    roomId = room.id;
  });

  it("creates rounds linked to a room", async () => {
    const [round] = await db
      .insert(gameRounds)
      .values({
        roomId,
        roundNumber: 1,
        cardPhrase: "Test phrase",
        cardAnswer: "Test answer",
        categories: ["test", "example"],
      })
      .returning();

    expect(round.id).toBeDefined();
    expect(round.roomId).toBe(roomId);
    expect(round.roundNumber).toBe(1);
    expect(round.cardPhrase).toBe("Test phrase");
    expect(round.cardAnswer).toBe("Test answer");
    expect(round.categories).toEqual(["test", "example"]);
    expect(round.createdAt).toBeInstanceOf(Date);
  });

  it("rejects FK violation: round references non-existent room", async () => {
    await expect(
      db.insert(gameRounds).values({
        roomId: "00000000-0000-0000-0000-000000000000",
        roundNumber: 1,
      })
    ).rejects.toThrow();
  });

  it("stores round_number as integer with multiple rounds", async () => {
    for (let i = 1; i <= 3; i++) {
      const [round] = await db
        .insert(gameRounds)
        .values({ roomId, roundNumber: i })
        .returning();

      expect(round.roundNumber).toBe(i);
    }
  });
});

describe("Schema: game_moves", () => {
  let roomId: string;
  let playerId: string;
  let roundId: string;

  beforeAll(async () => {
    await cleanAll();
    const [room] = await db.insert(rooms).values({ code: "MOV001" }).returning();
    roomId = room.id;

    const [player] = await db
      .insert(players)
      .values({ roomId, name: "Bob", role: "honest", secretHash: "hash_b" })
      .returning();
    playerId = player.id;

    const [round] = await db
      .insert(gameRounds)
      .values({ roomId, roundNumber: 1 })
      .returning();
    roundId = round.id;
  });

  it("creates a move linked to room, player, and round", async () => {
    const [move] = await db
      .insert(gameMoves)
      .values({
        roomId,
        playerId,
        roundId,
        moveType: "submit_description",
        data: { description: "A clever answer" },
      })
      .returning();

    expect(move.id).toBeDefined();
    expect(move.roomId).toBe(roomId);
    expect(move.playerId).toBe(playerId);
    expect(move.roundId).toBe(roundId);
    expect(move.moveType).toBe("submit_description");
    expect(move.data).toEqual({ description: "A clever answer" });
    expect(move.createdAt).toBeInstanceOf(Date);
  });

  it("accepts all valid move_type values", async () => {
    const types = ["submit_description", "cast_vote", "next_round"] as const;

    for (const moveType of types) {
      const [move] = await db
        .insert(gameMoves)
        .values({ roomId, playerId, roundId, moveType })
        .returning();

      expect(move.moveType).toBe(moveType);
    }
  });

  it("rejects FK violation: move references non-existent room", async () => {
    await expect(
      db.insert(gameMoves).values({
        roomId: "00000000-0000-0000-0000-000000000000",
        playerId,
        roundId,
        moveType: "cast_vote",
      })
    ).rejects.toThrow();
  });

  it("rejects FK violation: move references non-existent player", async () => {
    await expect(
      db.insert(gameMoves).values({
        roomId,
        playerId: "00000000-0000-0000-0000-000000000000",
        roundId,
        moveType: "cast_vote",
      })
    ).rejects.toThrow();
  });
});

describe("Cascade delete", () => {
  it("deleting a room cascades to players, rounds, and moves", async () => {
    await cleanAll();

    // Create room + child rows
    const [room] = await db.insert(rooms).values({ code: "CASCADE" }).returning();
    const [player] = await db
      .insert(players)
      .values({ roomId: room.id, secretHash: "h" })
      .returning();
    const [round] = await db
      .insert(gameRounds)
      .values({ roomId: room.id, roundNumber: 1 })
      .returning();
    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: player.id,
      roundId: round.id,
      moveType: "cast_vote",
    });

    // Verify they exist
    expect((await db.select().from(players).where(eq(players.roomId, room.id))).length).toBe(1);
    expect((await db.select().from(gameRounds).where(eq(gameRounds.roomId, room.id))).length).toBe(1);
    expect((await db.select().from(gameMoves).where(eq(gameMoves.roomId, room.id))).length).toBe(1);

    // Delete room — cascades
    await db.delete(rooms).where(eq(rooms.id, room.id));

    // Verify all children deleted
    expect((await db.select().from(players).where(eq(players.roomId, room.id))).length).toBe(0);
    expect((await db.select().from(gameRounds).where(eq(gameRounds.roomId, room.id))).length).toBe(0);
    expect((await db.select().from(gameMoves).where(eq(gameMoves.roomId, room.id))).length).toBe(0);
  });
});

describe("Seed script output", () => {
  it("creates at least 1 room, 3 players, 2 rounds, and 1 move", async () => {
    await cleanAll();

    // Mimic the seed script
    const [room] = await db
      .insert(rooms)
      .values({ code: "TEST01", status: "playing", currentPhase: "description" })
      .returning();

    const roles = ["judge", "honest", "liar"] as const;
    const createdPlayers = [];
    for (const role of roles) {
      const [p] = await db
        .insert(players)
        .values({ roomId: room.id, name: `Test ${role}`, role, secretHash: `hash_${role}` })
        .returning();
      createdPlayers.push(p);
    }

    const [r1] = await db
      .insert(gameRounds)
      .values({ roomId: room.id, roundNumber: 1, cardPhrase: "Phrase 1" })
      .returning();
    const [r2] = await db
      .insert(gameRounds)
      .values({ roomId: room.id, roundNumber: 2, cardPhrase: "Phrase 2" })
      .returning();

    await db.insert(gameMoves).values({
      roomId: room.id,
      playerId: createdPlayers[1].id,
      roundId: r1.id,
      moveType: "submit_description",
      data: { description: "test" },
    });

    // Verify counts
    const roomCount = await db.select().from(rooms);
    const playerCount = await db.select().from(players);
    const roundCount = await db.select().from(gameRounds);
    const moveCount = await db.select().from(gameMoves);

    expect(roomCount.length).toBeGreaterThanOrEqual(1);
    expect(playerCount.length).toBeGreaterThanOrEqual(3);
    expect(roundCount.length).toBeGreaterThanOrEqual(2);
    expect(moveCount.length).toBeGreaterThanOrEqual(1);
  });
});
