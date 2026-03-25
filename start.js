#!/usr/bin/env node
import { startBot, runSetup, authExists, getAuthDir, readConfig } from "@buzzie-ai/whatsapp-channel";

const config = readConfig();
const authDir = getAuthDir();

if (!config.setupComplete || !authExists(authDir)) {
  await runSetup();
}

await startBot();
