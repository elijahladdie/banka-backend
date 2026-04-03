import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export function requestContext(req: Request, _res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  next();
}
