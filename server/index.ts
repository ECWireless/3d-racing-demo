import "dotenv/config";
import express from "express";
import { z } from "zod";
import { sql } from "./db";
import {
  createRoom,
  finishPlayerRoomRace,
  getRoomByCode,
  joinRoom,
  setRoomReady,
  startRoom,
  updatePlayerRaceState,
} from "./rooms";

const app = express();
const port = Number(process.env.API_PORT ?? 8787);

app.use(express.json());

const playerSchema = z.object({
  playerId: z.string().uuid(),
  username: z.string().trim().min(1).max(16),
});

const resultSchema = playerSchema.extend({
  totalTimeMs: z.number().int().positive().max(60 * 60 * 1000),
  totalLaps: z.number().int().positive().max(50).default(3),
});

const roomCodeSchema = z.string().trim().min(4).max(12);
const joinRoomSchema = playerSchema.extend({
  code: roomCodeSchema,
});
const readySchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().uuid(),
  isReady: z.boolean(),
});
const startSchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().uuid(),
});
const raceStateSchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().uuid(),
  positionX: z.number().finite(),
  positionY: z.number().finite(),
  positionZ: z.number().finite(),
  heading: z.number().finite(),
  pitch: z.number().finite(),
  speed: z.number().finite(),
  currentLap: z.number().int().positive().max(50),
});
const finishSchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().uuid(),
  totalTimeMs: z.number().int().positive().max(60 * 60 * 1000),
});

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/leaderboard", async (_request, response, next) => {
  try {
    const rows = await sql`
      select player_id, username, total_laps, total_time_ms, created_at
      from race_results
      where total_laps = 3
      order by total_time_ms asc, created_at asc
      limit 10
    `;
    response.json({ entries: rows });
  } catch (error) {
    next(error);
  }
});

app.post("/api/results", async (request, response, next) => {
  try {
    const result = resultSchema.parse(request.body);
    const leaderboardRows = await sql`
      select total_time_ms
      from race_results
      where total_laps = ${result.totalLaps}
      order by total_time_ms asc, created_at asc
      limit 10
    `;
    const qualifyingTime = leaderboardRows.length < 10
      || result.totalTimeMs < Number(leaderboardRows[leaderboardRows.length - 1].total_time_ms);

    if (!qualifyingTime) {
      response.status(200).json({ saved: false, reason: "not_top_10" });
      return;
    }

    await sql`
      insert into players (id, username)
      values (${result.playerId}, ${result.username})
      on conflict (id) do update
        set username = excluded.username,
            updated_at = now()
    `;

    const rows = await sql`
      insert into race_results (player_id, username, total_laps, total_time_ms)
      values (${result.playerId}, ${result.username}, ${result.totalLaps}, ${result.totalTimeMs})
      returning id, player_id, username, total_laps, total_time_ms, created_at
    `;

    await sql`
      delete from race_results
      where id in (
        select id
        from (
          select id,
            row_number() over (
              partition by total_laps
              order by total_time_ms asc, created_at asc
            ) as leaderboard_rank
          from race_results
          where total_laps = ${result.totalLaps}
        ) ranked_results
        where leaderboard_rank > 10
      )
    `;

    const rankRows = await sql`
      select leaderboard_rank
      from (
        select id,
          row_number() over (
            partition by total_laps
            order by total_time_ms asc, created_at asc
          ) as leaderboard_rank
        from race_results
        where total_laps = ${result.totalLaps}
      ) ranked_results
      where id = ${rows[0].id}
    `;

    response.status(201).json({
      saved: true,
      placement: Number(rankRows[0]?.leaderboard_rank ?? 0),
      result: rows[0],
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/rooms", async (request, response, next) => {
  try {
    const body = request.body as { action?: string };

    if (body.action === "create") {
      const player = playerSchema.parse(request.body);
      const room = await createRoom(sql, player.playerId, player.username);
      response.status(201).json({ room });
      return;
    }

    if (body.action === "join") {
      const joinRequest = joinRoomSchema.parse(request.body);
      const room = await joinRoom(sql, joinRequest.code, joinRequest.playerId, joinRequest.username);

      if (!room) {
        response.status(404).json({ error: "Room not found" });
        return;
      }

      response.json({ room });
      return;
    }

    if (body.action === "ready") {
      const readyRequest = readySchema.parse(request.body);
      const room = await setRoomReady(
        sql,
        readyRequest.code,
        readyRequest.playerId,
        readyRequest.isReady,
      );

      if (!room) {
        response.status(404).json({ error: "Room not found" });
        return;
      }

      response.json({ room });
      return;
    }

    if (body.action === "start") {
      const startRequest = startSchema.parse(request.body);
      const room = await startRoom(sql, startRequest.code, startRequest.playerId);

      if (!room) {
        response.status(404).json({ error: "Room not found" });
        return;
      }

      response.json({ room });
      return;
    }

    if (body.action === "state") {
      const stateRequest = raceStateSchema.parse(request.body);
      const room = await updatePlayerRaceState(
        sql,
        stateRequest.code,
        stateRequest.playerId,
        stateRequest,
      );

      if (!room) {
        response.status(404).json({ error: "Room not found" });
        return;
      }

      response.json({ room });
      return;
    }

    if (body.action === "finish") {
      const finishRequest = finishSchema.parse(request.body);
      const room = await finishPlayerRoomRace(sql, finishRequest.code, finishRequest.playerId, {
        totalTimeMs: finishRequest.totalTimeMs,
      });

      if (!room) {
        response.status(404).json({ error: "Room not found" });
        return;
      }

      response.json({ room });
      return;
    }

    response.status(400).json({ error: "Unknown room action" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/rooms", async (request, response, next) => {
  try {
    const code = roomCodeSchema.parse(request.query.code);
    const room = await getRoomByCode(sql, code);

    if (!room) {
      response.status(404).json({ error: "Room not found" });
      return;
    }

    response.json({ room });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: "Invalid request", details: error.issues });
    return;
  }

  console.error(error);
  response.status(500).json({ error: "Server error" });
});

app.listen(port, () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});
