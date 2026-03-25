"use client";

import { useState, useEffect } from "react";

export default function PersonasPage() {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // jid being edited, or "new"
  const [form, setForm] = useState({ name: "", content: "" });

  useEffect(() => {
    fetchPersonas();
  }, []);

  async function fetchPersonas() {
    try {
      const res = await fetch("/api/personas");
      if (!res.ok) throw new Error("Failed to load personas");
      const data = await res.json();
      setPersonas(data.personas || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setEditing("new");
    setForm({ name: "", content: "" });
  }

  function startEdit(p) {
    setEditing(p.jid);
    setForm({ name: p.groupName || "", content: p.content || "" });
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ name: "", content: "" });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.content.trim()) {
      alert("Name and content are required.");
      return;
    }

    try {
      if (editing === "new") {
        // Create — use name as the jid for now (will be mapped to chats later)
        await fetch("/api/personas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jid: form.name.trim(), name: form.name.trim(), content: form.content.trim() }),
        });
      } else {
        // Update existing
        await fetch(`/api/personas/${encodeURIComponent(editing)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name.trim(), content: form.content.trim() }),
        });
      }
      cancelEdit();
      fetchPersonas();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(jid) {
    if (!confirm("Delete this persona?")) return;
    try {
      await fetch(`/api/personas/${encodeURIComponent(jid)}`, { method: "DELETE" });
      fetchPersonas();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <p style={{ padding: 24 }}>Loading personas...</p>;
  if (error) return <p style={{ padding: 24, color: "red" }}>Error: {error}</p>;

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Personas</h1>
          <p style={{ color: "#666", margin: "4px 0 0" }}>
            Define personas for the bot. Map them to chats to activate.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startNew}
            style={{ padding: "8px 20px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontSize: 14 }}
          >
            + New Persona
          </button>
        )}
      </div>

      {editing && (
        <div style={{ background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 8, padding: 20, marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px" }}>{editing === "new" ? "Create Persona" : "Edit Persona"}</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sales Assistant, Support Bot"
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: 13 }}>System Prompt</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="You are a helpful sales assistant for Acme Corp. Be friendly and concise..."
              rows={8}
              style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleSave}
              style={{ padding: "8px 20px", cursor: "pointer", background: "#0070f3", color: "#fff", border: "none", borderRadius: 6, fontSize: 14 }}
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              style={{ padding: "8px 20px", cursor: "pointer", background: "transparent", color: "#666", border: "1px solid #ccc", borderRadius: 6, fontSize: 14 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {personas.length === 0 && !editing ? (
        <p style={{ color: "#999" }}>No personas yet. Create one to get started.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {personas.map((p) => (
            <div key={p.jid} style={{ background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{p.groupName}</div>
                  <div style={{ color: "#999", fontSize: 12, marginTop: 2 }}>{p.jid}</div>
                  <div style={{ marginTop: 8, fontSize: 14, color: "#444", whiteSpace: "pre-wrap" }}>
                    {p.content || p.personaSummary || "—"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                  <button
                    onClick={() => startEdit(p)}
                    style={{ padding: "4px 12px", cursor: "pointer", color: "#0070f3", border: "1px solid #0070f3", borderRadius: 4, background: "transparent", fontSize: 13 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.jid)}
                    style={{ padding: "4px 12px", cursor: "pointer", color: "red", border: "1px solid red", borderRadius: 4, background: "transparent", fontSize: 13 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
