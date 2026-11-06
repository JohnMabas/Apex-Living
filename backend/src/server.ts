import { env } from "./config/env.js";
import { app } from "./app.js";
import { startScheduler, stopScheduler } from "./services/schedulerService.js";

// app.ts calls startScheduler() as part of app setup.
// Calling it here is safe — the scheduler guards against double-start.
startScheduler();

const server = app.listen(env.PORT, () => {
  console.info(`Nestora API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.info(`${signal} received; shutting down gracefully.`);
  stopScheduler();
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
