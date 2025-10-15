import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import Home from "./components/Home";
import Login from "./components/Login";
import AddEvent from "./components/AddEvent";
import UpdateEvent from "./components/UpdateEvent";
import EventDetails from "./components/EventDetails";
import Report from "./components/Report";
import "./styles.css";

function AppShellInner() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("inc_user") || "null");
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (user) localStorage.setItem("inc_user", JSON.stringify(user));
    else localStorage.removeItem("inc_user");
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("inc_user");
    navigate("/");
  };

  function HomeWrapper() {
    return (
      <Home
        user={user}
        onAdd={() => navigate("/add")}
        onEdit={(id) => navigate(`/update/${id}`)}
        onOpen={(id) => navigate(`/event/${id}`)}
        onReport={(id) => navigate(`/event/${id}/report`)}
        onLogout={handleLogout}
      />
    );
  }

  function LoginWrapper() {
    const onLogin = (u) => {
      setUser(u);
      navigate("/");
    };
    return <Login onLogin={onLogin} />;
  }

  function AddWrapper() {
    const onBack = () => navigate(-1);
    if (!user || user.role !== "admin") {
      alert("केवल एडमिन ही नया इवेंट जोड़ सकता है। कृपया लॉगिन करें।");
      navigate("/login");
      return null;
    }
    return <AddEvent user={user} onBack={onBack} />;
  }

  function UpdateWrapper() {
    const { id } = useParams();
    const onBack = () => navigate(-1);
    if (!user) {
      alert("कृपया पहले लॉगिन करें");
      navigate("/login");
      return null;
    }
    return <UpdateEvent id={id} user={user} onBack={onBack} />;
  }

  function EventWrapper() {
    // EventDetails uses useParams internally, so we just render it
    return <EventDetails />;
  }

  function ReportWrapper() {
    const { id } = useParams();
    if (!user || user.role !== "admin") {
      alert("केवल एडमिन रिपोर्ट देख सकता है।");
      return null;
    }
    return <Report id={id} user={user} />;
  }

  return (
    <>
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/">
            <img
              src="/logo192.png"
              alt="logo"
              style={{ width: 44, height: 44, borderRadius: 8 }}
              onError={(e) => (e.target.style.display = "none")}
            />
          </Link>
          <h1>INC Event Management</h1>
        </div>

        <nav style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <Link className="button" to="/">
            होम
          </Link>

          {user && user.role === "admin" && (
            <Link className="button" to="/add">
              इवेंट जोड़ें
            </Link>
          )}

          <Link className="button" to="/show-event">
            इवेंट विवरण
          </Link>

          <Link className="button" to="/update-page">
            अपडेट पेज
          </Link>

          <Link className="button" to="/login">
            लॉगिन पेज
          </Link>

          {user ? (
            <button className="button ghost" onClick={handleLogout}>
              लॉग आउट
            </button>
          ) : null}
        </nav>
      </header>

      <main>
        <div style={{ maxWidth: 1200, margin: "20px auto", padding: 12 }}>
          <Routes>
            <Route path="/" element={<HomeWrapper />} />
            <Route path="/login" element={<LoginWrapper />} />
            <Route path="/add" element={<AddWrapper />} />
            <Route path="/update/:id" element={<UpdateWrapper />} />
            <Route path="/event/:id" element={<EventWrapper />} />
            <Route path="/event/:id/report" element={<ReportWrapper />} />

            <Route path="/show-event" element={<ShowEventPage />} />
            <Route path="/update-page" element={<UpdatePage />} />

            <Route path="*" element={<div className="canvas">404 - पेज नहीं मिला</div>} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function ShowEventPage() {
  const [eid, setEid] = useState("");
  const navigate = useNavigate();

  function go() {
    const id = (eid || "").trim();
    if (!id) {
      alert("कृपया Event ID डालें");
      return;
    }
    navigate(`/event/${id}`);
  }

  return (
    <div className="canvas" style={{ minHeight: "60vh" }}>
      <h2>इवेंट विवरण देखें</h2>
      <p className="muted">कृपया इवेंट का ID दर्ज करें और 'देखें' पर क्लिक करें</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, maxWidth: 420 }}>
        <input
          placeholder="Event ID"
          value={eid}
          onChange={(e) => setEid(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", flex: 1 }}
        />
        <button className="button" onClick={go}>
          देखें
        </button>
      </div>
    </div>
  );
}

function UpdatePage() {
  const [eid, setEid] = useState("");
  const navigate = useNavigate();

  function go() {
    const id = (eid || "").trim();
    if (!id) {
      alert("कृपया Event ID डालें");
      return;
    }
    navigate(`/update/${id}`);
  }

  return (
    <div className="canvas" style={{ minHeight: "60vh" }}>
      <h2>इवेंट अपडेट पेज</h2>
      <p className="muted">कृपया वह Event ID दर्ज करें जिसे आप अपडेट करना चाहते हैं</p>
      <div style={{ display: "flex", gap: 8, marginTop: 12, maxWidth: 420 }}>
        <input
          placeholder="Event ID"
          value={eid}
          onChange={(e) => setEid(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", flex: 1 }}
        />
        <button className="button secondary" onClick={go}>
          अपडेट पेज खोलें
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShellInner />
    </Router>
  );
}
