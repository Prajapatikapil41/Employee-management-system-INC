import React, { useEffect, useState } from "react";
import { getReport, acceptReport } from "../api";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function Report({ id, user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [eventSummary, setEventSummary] = useState({ total: 0, viewed: 0, updated: 0 });

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const r = await getReport(id);
      if (Array.isArray(r)) {
        setRows(r);
        computeSummary(r);
      } else {
        setRows([]);
        computeSummary([]);
      }
    } catch (err) {
      console.error(err);
      setRows([]);
      computeSummary([]);
    } finally {
      setLoading(false);
    }
  }

  function computeSummary(list) {
    const total = list.length;
    const viewed = list.filter((x) => x.viewed === 1).length;
    const updated = list.filter((x) => x.updated === 1).length;
    setEventSummary({ total, viewed, updated });
  }

  async function handleAccept(row) {
    if (!user || user.role !== "admin") {
      alert("केवल एडमिन ही स्वीकार कर सकता है।");
      return;
    }
    if (!window.confirm("क्या आप इस यूज़र के डेटा को स्वीकार करना चाहते हैं?")) return;
    try {
      const res = await acceptReport(id, row.id);
      if (res && res.error) {
        alert("त्रुटि: " + res.error);
      } else {
        alert("डेटा स्वीकार कर लिया गया।");
        load();
      }
    } catch (err) {
      console.error(err);
      alert("सर्वर त्रुटि");
    }
  }

  function openDetail(row) {
    // build safe HTML
    const html = `
      <div style="font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:16px;">
        <h2>यूज़र विवरण</h2>
        <div><strong>नाम:</strong> ${escapeHtml(row.name)}</div>
        <div><strong>पद:</strong> ${escapeHtml(row.designation)}</div>
        <div><strong>Viewed:</strong> ${row.viewed ? "हाँ" : "नहीं"}</div>
        <div><strong>Updated:</strong> ${row.updated ? "हाँ" : "नहीं"}</div>
        <div><strong>Accepted:</strong> ${row.accepted ? "हाँ" : "नहीं"}</div>
        <div style="margin-top:16px;">
          <button id="printBtn" style="padding:8px 12px; margin-right:8px;">प्रिंट रिपोर्ट</button>
          <button id="acceptBtn" style="padding:8px 12px;">डेटा स्वीकार करें</button>
        </div>
      </div>
    `;
    const w = window.open("", "_blank", "width=600,height=600");
    if (!w) {
      alert("नया विंडो या टैब ब्लॉक किया गया है। (Popup blocked)");
      // fallback: just show in alert
      alert(`नाम: ${row.name}\nपद: ${row.designation}\nViewed: ${row.viewed ? "हाँ" : "नहीं"}\nUpdated: ${row.updated ? "हाँ" : "नहीं"}\nAccepted: ${row.accepted ? "हाँ" : "नहीं"}`);
      return;
    }
    w.document.write(html);
    w.document.close();

    // attach handlers using the new window
    setTimeout(() => {
      try {
        const printBtn = w.document.getElementById("printBtn");
        const acceptBtn = w.document.getElementById("acceptBtn");
        if (printBtn) printBtn.addEventListener("click", () => w.print());
        if (acceptBtn) acceptBtn.addEventListener("click", () => {
          // use confirm in popup
          if (!w.confirm("क्या आप इस यूज़र के डेटा को स्वीकार करना चाहते हैं?")) return;
          // call API from parent window (simpler)
          (async () => {
            try {
              const res = await acceptReport(id, row.id);
              if (res && res.error) {
                w.alert("त्रुटि: " + res.error);
              } else {
                w.alert("डेटा स्वीकार कर लिया गया।");
                w.close();
                load();
              }
            } catch (err) {
              console.error(err);
              w.alert("सर्वर त्रुटि");
            }
          })();
        });
      } catch (err) {
        console.warn("Popup handler attach failed:", err);
      }
    }, 200);
  }

  if (loading) return <div className="canvas">लोड हो रहा है...</div>;

  return (
    <div className="canvas">
      <h2>रिपोर्ट — इवेंट ID: {id}</h2>

      <div style={{ marginBottom: 12 }}>
        <div><strong>कुल उपयोगकर्ता:</strong> {eventSummary.total}</div>
        <div><strong>इस इवेंट को देखा:</strong> {eventSummary.viewed} / {eventSummary.total}</div>
        <div><strong>इस इवेंट को अपडेट किया:</strong> {eventSummary.updated} / {eventSummary.total}</div>
      </div>

      <table className="table" aria-label="Report">
        <thead>
          <tr>
            <th style={{ width: 60 }}>S.No</th>
            <th>यूज़र नाम</th>
            <th>पद</th>
            <th>Viewed</th>
            <th>Updated</th>
            <th>Accepted</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i}>
              <td>{i + 1}</td>
              <td>{r.name}</td>
              <td>{r.designation}</td>
              <td style={{ color: r.viewed ? "green" : "red", fontWeight: 700 }}>{r.viewed ? "हाँ" : "नहीं"}</td>
              <td style={{ color: r.updated ? "green" : "red", fontWeight: 700 }}>{r.updated ? "हाँ" : "नहीं"}</td>
              <td style={{ color: r.accepted ? "green" : "red", fontWeight: 700 }}>{r.accepted ? "हाँ" : "नहीं"}</td>
              <td>
                <button className="button small" onClick={() => openDetail(r)}>Show Details</button>
                {user && user.role === "admin" && (
                  <button className="button ghost small" style={{ marginLeft: 8 }} onClick={() => handleAccept(r)}>Accept</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
