import { app, initApp } from "../server/app";
import type { IncomingMessage, ServerResponse } from "http";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await initApp();
  return app(req as any, res as any);
}
