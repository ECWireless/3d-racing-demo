import { neon } from "@neondatabase/serverless";
import { z } from "zod";

let sqlClient: ReturnType<typeof neon> | null = null;

export function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  sqlClient ??= neon(databaseUrl);
  return sqlClient;
}

export const playerSchema = z.object({
  playerId: z.string().uuid(),
  username: z.string().trim().min(1).max(16),
});

export const resultSchema = playerSchema.extend({
  totalTimeMs: z.number().int().positive().max(60 * 60 * 1000),
  totalLaps: z.number().int().positive().max(50).default(3),
});

export function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function sendJson(response: Response, status: number, body: unknown) {
  response.status(status).json(body);
}

export function handleApiError(error: unknown, response: Response) {
  if (error instanceof z.ZodError) {
    sendJson(response, 400, { error: "Invalid request", details: error.issues });
    return;
  }

  console.error(error);
  sendJson(response, 500, { error: "Server error" });
}

export type Request = {
  method?: string;
  body?: unknown;
  url?: string;
};

export type Response = {
  status(statusCode: number): Response;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
};
