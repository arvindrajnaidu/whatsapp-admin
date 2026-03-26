#!/usr/bin/env node
import { spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";

// ── Start Next.js brain ──
const nextCmd = isDev ? ["next", "dev"] : ["next", "start"];
const next = spawn("npx", nextCmd, {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env, PORT: process.env.PORT || "3000" },
});

next.on("exit", (code) => {
  console.log(`[brain] exited with code ${code}`);
  process.exit(code || 0);
});

// ── Start WhatsApp channel ──
async function startWhatsApp() {
  try {
    const wa = await import("@buzzie-ai/whatsapp-channel");
    const config = wa.readConfig();
    const authDir = wa.getAuthDir();

    if (!config.setupComplete || !wa.authExists(authDir)) {
      console.log("[whatsapp] Not set up — run 'npx whatsapp' to link. Skipping.");
      return;
    }

    console.log("[whatsapp] Starting channel...");
    await wa.startBot();
  } catch (err) {
    console.log(`[whatsapp] Failed to start: ${err.message}`);
  }
}

// ── Start Voice channel ──
async function startVoice() {
  try {
    const voice = await import("@buzzie-ai/voice-channel");
    const config = voice.readConfig();

    if (!config.setupComplete) {
      console.log("[voice] Not set up — run 'npx voice-bot' to configure. Skipping.");
      return;
    }

    console.log("[voice] Starting channel...");
    await voice.startBot();
  } catch (err) {
    console.log(`[voice] Failed to start: ${err.message}`);
  }
}

// Start channels (don't block each other)
startWhatsApp();
startVoice();

process.on("SIGINT", () => {
  next.kill();
  process.exit(0);
});
