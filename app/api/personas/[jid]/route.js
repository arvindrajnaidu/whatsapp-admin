import { NextResponse } from "next/server";
import { getPersona, upsertPersona, deletePersona } from "@/lib/db.js";

export async function GET(request, { params }) {
  try {
    const { jid } = await params;
    const persona = getPersona(jid);
    if (!persona) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      jid: persona.jid,
      groupName: persona.name,
      content: persona.content,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { jid } = await params;
    const body = await request.json();
    upsertPersona(jid, body.groupName || body.name || jid, body.content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { jid } = await params;
    const ok = deletePersona(jid);
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
