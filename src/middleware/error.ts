import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { error } from "../utils/response";

export function notFound(_req: Request, res: Response) {
  return error(res, 404, "Resource not found");
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return error(
      res,
      400,
      "Validation failed",
      err.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message
      }))
    );
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  return error(res, 500, message);
}
