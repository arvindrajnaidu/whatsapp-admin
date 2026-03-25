import { NextResponse } from "next/server";
import { listPersonas, upsertPersona } from "@/lib/db.js";

export async function GET() {
  try {
    const rows = listPersonas();
    const personas = rows.map((r) => ({
      jid: r.jid,
      groupName: r.name,
      type: r.jid.startsWith("-") || r.jid.includes("@g.us") ? "group" : "dm",
      personaSummary: r.content.length > 100 ? r.content.slice(0, 100) + "..." : r.content,
      content: r.content,
    }));
    return NextResponse.json({ personas });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { jid, name, content } = await request.json();
    if (!jid || !content) {
      return NextResponse.json({ error: "jid and content required" }, { status: 400 });
    }
    upsertPersona(jid, name || jid, content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
