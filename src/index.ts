import { app } from "./app";
import { env } from "./config/env";
import { verifyConnection } from "./config/prisma";
import { startDormancyJob } from "./jobs/dormancy.job";

app.listen(env.port, async () => {
  await verifyConnection()
  startDormancyJob();
  console.log(`BANKA backend running on port ${env.port}`);
});
