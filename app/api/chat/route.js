import { NextResponse } from "next/server";
import { processMessage, processGroupMessage } from "@/lib/brain/conversation.js";
import { WhatsAppClient } from "@/lib/whatsapp-client.js";
import { getWhatsAppHost, getWhatsAppToken } from "@/lib/config.js";
import { getPersonaForChat, upsertKnownChat } from "@/lib/db.js";

/**
 * POST /api/chat
 *
 * Receives an envelope from core's dispatcher:
 * { type, jid, groupName, senderName, text, history, quotedContext, meta }
 *
 * Returns: { text?, actions? }
 */
export async function POST(request) {
  try {
    const envelope = await request.json();
    const { type, jid, groupName, senderName, text, quotedContext, meta } = envelope;

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Track this chat so it appears in the mappings UI
    const chatType = type === "self_chat" ? "self" : (jid?.includes("@g.us") ? "group" : "dm");
    upsertKnownChat(jid, groupName || senderName || jid, chatType);

    const client = new WhatsAppClient(getWhatsAppHost(), getWhatsAppToken());
    const selfJid = meta?.selfJid || jid;

    // Look up persona via chat mapping
    const personaRow = getPersonaForChat(jid);
    const persona = personaRow?.content || null;

    // No persona mapped to this chat — don't respond, don't call AI
    if (!persona && type !== "self_chat") {
      return NextResponse.json({});
    }

    let reply;

    if (type === "self_chat") {
      reply = await processMessage(text, client, selfJid);
    } else {
      reply = await processGroupMessage(
        text,
        jid,
        groupName || jid,
        persona,
        senderName || "Unknown",
        client,
        selfJid,
        quotedContext || null,
      );
    }

    return NextResponse.json({ text: reply });
  } catch (err) {
    console.error("[/api/chat] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
