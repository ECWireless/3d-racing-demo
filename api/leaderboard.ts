import type { Request, Response } from "./_shared.js";
import { getSql, handleApiError, sendJson } from "./_shared.js";

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const sql = getSql();
    const rows = await sql`
      select player_id, username, total_laps, total_time_ms, created_at
      from race_results
      where total_laps = 3
      order by total_time_ms asc, created_at asc
      limit 10
    `;
    sendJson(response, 200, { entries: rows });
  } catch (error) {
    handleApiError(error, response);
  }
}
