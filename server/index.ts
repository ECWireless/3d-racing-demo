import "dotenv/config";
import express from "express";
import { z } from "zod";
import { sql } from "./db";

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

function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

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
    const player = playerSchema.parse(request.body);
    const code = createRoomCode();

    await sql`
      insert into players (id, username)
      values (${player.playerId}, ${player.username})
      on conflict (id) do update
        set username = excluded.username,
            updated_at = now()
    `;

    const rooms = await sql`
      insert into race_rooms (code, host_player_id)
      values (${code}, ${player.playerId})
      returning id, code, status, created_at
    `;

    await sql`
      insert into race_room_players (room_id, player_id, username)
      values (${rooms[0].id}, ${player.playerId}, ${player.username})
    `;

    response.status(201).json({ room: rooms[0] });
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
