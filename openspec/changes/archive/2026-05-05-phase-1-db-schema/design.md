## Context

The app is currently a single-device Next.js 15 party game with no backend, database, or API. All state resides in React `useState`. The migration plan (see `docs/migration-plan.md`) lays out a phased approach to add multiplayer. Phase 1 is the database layer — the foundation that every subsequent phase depends on.

This design covers the schema for four tables (`rooms`, `players`, `game_rounds`, `game_moves`) that model session-based multiplayer with rooms, roles, and shared game state. It also covers the local development environment (Docker Compose + Postgres) and migration tooling.

## Goals / Non-Goals

**Goals:**
- Define a Drizzle ORM schema that models all entities needed for multiplayer 9upper play
- Provide a local Postgres environment via Docker Compose for development
- Generate and run typed migrations with `drizzle-kit`
- Include a seed script for rapid development iteration
- Follow the migration plan's schema exactly (tables, columns, types, FKs)

**Non-Goals:**
- No API routes, game engine, or frontend changes (these come in later phases)
- No auth, user accounts, or session management (out of scope for Phase 1)
- No production deployment of the database (just local dev setup)
- No multiple database support (Postgres only, which is required for future Electric SQL upgrade)

## Decisions

### Drizzle ORM over Prisma or raw SQL
**Choice**: Drizzle ORM with `node-postgres`.

**Rationale**: Drizzle provides type-safe queries without the code generation step that Prisma requires. The migration plan explicitly specifies Drizzle, and it pairs naturally with the future Electric SQL upgrade path. Raw SQL was rejected because typed queries reduce bugs and Drizzle's migration tooling is a first-class feature.

**Alternatives considered**: Prisma (heavier, requires codegen, schema-in-a-DSL), Kysely (good but less integrated migration tooling), raw `pg` queries (too error-prone for a schema of this complexity).

### Postgres over SQLite
**Choice**: PostgreSQL 16 (via Docker Compose for local dev, Neon/Railway for production later).

**Rationale**: The migration plan designates Postgres as the target. Postgres is required for the future Electric SQL sync upgrade. JSONB support (`config`, `categories`, `data` columns) is a bonus but not the deciding factor.

**Alternatives considered**: SQLite (simpler local dev, but incompatible with Electric and multi-region deploy), MySQL (less common in the Vercel/Neon ecosystem).

### `current_phase` as explicit column, not derived
**Choice**: Store `current_phase` directly on the `rooms` table.

**Rationale**: This is already decided in the migration plan's Decision Log. Debuggability and direct queryability are prioritized over normalization purity. When a player reports being on the wrong screen, developers can query `SELECT current_phase FROM rooms WHERE code = 'ABC123'` without reconstructing state from move history.

**Alternative considered**: Derive phase from `game_moves` at query time. Rejected because it complicates debugging and adds latency to the poll-heavy Phase 4 architecture.

### Card shuffle stored server-side in `game_rounds`
**Choice**: Shuffle cards on the server during game start and persist the ordered results as `game_rounds` rows.

**Rationale**: All clients must see identical cards in the identical order. Storing pre-generated rounds is auditable (players can verify fairness) and avoids client-side randomness bugs. The migration plan mandates this approach.

### `playerSecret` for reconnection auth
**Choice**: Generate a random token (`crypto.randomUUID()`), hash it with bcrypt, store the hash in `players.secret_hash`, and return the plaintext token to the client for localStorage.

**Rationale**: No auth system needed. The token acts as a simple credential to re-associate a browser with a player row. bcrypt hashing prevents DB-level secret exposure.

### JSONB for extensible columns
**Choice**: `rooms.config` (JSON), `game_rounds.categories` (JSONB), `game_moves.data` (JSONB).

**Rationale**: These columns hold variable-shaped data. `config` captures game settings (round count, timer, deck). `categories` holds array of category strings. `moves.data` is the most important — it allows new move types to carry custom payloads without schema changes. This future-proofs the schema for additional game types without migrations.

## Risks / Trade-offs

- **Risk: Schema drift between migration plan and implementation.** The migration plan is a detailed spec, but minor adjustments may arise during implementation (e.g., column naming, index choices). → **Mitigation**: The migration plan is the source of truth. Any deviation must be noted in the decision log.
- **Risk: Docker Compose adds setup burden for developers who don't have Docker.** → **Mitigation**: Provide a clear `.env.example` and document that `DATABASE_URL` can also point to a remote Postgres instance (Neon free tier) for those without Docker.
- **Risk: JSONB columns lack type safety at the database level.** → **Mitigation**: Drizzle provides typed JSON parsing. Application-level validation in the game engine (Phase 3) ensures well-formed data.

## Open Questions

<!-- None at this stage — the migration plan specifies the schema in detail. -->
