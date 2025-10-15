import React, { useEffect, useState } from "react";
import { getEvent } from "../api";
import { useNavigate, useParams } from "react-router-dom";

function safeParseArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

function formatDateString(s) {
  if (!s) return "N/A";
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString("hi-IN");
}

export default function EventDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const e = await getEvent(id);
      if (!e || e.error) {
        setError(e?.error || "इवेंट लोड नहीं कर पाया");
        setEvent(null);
      } else {
        // e may be raw row or { ... }
        setEvent(e);
      }
    } catch (err) {
      console.error(err);
      setError("नेटवर्क त्रुटि");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="canvas">लोड हो रहा है...</div>;
  if (error) return <div className="canvas">{error}</div>;
  if (!event) return <div className="canvas">इवेंट नहीं मिला</div>;

  const photos = safeParseArray(event.photos);
  const mediaPhotos = safeParseArray(event.media_photos);

  return (
    <div className="canvas">
      <button className="button ghost" onClick={() => navigate(-1)}>
        वापस
      </button>
      <h3>{event.name}</h3>

      <p><b>विवरण:</b> {event.description || "-"}</p>
      <p><b>प्रारंभ:</b> {formatDateString(event.start_datetime)}</p>
      <p><b>समापन:</b> {formatDateString(event.end_datetime)}</p>
      <p><b>जारी करने की तिथि:</b> {event.issue_date || "-"}</p>
      <p><b>स्थान:</b> {event.location || "-"}</p>
      <p><b>स्तर:</b> {event.level === "jila" ? "जिला" : "ब्लॉक"}</p>
      <p><b>प्रकार:</b> {event.event_type || "-"}</p>
      <p><b>हाज़िरी की संख्या:</b> {event.attendees_count || 0}</p>

      <div style={{ marginTop: 16 }}>
        <h4>फ़ोटो</h4>
        {photos.length === 0 ? <div className="muted">कोई फोटो नहीं</div> : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {photos.map((p, i) => (
              <img key={i} src={p} alt={`photo-${i}`} style={{ height: 100, borderRadius: 8, objectFit: "cover" }} />
            ))}
          </div>
        )}
      </div>

      {mediaPhotos.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>मीडिया कवरेज फ़ोटो</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {mediaPhotos.map((p, i) => (
              <img key={i} src={p} alt={`media-${i}`} style={{ height: 100, borderRadius: 8, objectFit: "cover" }} />
            ))}
          </div>
        </div>
      )}

      {event.video_path && (
        <div style={{ marginTop: 16 }}>
          <h4>वीडियो</h4>
          <video width="320" height="240" controls src={event.video_path}></video>
        </div>
      )}
    </div>
  );
}
