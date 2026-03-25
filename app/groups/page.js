"use client";

import { useState, useEffect } from "react";

export default function ChatsPage() {
  const [chats, setChats] = useState([]);
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
      setPersonas(data.personas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!form.chatId.trim() || !form.personaId) {
      alert("Chat ID and persona are required.");
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Chat Mappings</h1>
          <p style={{ color: "#666", margin: "4px 0 0" }}>
            Map chats/groups to personas. Only mapped chats get responses.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{ padding: "8px 20px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontSize: 14 }}
          >
            + Add Mapping
          </button>
        )}
      </div>

      {adding && (
        <div style={{ background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>Map a Chat to a Persona</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Chat ID</label>
            <input
              value={form.chatId}
              onChange={(e) => setForm({ ...form, chatId: e.target.value })}
              placeholder="e.g. 120363xxx@g.us or +14155551234@s.whatsapp.net"
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
            <span style={{ fontSize: 12, color: "#999" }}>
              Find this in the channel logs when a message arrives.
            </span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Display Name (optional)</label>
            <input
              value={form.chatName}
              onChange={(e) => setForm({ ...form, chatName: e.target.value })}
              placeholder="e.g. Sales Team, Alice"
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
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

      {chats.length === 0 && !adding ? (
        <p style={{ color: "#999" }}>No chats mapped. Add a mapping to activate the bot for a chat.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {chats.map((c) => (
            <div key={c.chatId} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{c.chatName || c.chatId}</div>
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
      )}
    </div>
  );
}
