import { env } from "./config/env.js";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/prisma.js";
import { startScheduler, stopScheduler } from "./services/schedulerService.js";

const server = app.listen(env.PORT, () => {
  console.info(`Nestora API listening on port ${env.PORT} (${env.NODE_ENV})`);
  void connectDatabase().then((connected) => {
    if (connected) startScheduler();
  });
});

function shutdown(signal: string): void {
  console.info(`${signal} received; shutting down gracefully.`);
  stopScheduler();
  server.close(() => {
    void disconnectDatabase().finally(() => process.exit(0));
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
