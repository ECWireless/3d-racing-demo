import type { Request, Response } from "./_shared";
import { sendJson } from "./_shared";

export default function handler(_request: Request, response: Response) {
  sendJson(response, 200, { ok: true });
}
