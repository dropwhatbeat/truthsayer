import {
  pgTable,
  uuid,
  text,
  json,
  jsonb,
  integer,
  timestamp,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

// ── rooms ────────────────────────────────────────────────────────────────────
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    status: text("status").notNull().default("lobby"),
    currentPhase: text("current_phase"),
    deckType: text("deck_type"),
    config: json("config"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("rooms_code_idx").on(table.code)]
);

// ── players ──────────────────────────────────────────────────────────────────
export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  name: text("name"),
  role: text("role", { enum: ["judge", "honest", "liar"] }),
  secretHash: text("secret_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── game_rounds ──────────────────────────────────────────────────────────────
export const gameRounds = pgTable("game_rounds", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  cardPhrase: text("card_phrase"),
  cardAnswer: text("card_answer"),
  categories: jsonb("categories"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ── game_moves ───────────────────────────────────────────────────────────────
export const gameMoves = pgTable("game_moves", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  roundId: uuid("round_id")
    .notNull()
    .references(() => gameRounds.id, { onDelete: "cascade" }),
  moveType: text("move_type", {
    enum: ["submit_description", "cast_vote", "next_round"],
  }).notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
