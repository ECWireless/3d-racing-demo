import type { Request, Response } from "./_shared";
import { handleApiError, sendJson, sql } from "./_shared";

export default async function handler(request: Request, response: Response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
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
