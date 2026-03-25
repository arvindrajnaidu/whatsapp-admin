"use client";

import { useState, useEffect } from "react";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
  const [unmapped, setUnmapped] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ chatId: "", chatName: "", personaId: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setChats(data.chats || []);
      setUnmapped(data.unmapped || []);
      setPersonas(data.personas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startMapping(chat) {
    setAdding(true);
    setForm({ chatId: chat.jid, chatName: chat.name, personaId: "" });
  }

  async function handleAdd() {
    if (!form.chatId || !form.personaId) {
      alert("Chat and persona are required.");
      return;
    }
    try {
      await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setAdding(false);
      setForm({ chatId: "", chatName: "", personaId: "" });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRemove(chatId) {
    if (!confirm("Remove this mapping?")) return;
    try {
      await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Loading...</p>;
  if (error) return <p style={{ padding: 24, color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ margin: "0 0 4px" }}>Chat Mappings</h1>
      <p style={{ color: "#666", margin: "0 0 24px" }}>
        Map chats to personas. Only mapped chats get responses.
      </p>

      {/* Active mappings */}
      {chats.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Active</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {chats.map((c) => (
              <div key={c.chatId} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.chatName}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{c.chatId}</div>
                  <div style={{ fontSize: 13, color: "#0070f3", marginTop: 4 }}>Persona: {c.personaName}</div>
                </div>
                <button
                  onClick={() => handleRemove(c.chatId)}
                  style={{ padding: "4px 12px", cursor: "pointer", color: "red", border: "1px solid red", borderRadius: 4, background: "transparent", fontSize: 13 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Assign persona form */}
      {adding && (
        <div style={{ background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 4px" }}>Assign Persona</h3>
          <p style={{ color: "#666", fontSize: 13, margin: "0 0 16px" }}>
            {form.chatName} <span style={{ color: "#999" }}>({form.chatId})</span>
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Persona</label>
            {personas.length === 0 ? (
              <p style={{ color: "#999", fontSize: 13 }}>No personas yet. <a href="/personas">Create one first.</a></p>
            ) : (
              <select
                value={form.personaId}
                onChange={(e) => setForm({ ...form, personaId: e.target.value })}
                style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
              >
                <option value="">Select a persona...</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAdd}
              disabled={personas.length === 0}
              style={{ padding: "8px 20px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontSize: 14 }}
            >
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setForm({ chatId: "", chatName: "", personaId: "" }); }}
              style={{ padding: "8px 20px", cursor: "pointer", background: "transparent", color: "#666", border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Unmapped chats discovered from incoming messages */}
      {unmapped.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, margin: "0 0 8px" }}>Unmapped Chats</h2>
          <p style={{ color: "#666", fontSize: 13, margin: "0 0 12px" }}>
            These chats have sent messages but have no persona assigned. The bot won't respond until you map one.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {unmapped.map((c) => (
              <div key={c.jid} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                    {c.type === "group" ? "Group" : "DM"} &middot; {c.jid}
                  </div>
                </div>
                <button
                  onClick={() => startMapping(c)}
                  style={{ padding: "6px 16px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none", borderRadius: 4, fontSize: 13 }}
                >
                  Assign Persona
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {chats.length === 0 && unmapped.length === 0 && !adding && (
        <p style={{ color: "#999" }}>No chats seen yet. Send a message to the bot to discover chats.</p>
      )}
    </div>
  );
}
