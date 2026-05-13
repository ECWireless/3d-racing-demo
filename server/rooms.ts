import type { NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

type RoomPlayer = {
  player_id: string;
  username: string;
  slot: number;
  is_ready: boolean;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  heading: number | null;
  pitch: number | null;
  speed: number | null;
  current_lap: number;
  state_updated_at: string | null;
  joined_at: string;
};

type RoomResult = {
  player_id: string;
  username: string;
  slot: number;
  total_time_ms: number;
  finished_at: string;
};

export type RoomSnapshot = {
  id: string;
  code: string;
  status: string;
  host_player_id: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  players: RoomPlayer[];
  results: RoomResult[];
};

export function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

type PlayerRaceState = {
  positionX: number;
  positionY: number;
  positionZ: number;
  heading: number;
  pitch: number;
  speed: number;
  currentLap: number;
};

type RoomFinish = {
  totalTimeMs: number;
};

export async function upsertPlayer(sql: Sql, playerId: string, username: string) {
  await sql`
    insert into players (id, username)
    values (${playerId}, ${username})
    on conflict (id) do update
      set username = excluded.username,
          updated_at = now()
  `;
}

export async function getRoomByCode(sql: Sql, code: string) {
  const rooms = await sql`
    select id, code, status, host_player_id, created_at, started_at, finished_at
    from race_rooms
    where code = ${code.toUpperCase()}
    limit 1
  `;

  if (!rooms[0]) {
    return null;
  }

  const players = await sql`
    select
      player_id,
      username,
      slot,
      is_ready,
      position_x,
      position_y,
      position_z,
      heading,
      pitch,
      speed,
      current_lap,
      state_updated_at,
      joined_at
    from race_room_players
    where room_id = ${rooms[0].id}
    order by slot asc, joined_at asc
  `;

  const results = await sql`
    select
      race_room_results.player_id,
      race_room_players.username,
      race_room_players.slot,
      race_room_results.total_time_ms,
      race_room_results.finished_at
    from race_room_results
    join race_room_players
      on race_room_players.room_id = race_room_results.room_id
      and race_room_players.player_id = race_room_results.player_id
    where race_room_results.room_id = ${rooms[0].id}
    order by race_room_results.total_time_ms asc, race_room_results.finished_at asc
  `;

  return {
    ...rooms[0],
    players,
    results,
  } as RoomSnapshot;
}

export async function createRoom(sql: Sql, playerId: string, username: string) {
  await upsertPlayer(sql, playerId, username);

  const rooms = await sql`
    insert into race_rooms (code, host_player_id)
    values (${createRoomCode()}, ${playerId})
    returning id, code, status, host_player_id, created_at, started_at, finished_at
  `;

  await sql`
    insert into race_room_players (room_id, player_id, username, slot, is_ready)
    values (${rooms[0].id}, ${playerId}, ${username}, 1, false)
  `;

  return getRoomByCode(sql, rooms[0].code);
}

export async function joinRoom(sql: Sql, code: string, playerId: string, username: string) {
  await upsertPlayer(sql, playerId, username);

  const room = await getRoomByCode(sql, code);

  if (!room) {
    return null;
  }

  if (room.status !== "waiting") {
    throw new Error("Room already started");
  }

  const existingPlayer = room.players.find((player) => player.player_id === playerId);

  if (existingPlayer) {
    return room;
  }

  if (room.players.length >= 2) {
    throw new Error("Room is full");
  }

  const usedSlots = new Set(room.players.map((player) => player.slot));
  const slot = usedSlots.has(1) ? 2 : 1;

  await sql`
    insert into race_room_players (room_id, player_id, username, slot, is_ready)
    values (${room.id}, ${playerId}, ${username}, ${slot}, false)
  `;

  return getRoomByCode(sql, code);
}

export async function setRoomReady(sql: Sql, code: string, playerId: string, isReady: boolean) {
  const room = await getRoomByCode(sql, code);

  if (!room) {
    return null;
  }

  await sql`
    update race_room_players
    set is_ready = ${isReady}
    where room_id = ${room.id}
      and player_id = ${playerId}
  `;

  return getRoomByCode(sql, code);
}

export async function startRoom(sql: Sql, code: string, playerId: string) {
  const room = await getRoomByCode(sql, code);

  if (!room) {
    return null;
  }

  if (room.host_player_id !== playerId) {
    throw new Error("Only the host can start the room");
  }

  if (room.players.length < 2 || room.players.some((player) => !player.is_ready)) {
    throw new Error("Both players must be ready");
  }

  await sql`
    delete from race_room_results
    where room_id = ${room.id}
  `;

  await sql`
    update race_room_players
    set position_x = null,
        position_y = null,
        position_z = null,
        heading = null,
        pitch = null,
        speed = null,
        current_lap = 1,
        state_updated_at = null
    where room_id = ${room.id}
  `;

  await sql`
    update race_rooms
    set status = 'racing',
        started_at = now() + interval '3 seconds',
        finished_at = null
    where id = ${room.id}
  `;

  return getRoomByCode(sql, code);
}

export async function updatePlayerRaceState(
  sql: Sql,
  code: string,
  playerId: string,
  state: PlayerRaceState,
) {
  const room = await getRoomByCode(sql, code);

  if (!room) {
    return null;
  }

  await sql`
    update race_room_players
    set position_x = ${state.positionX},
        position_y = ${state.positionY},
        position_z = ${state.positionZ},
        heading = ${state.heading},
        pitch = ${state.pitch},
        speed = ${state.speed},
        current_lap = ${state.currentLap},
        state_updated_at = now()
    where room_id = ${room.id}
      and player_id = ${playerId}
  `;

  return getRoomByCode(sql, code);
}

export async function finishPlayerRoomRace(
  sql: Sql,
  code: string,
  playerId: string,
  finish: RoomFinish,
) {
  const room = await getRoomByCode(sql, code);

  if (!room) {
    return null;
  }

  if (room.status !== "racing" && room.status !== "finished") {
    throw new Error("Room race has not started");
  }

  await sql`
    insert into race_room_results (room_id, player_id, total_time_ms)
    values (${room.id}, ${playerId}, ${finish.totalTimeMs})
    on conflict (room_id, player_id) do update
      set total_time_ms = excluded.total_time_ms,
          finished_at = now()
  `;

  const finishCount = await sql`
    select count(*)::int as count
    from race_room_results
    where room_id = ${room.id}
  `;

  if (Number(finishCount[0]?.count ?? 0) >= room.players.length) {
    await sql`
      update race_rooms
      set status = 'finished',
          finished_at = now()
      where id = ${room.id}
    `;
  }

  return getRoomByCode(sql, code);
}
