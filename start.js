#!/usr/bin/env node
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Start Next.js brain
const next = spawn("npx", ["next", "start"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT || "3000" },
});

// Start WhatsApp channel
const whatsapp = spawn("node", [resolve(__dirname, "node_modules/.bin/whatsapp")], {
  cwd: __dirname,
  stdio: "inherit",
});

function shutdown() {
  next.kill();
  whatsapp.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

next.on("exit", (code) => {
  console.log(`[brain] exited with code ${code}`);
  whatsapp.kill();
  process.exit(code || 0);
});

whatsapp.on("exit", (code) => {
  console.log(`[channel] exited with code ${code}`);
  next.kill();
  process.exit(code || 0);
});
