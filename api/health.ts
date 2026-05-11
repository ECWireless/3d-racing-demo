import type { Request, Response } from "./_shared.js";

export default function handler(_request: Request, response: Response) {
  response.status(200).json({ ok: true });
}
