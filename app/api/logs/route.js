import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_FILE = join(__dirname, "..", "..", "..", "data", "channel.log");

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lines = parseInt(searchParams.get("lines") || "100");

  if (!existsSync(LOG_FILE)) {
    return NextResponse.json({ logs: [], total: 0 });
  }

  try {
    const content = readFileSync(LOG_FILE, "utf8");
    const allLines = content.trim().split("\n").filter(Boolean);
    const tail = allLines.slice(-lines);

    return NextResponse.json({ logs: tail, total: allLines.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
