import type { Request, Response } from "./_shared.js";
import { createRoomCode, getSql, handleApiError, playerSchema, sendJson } from "./_shared.js";

export default async function handler(request: Request, response: Response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const sql = getSql();
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

    sendJson(response, 201, { room: rooms[0] });
  } catch (error) {
    handleApiError(error, response);
  }
}
