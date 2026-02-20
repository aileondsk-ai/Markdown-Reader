import { app, initApp } from "../server/index.js";
import type { Request, Response } from "express";

let initialized = false;

export default async function handler(req: Request, res: Response) {
  if (!initialized) {
    await initApp();
    initialized = true;
  }
  return app(req, res);
}
