import React, { useState } from "react";
import { login } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login({ onLogin }) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const doLogin = async () => {
    setErr(null);
    setLoading(true);
    const trimmed = (code || "").toString().trim();
    if (trimmed.length !== 4 || !/^\d{4}$/.test(trimmed)) {
      setErr("कृपया 4 अंकों का कोड दर्ज करें।");
      setLoading(false);
      return;
    }
    try {
      const data = await login(trimmed);
      if (data?.user) {
        onLogin && onLogin(data.user);
        localStorage.setItem("inc_user", JSON.stringify(data.user));
        navigate("/");
      } else if (data && !data.error && data.id) {
        // some backends return inserted id — treat as success
        navigate("/");
      } else {
        setErr(data?.error || "लॉगिन विफल — सर्वर ने सही उत्तर नहीं दिया।");
      }
    } catch (err) {
      setErr(err.message || "नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", background: "white", padding: 20, borderRadius: 8, boxShadow: "var(--shadow-sm)" }}>
      <h2>लॉगिन</h2>
      <p className="muted">कृपया अपना 4-अंकीय कोड दर्ज करें</p>
      <input
        aria-label="4-डिजिट लॉगिन कोड"
        autoFocus
        value={code}
        onChange={(e) => { setErr(null); setCode(e.target.value.replace(/\D/g, "").slice(0,4)); }}
        onKeyDown={(e) => e.key === "Enter" && doLogin()}
        placeholder="उदा. 1111"
        style={{ padding: 10, width: "100%", marginTop: 8, borderRadius: 8, border: "1px solid #ddd" }}
      />
      {err && <div style={{ color: "red", marginTop: 8 }}>{err}</div>}
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button className="button" onClick={doLogin} disabled={loading}>{loading ? "लॉगिन..." : "लॉगिन"}</button>
        <button className="button ghost" onClick={() => { setCode("1111"); }}>Demo: 1111</button>
      </div>
      <div style={{ marginTop: 10, color: "var(--muted)" }}><small>डे़मो कोड: 1111 (admin), 2222 (user)</small></div>
    </div>
  );
}
