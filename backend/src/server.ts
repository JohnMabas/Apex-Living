import { env } from "./config/env.js";
import { app } from "./app.js";

const server = app.listen(env.PORT, () => {
  console.info(`Nestora API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string): void {
  console.info(`${signal} received; shutting down gracefully.`);
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
