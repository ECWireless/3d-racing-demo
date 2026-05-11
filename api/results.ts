import type { Request, Response } from "./_shared.js";
import { getSql, handleApiError, resultSchema, sendJson } from "./_shared.js";

export default async function handler(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const sql = getSql();
    const result = resultSchema.parse(request.body);
    const leaderboardRows = await sql`
      select total_time_ms
      from race_results
      where total_laps = ${result.totalLaps}
      order by total_time_ms asc, created_at asc
      limit 10
    `;
    const qualifyingTime =
      leaderboardRows.length < 10 ||
      result.totalTimeMs < Number(leaderboardRows[leaderboardRows.length - 1].total_time_ms);

    if (!qualifyingTime) {
      sendJson(response, 200, { saved: false, reason: "not_top_10" });
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

    sendJson(response, 201, {
      saved: true,
      placement: Number(rankRows[0]?.leaderboard_rank ?? 0),
      result: rows[0],
    });
  } catch (error) {
    handleApiError(error, response);
  }
}
