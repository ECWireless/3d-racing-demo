import { sql } from "./db";

await sql`
  create table if not exists players (
    id uuid primary key,
    username text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )
`;

await sql`
  create table if not exists race_results (
    id uuid primary key default gen_random_uuid(),
    player_id uuid not null references players(id),
    username text not null,
    total_laps integer not null default 3,
    total_time_ms integer not null,
    source text not null default 'solo',
    created_at timestamptz not null default now()
  )
`;

await sql`
  create index if not exists race_results_fastest_idx
    on race_results (total_laps, total_time_ms asc, created_at asc)
`;

await sql`
  create table if not exists race_rooms (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    host_player_id uuid references players(id),
    status text not null default 'waiting',
    created_at timestamptz not null default now(),
    started_at timestamptz,
    finished_at timestamptz
  )
`;

await sql`
  create table if not exists race_room_players (
    room_id uuid not null references race_rooms(id) on delete cascade,
    player_id uuid not null references players(id),
    username text not null,
    slot integer not null default 1,
    is_ready boolean not null default false,
    joined_at timestamptz not null default now(),
    primary key (room_id, player_id)
  )
`;

await sql`
  alter table race_room_players
    add column if not exists slot integer not null default 1
`;

await sql`
  alter table race_room_players
    add column if not exists is_ready boolean not null default false
`;

await sql`
  alter table race_room_players
    add column if not exists position_x double precision,
    add column if not exists position_y double precision,
    add column if not exists position_z double precision,
    add column if not exists heading double precision,
    add column if not exists pitch double precision,
    add column if not exists speed double precision,
    add column if not exists current_lap integer not null default 1,
    add column if not exists state_updated_at timestamptz
`;

await sql`
  create table if not exists race_room_results (
    room_id uuid not null references race_rooms(id) on delete cascade,
    player_id uuid not null references players(id),
    total_time_ms integer not null,
    finished_at timestamptz not null default now(),
    primary key (room_id, player_id)
  )
`;

console.log("Database schema is ready.");
