import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { verifyConnection } from "./config/prisma";
import { connectRedis } from "./config/redis";
import { startDormancyJob } from "./jobs/dormancy.job";

async function bootstrap() {
  await verifyConnection();
  await connectRedis();
  startDormancyJob();

  app.listen(env.port, () => {
    logger.info(`BANKA backend running on port ${env.port}`);
  });
}

void bootstrap().catch((error) => {
  logger.error({ error }, "Failed to start backend");
  process.exit(1);
});
