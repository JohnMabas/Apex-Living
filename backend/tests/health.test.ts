import assert from "node:assert/strict";
import { app } from "../src/app.js";

async function run(): Promise<void> {
  const server = app.listen(0);
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);
    const body: unknown = await response.json();
    assert.equal(response.status, 200);
    assert.equal((body as { status: string }).status, "ok");
    console.info("Health endpoint test passed.");
  } finally {
    server.close();
  }
}

void run();
