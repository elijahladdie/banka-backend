import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import pinoHttpImport from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { requestContext } from "./middleware/requestContext";
import { errorHandler, notFound } from "./middleware/error";
import routes from "./routes/index";

const pinoHttp = pinoHttpImport as unknown as (opts: {
  logger: typeof logger;
  customProps: (req: Request) => Record<string, unknown>;
  customLogLevel: (_req: Request, res: Response, error?: Error) => "info" | "warn" | "error";
}) => express.RequestHandler;

export const app = express();

app.use(requestContext);
app.use(
  pinoHttp({
    logger,
    customProps: (req: Request) => ({ requestId: req.requestId, userId: req.user?.id }),
    customLogLevel: (_req: Request, res: Response, error?: Error) => {
      if (error || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    }
  })
);
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(notFound);
app.use(errorHandler);
