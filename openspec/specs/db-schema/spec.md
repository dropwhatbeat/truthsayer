# db-schema

## Purpose

Database layer for the Truthsayer multiplayer party game. Provides the schema definitions, migration tooling, seed data, and local PostgreSQL development environment that form the foundation for all subsequent backend phases (API routes, game engine, frontend wiring).

## Requirements

### Requirement: Drizzle ORM and Postgres setup
The project SHALL include Drizzle ORM as a dependency with `drizzle-kit` for development migrations and `pg` as the Postgres driver.

#### Scenario: Dependencies are installed
- **WHEN** `npm install` is run
- **THEN** `drizzle-orm`, `pg`, `drizzle-kit`, and `@types/pg` are available in `node_modules`

#### Scenario: Drizzle config file exists
- **WHEN** the project root is examined
- **THEN** `drizzle.config.ts` exists, pointing `schema` to `lib/db/schema.ts` and `out` to a migrations directory

#### Scenario: Empty schema compiles without errors
- **WHEN** `npx drizzle-kit generate` is run with an empty schema export
- **THEN** an empty migration is generated without errors

### Requirement: rooms table
The system SHALL have a `rooms` table that models a game session with its lifecycle state and configuration.

#### Scenario: rooms table contains all required columns
- **WHEN** the Drizzle schema is examined
- **THEN** the `rooms` table includes columns: `id` (uuid, primary key), `code` (text, unique, 6 characters), `status` (text with values `'lobby' | 'playing' | 'finished'`), `current_phase` (text), `deck_type` (text), `config` (json), `created_by` (uuid, nullable, references players), `created_at` (timestamp), `updated_at` (timestamp)

#### Scenario: rooms code is unique
- **WHEN** two rooms are inserted with the same `code`
- **THEN** the second insert fails with a unique constraint violation

#### Scenario: rooms status defaults to lobby
- **WHEN** a room row is created without specifying `status`
- **THEN** the `status` defaults to `'lobby'`

### Requirement: players table
The system SHALL have a `players` table that models a participant in a game session with their role and a secret token for reconnection.

#### Scenario: players table contains all required columns
- **WHEN** the Drizzle schema is examined
- **THEN** the `players` table includes columns: `id` (uuid, primary key), `room_id` (uuid, foreign key → rooms.id), `name` (text, nullable), `role` (text with values `'judge' | 'honest' | 'liar'`, nullable), `secret_hash` (text), `created_at` (timestamp)

#### Scenario: player is linked to a room via foreign key
- **WHEN** a player row references a non-existent `room_id`
- **THEN** the insert fails with a foreign key constraint violation

#### Scenario: player role and name can be null in lobby
- **WHEN** a player joins a room in `lobby` status without a name
- **THEN** the player row is created with `name` and `role` set to null

### Requirement: game_rounds table
The system SHALL have a `game_rounds` table that stores pre-generated rounds for each game, including the card phrase, answer, and category tags.

#### Scenario: game_rounds table contains all required columns
- **WHEN** the Drizzle schema is examined
- **THEN** the `game_rounds` table includes columns: `id` (uuid, primary key), `room_id` (uuid, foreign key → rooms.id), `round_number` (integer), `card_phrase` (text), `card_answer` (text), `categories` (jsonb), `created_at` (timestamp)

#### Scenario: game_rounds is linked to a room
- **WHEN** a game round row references a non-existent `room_id`
- **THEN** the insert fails with a foreign key constraint violation

#### Scenario: round_number reflects position in the game
- **WHEN** rounds are inserted for a game
- **THEN** `round_number` values are 1-indexed integers representing the order of play

### Requirement: game_moves table
The system SHALL have a `game_moves` table that records player actions during a round, with an extensible JSONB data column for move-specific payloads.

#### Scenario: game_moves table contains all required columns
- **WHEN** the Drizzle schema is examined
- **THEN** the `game_moves` table includes columns: `id` (uuid, primary key), `room_id` (uuid, foreign key → rooms.id), `player_id` (uuid, foreign key → players.id), `round_id` (uuid, foreign key → game_rounds.id), `move_type` (text with values `'submit_description' | 'cast_vote' | 'next_round'`), `data` (jsonb), `created_at` (timestamp)

#### Scenario: game_moves is linked to a room, player, and round
- **WHEN** a game move row references non-existent `room_id`, `player_id`, or `round_id`
- **THEN** the insert fails with a foreign key constraint violation

#### Scenario: move data is extensible via JSONB
- **WHEN** a move is recorded with arbitrary JSON payload in `data`
- **THEN** the data is stored and retrievable preserving its structure

### Requirement: Docker Compose local development environment
The project SHALL provide a `docker-compose.yml` file that starts a Postgres 16 instance for local development.

#### Scenario: Postgres starts with docker compose
- **WHEN** `docker compose up -d` is run
- **THEN** a Postgres 16 instance is available on the configured port with the specified database, user, and password

#### Scenario: Postgres stops with docker compose
- **WHEN** `docker compose down` is run
- **THEN** the Postgres container is stopped and removed

### Requirement: Migration runner script
The project SHALL include a migration runner script that applies all Drizzle migrations programmatically.

#### Scenario: Migrations create all four tables
- **WHEN** `npm run db:migrate` is executed against an empty Postgres database
- **THEN** the `rooms`, `players`, `game_rounds`, and `game_moves` tables exist with the correct columns, types, and foreign key constraints

#### Scenario: Migrations are idempotent
- **WHEN** `npm run db:migrate` is executed twice against the same database
- **THEN** the second execution completes without errors and no duplicate schema changes occur

### Requirement: Seed script for development
The project SHALL include a seed script that populates the database with sample data for rapid iteration.

#### Scenario: Seed script creates test data
- **WHEN** `npm run db:seed` is executed after migrations
- **THEN** at least one room with 3 players and 2 game rounds exists in the database, and querying those rows returns the expected seed data

#### Scenario: Seed script is repeatable
- **WHEN** `npm run db:seed` is executed multiple times
- **THEN** seed data is cleaned and re-inserted (no duplicate key errors)
