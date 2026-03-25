import Database from "better-sqlite3";
import { join } from "path";
import { getDataDir } from "./config.js";

let db = null;
let stmts = null;

function getDb() {
  if (db) return { db, stmts };

  const dbPath = join(getDataDir(), "assistant.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      jid         TEXT    NOT NULL,
      role        TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      sender_name TEXT,
      timestamp   INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conv_jid_ts ON conversations (jid, timestamp);

    CREATE TABLE IF NOT EXISTS personas (
      jid         TEXT PRIMARY KEY,
      name        TEXT,
      content     TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_mappings (
      chat_id     TEXT PRIMARY KEY,
      chat_name   TEXT,
      persona_id  TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS scheduled_sends (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      jid           TEXT    NOT NULL,
      chat_name     TEXT,
      content       TEXT    NOT NULL,
      scheduled_at  INTEGER NOT NULL,
      created_at    INTEGER NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'pending',
      error         TEXT
    );
  `);

  stmts = {
    saveMsg: db.prepare(`
      INSERT INTO conversations (jid, role, content, sender_name, timestamp)
      VALUES (@jid, @role, @content, @senderName, @timestamp)
    `),
    loadHistory: db.prepare(`
      SELECT role, content, sender_name, timestamp FROM conversations
      WHERE jid = @jid
      ORDER BY id DESC
      LIMIT @limit
    `),
    lastTimestamp: db.prepare(`
      SELECT timestamp FROM conversations WHERE jid = @jid ORDER BY id DESC LIMIT 1
    `),
    clearConv: db.prepare(`DELETE FROM conversations WHERE jid = @jid`),
    upsertPersona: db.prepare(`
      INSERT OR REPLACE INTO personas (jid, name, content, created_at, updated_at)
      VALUES (@jid, @name, @content, COALESCE((SELECT created_at FROM personas WHERE jid = @jid), @now), @now)
    `),
    getPersona: db.prepare(`SELECT * FROM personas WHERE jid = @jid`),
    listPersonas: db.prepare(`SELECT * FROM personas ORDER BY updated_at DESC`),
    deletePersona: db.prepare(`DELETE FROM personas WHERE jid = @jid`),
    upsertMapping: db.prepare(`
      INSERT OR REPLACE INTO chat_mappings (chat_id, chat_name, persona_id, created_at)
      VALUES (@chatId, @chatName, @personaId, COALESCE((SELECT created_at FROM chat_mappings WHERE chat_id = @chatId), @now))
    `),
    getMapping: db.prepare(`SELECT * FROM chat_mappings WHERE chat_id = @chatId`),
    listMappings: db.prepare(`SELECT * FROM chat_mappings ORDER BY created_at DESC`),
    deleteMapping: db.prepare(`DELETE FROM chat_mappings WHERE chat_id = @chatId`),
    getMappingsByPersona: db.prepare(`SELECT * FROM chat_mappings WHERE persona_id = @personaId`),
  };

  return { db, stmts };
}

/**
 * Save a conversation message.
 */
export function saveConversationMessage(jid, role, content, senderName = null) {
  const { stmts } = getDb();
  stmts.saveMsg.run({ jid, role, content, senderName, timestamp: Date.now() });
}

/**
 * Load conversation history for a JID, resetting if inactive.
 */
export function loadConversationHistory(jid, inactivityMs, maxMessages) {
  const { stmts } = getDb();
  const last = stmts.lastTimestamp.get({ jid });
  if (!last || Date.now() - last.timestamp > inactivityMs) return [];
  const rows = stmts.loadHistory.all({ jid, limit: maxMessages });
  return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
}

/**
 * Clear conversation history for a JID.
 */
export function clearConversation(jid) {
  const { stmts } = getDb();
  stmts.clearConv.run({ jid });
}

// ── Personas ────────────────────────────────────────────

export function upsertPersona(jid, name, content) {
  const { stmts } = getDb();
  stmts.upsertPersona.run({ jid, name, content, now: Date.now() });
}

export function getPersona(jid) {
  const { stmts } = getDb();
  return stmts.getPersona.get({ jid }) || null;
}

export function listPersonas() {
  const { stmts } = getDb();
  return stmts.listPersonas.all();
}

export function deletePersona(jid) {
  const { stmts } = getDb();
  return stmts.deletePersona.run({ jid }).changes > 0;
}

// ── Chat Mappings ───────────────────────────────────────

export function upsertMapping(chatId, chatName, personaId) {
  const { stmts } = getDb();
  stmts.upsertMapping.run({ chatId, chatName, personaId, now: Date.now() });
}

export function getMapping(chatId) {
  const { stmts } = getDb();
  return stmts.getMapping.get({ chatId }) || null;
}

export function listMappings() {
  const { stmts } = getDb();
  return stmts.listMappings.all();
}

export function deleteMapping(chatId) {
  const { stmts } = getDb();
  return stmts.deleteMapping.run({ chatId }).changes > 0;
}

export function getPersonaForChat(chatId) {
  const { stmts } = getDb();
  const mapping = stmts.getMapping.get({ chatId });
  if (!mapping) return null;
  return stmts.getPersona.get({ jid: mapping.persona_id }) || null;
}
