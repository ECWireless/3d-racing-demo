import type { Request, Response } from "./_shared.js";
import { getSql, handleApiError, playerSchema, sendJson } from "./_shared.js";
import {
  createRoom,
  finishPlayerRoomRace,
  getRoomByCode,
  joinRoom,
  setRoomReady,
  startRoom,
  updatePlayerRaceState,
} from "../server/rooms.js";
import { z } from "zod";

const codeSchema = z.string().trim().min(4).max(12);
const joinRoomSchema = playerSchema.extend({
  code: codeSchema,
});
const readySchema = z.object({
  code: codeSchema,
  playerId: z.string().uuid(),
  isReady: z.boolean(),
});
const startSchema = z.object({
  code: codeSchema,
  playerId: z.string().uuid(),
});
const raceStateSchema = z.object({
  code: codeSchema,
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
  code: codeSchema,
  playerId: z.string().uuid(),
  totalTimeMs: z.number().int().positive().max(60 * 60 * 1000),
});

export default async function handler(request: Request, response: Response) {
  if (request.method === "GET") {
    try {
      const sql = getSql();
      const url = new URL(request.url ?? "", "http://localhost");
      const code = codeSchema.parse(url.searchParams.get("code"));
      const room = await getRoomByCode(sql, code);

      if (!room) {
        sendJson(response, 404, { error: "Room not found" });
        return;
      }

      sendJson(response, 200, { room });
    } catch (error) {
      handleApiError(error, response);
    }
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const sql = getSql();
    const body = request.body as { action?: string };

    if (body.action === "create") {
      const player = playerSchema.parse(request.body);
      const room = await createRoom(sql, player.playerId, player.username);
      sendJson(response, 201, { room });
      return;
    }

    if (body.action === "join") {
      const joinRequest = joinRoomSchema.parse(request.body);
      const room = await joinRoom(sql, joinRequest.code, joinRequest.playerId, joinRequest.username);

      if (!room) {
        sendJson(response, 404, { error: "Room not found" });
        return;
      }

      sendJson(response, 200, { room });
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
        sendJson(response, 404, { error: "Room not found" });
        return;
      }

      sendJson(response, 200, { room });
      return;
    }

    if (body.action === "start") {
      const startRequest = startSchema.parse(request.body);
      const room = await startRoom(sql, startRequest.code, startRequest.playerId);

      if (!room) {
        sendJson(response, 404, { error: "Room not found" });
        return;
      }

      sendJson(response, 200, { room });
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
        sendJson(response, 404, { error: "Room not found" });
        return;
      }

      sendJson(response, 200, { room });
      return;
    }

    if (body.action === "finish") {
      const finishRequest = finishSchema.parse(request.body);
      const room = await finishPlayerRoomRace(sql, finishRequest.code, finishRequest.playerId, {
        totalTimeMs: finishRequest.totalTimeMs,
      });

      if (!room) {
        sendJson(response, 404, { error: "Room not found" });
        return;
      }

      sendJson(response, 200, { room });
      return;
    }

    sendJson(response, 400, { error: "Unknown room action" });
  } catch (error) {
    handleApiError(error, response);
  }
}
