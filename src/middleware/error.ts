import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { error } from "../utils/response";
import { t } from "../i18n";

export function notFound(req: Request, res: Response) {
  console.warn(`[404] Not found: ${req.method} ${req.originalUrl}`);
  return error(res, 404, t(req, "common.resourceNotFound"));
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return error(
      res,
      400,
      t(req, "common.validationFailed"),
      err.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message
      }))
    );
  }

  const message = err instanceof Error
    ? (/^(common|auth|users|accounts|transactions|stats|notifications)\./.test(err.message)
      ? t(req, err.message)
      : err.message)
    : t(req, "common.internalServerError");
  return error(res, 500, message);
}
