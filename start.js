#!/usr/bin/env node
import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { appendFileSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const logDir = resolve(__dirname, "data");
const logFile = resolve(logDir, "channel.log");

mkdirSync(logDir, { recursive: true });

function logLine(prefix, data) {
  const line = data.toString();
  process.stdout.write(`[${prefix}] ${line}`);
  if (prefix === "channel") {
    try {
      const ts = new Date().toISOString();
      for (const l of line.split("\n").filter(Boolean)) {
        appendFileSync(logFile, `${ts} ${l}\n`);
      }
    } catch { /* ignore */ }
  }
}

// Start Next.js brain (dev or production)
const nextCmd = isDev ? ["next", "dev"] : ["next", "start"];
const next = spawn("npx", nextCmd, {
  cwd: __dirname,
  stdio: ["inherit", "pipe", "pipe"],
  env: { ...process.env, PORT: process.env.PORT || "3000" },
});

next.stdout.on("data", (d) => logLine("brain", d));
next.stderr.on("data", (d) => logLine("brain", d));

// Start WhatsApp channel
const whatsapp = spawn("node", [resolve(__dirname, "node_modules/.bin/whatsapp")], {
  cwd: __dirname,
  stdio: ["inherit", "pipe", "pipe"],
});

whatsapp.stdout.on("data", (d) => logLine("channel", d));
whatsapp.stderr.on("data", (d) => logLine("channel", d));

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
  console.log(`[channel] exited with code ${code}. Brain still running.`);
  console.log(`[channel] Run 'npx whatsapp' separately to re-link, then restart.`);
});
