import fs from "node:fs";
import path from "node:path";
import pino from "pino";

const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = pino(
  {
    level: process.env.NODE_ENV === "production" ? "info" : "debug"
  },
  pino.multistream([
    { stream: process.stdout },
    { stream: fs.createWriteStream(path.join(logsDir, "app.log"), { flags: "a" }) }
  ])
);
