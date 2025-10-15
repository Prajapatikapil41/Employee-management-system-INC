import React, { useState, useEffect, useCallback } from "react";
import { listEvents } from "../api";

/*
Props:
  user, onOpen(id), onEdit(id), onAdd(), onReport(id), onLogout()
*/

function keyMonthViews(userId, monthKey) {
  return `inc_user_${userId}_views_${monthKey}`;
}

export default function Home({ user, onOpen, onEdit, onAdd, onReport, onLogout }) {
  const [type, setType] = useState("ongoing");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [clientMonthViews, setClientMonthViews] = useState(0);

  const fetchEvents = useCallback(async (t) => {
    setLoading(true);
    try {
      const r = await listEvents(t);
      if (r && !r.error && Array.isArray(r)) setEvents(r);
      else setEvents([]);
    } catch (err) {
      console.error(err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(type);
  }, [type, fetchEvents]);

  useEffect(() => {
    if (user && user.id) {
      const mk = new Date();
      const monthKey = `${mk.getFullYear()}-${String(mk.getMonth() + 1).padStart(2, "0")}`;
      const mv = parseInt(localStorage.getItem(keyMonthViews(user.id, monthKey)) || "0", 10);
      setClientMonthViews(isNaN(mv) ? 0 : mv);
    } else {
      setClientMonthViews(0);
    }
  }, [user]);

  function formatDateRange(e) {
    const s = e?.start_datetime || "";
    const ed = e?.end_datetime || "";
    if (!s && !ed) return "-";
    try {
      const sdt = s ? new Date(s) : null;
      const edt = ed ? new Date(ed) : null;
      const opts = { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };
      return `${sdt ? sdt.toLocaleString("hi-IN", opts) : ""}${sdt && edt ? " — " : ""}${edt ? edt.toLocaleString("hi-IN", opts) : ""}`;
    } catch {
      return `${s}${s && ed ? " — " : ""}${ed}`;
    }
  }

  const filtered = events.filter((ev) => {
    if (!search) return true;
    const s = search.trim().toLowerCase();
    return (ev.name || "").toLowerCase().includes(s) || (ev.description || "").toLowerCase().includes(s) || (ev.location || "").toLowerCase().includes(s);
  });

  return (
    <div className="canvas">
      <div className="hero" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div className="logo-badge">INC</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>इवेंट प्रबंधन</div>
            <div className="muted small">
              {user ? (
                <>
                  स्वागत <strong>{user.name || user.id}</strong> |
                  आख़िरी विज़िट: {user.last_visit ? new Date(user.last_visit).toLocaleString() : "पहली बार"} |
                  इस माह का सर्वर विज़िट काउंट: {user.monthly_visit_count || 0} |
                  लोकल इस माह देखा: {clientMonthViews}
                </>
              ) : (
                "कृपया लॉगिन करें"
              )}
            </div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {user && user.role === "admin" && <button className="button" onClick={onAdd}>+ नया इवेंट</button>}
          <button className="button ghost" onClick={() => fetchEvents(type)}>Refresh</button>
          {user ? <button className="button secondary" onClick={onLogout}>Logout</button> : <a className="button" href="/login">Login</a>}
        </div>
      </div>

      <div className="controls-row" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="radio" name="etype" checked={type === "ongoing"} onChange={() => setType("ongoing")} /> चल रही
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="radio" name="etype" checked={type === "previous"} onChange={() => setType("previous")} /> पिछले
          </label>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="नाम, स्थान, विवरण..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
          <button className="button ghost" onClick={() => setSearch("")}>साफ़ करें</button>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="empty">लोड हो रहा है...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 18, fontWeight: 700 }}>कोई इवेंट नहीं मिला</div>
            <div className="muted">फ़िल्टर साफ़ करें या नया इवेंट जोड़ें</div>
          </div>
        ) : (
          <table className="table" aria-label="Events">
            <thead>
              <tr>
                <th style={{ width: 70 }}>S. No.</th>
                <th>इवेंट विवरण (नाम)</th>
                <th style={{ width: 240 }}>इवेंट दिनांक</th>
                <th style={{ width: 320 }}>कार्रवाई</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => (
                <tr key={e.id || idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() => onOpen && onOpen(e.id)}
                    >
                      {e.name}
                    </button>
                  </td>
                  <td>{formatDateRange(e)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="button small" onClick={() => onOpen && onOpen(e.id)}>Show Details</button>
                      <button
                        className="button secondary small"
                        onClick={() => onEdit && onEdit(e.id)}
                        disabled={type === "previous"}
                        title={type === "previous" ? "पिछले इवेंट अपडेट नहीं किए जा सकते" : "Update"}
                      >
                        Update
                      </button>
                      {user && user.role === "admin" && (
                        <button className="button small" onClick={() => onReport && onReport(e.id)}>Report</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
