import { NextResponse } from "next/server";
import { listMappings, upsertMapping, deleteMapping, listPersonas } from "@/lib/db.js";

export async function GET() {
  try {
    const mappings = listMappings();
    const personas = listPersonas();
    const personaMap = Object.fromEntries(personas.map((p) => [p.jid, p]));

    const chats = mappings.map((m) => ({
      chatId: m.chat_id,
      chatName: m.chat_name,
      personaId: m.persona_id,
      personaName: personaMap[m.persona_id]?.name || m.persona_id,
    }));

    return NextResponse.json({ chats, personas: personas.map((p) => ({ id: p.jid, name: p.name })) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { chatId, chatName, personaId } = await request.json();
    if (!chatId || !personaId) {
      return NextResponse.json({ error: "chatId and personaId required" }, { status: 400 });
    }
    upsertMapping(chatId.trim(), chatName?.trim() || chatId.trim(), personaId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { chatId } = await request.json();
    if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });
    const ok = deleteMapping(chatId);
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
