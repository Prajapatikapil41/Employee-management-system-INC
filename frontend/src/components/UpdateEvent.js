import React, { useEffect, useState, useRef } from "react";
import { getEvent, updateEvent, deleteEvent } from "../api";
import { useNavigate } from "react-router-dom";

export default function UpdateEvent({ id, user, onBack }) {
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // core fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [issue, setIssue] = useState("");
  const [level, setLevel] = useState("jila");
  const [eventType, setEventType] = useState("धरणा");
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState(0);

  // existing media (URLs from server)
  const [existingPhotos, setExistingPhotos] = useState([]); // array of URLs
  const [existingMediaPhotos, setExistingMediaPhotos] = useState([]);
  const [existingVideo, setExistingVideo] = useState(null); // url or null

  // removed trackers (URLs to remove on submit)
  const [removedPhotos, setRemovedPhotos] = useState([]);
  const [removedMediaPhotos, setRemovedMediaPhotos] = useState([]);
  const [removeVideoFlag, setRemoveVideoFlag] = useState(false);

  // new uploads (File objects) + previews (dataURL / objectURL)
  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [newMedia, setNewMedia] = useState([]);
  const [newMediaPreviews, setNewMediaPreviews] = useState([]);
  const [newVideo, setNewVideo] = useState(null);
  const [newVideoPreview, setNewVideoPreview] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ---------------- Date helpers ----------------
  function parsePossibleDate(raw) {
    if (!raw) return null;
    const d1 = new Date(raw);
    if (!isNaN(d1)) return d1;
    try {
      const d2 = new Date(raw.replace(" ", "T"));
      if (!isNaN(d2)) return d2;
    } catch {}
    return null;
  }
  function formatForDateTimeLocal(raw) {
    const d = parsePossibleDate(raw);
    if (!d) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  }
  function formatForDate(raw) {
    const d = parsePossibleDate(raw);
    if (!d) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function datetimeLocalToSQL(v) {
    if (!v) return null;
    return v.replace("T", " ") + ":00";
  }

  // ---------------- Load event ----------------
  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const e = await getEvent(id);
      if (!e || e.error) {
        setEvent(null);
        return;
      }
      setEvent(e);
      setName(e.name || "");
      setDescription(e.description || "");
      setStart(formatForDateTimeLocal(e.start_datetime || e.startDate || e.start));
      setEnd(formatForDateTimeLocal(e.end_datetime || e.endDate || e.end));
      setIssue(formatForDate(e.issue_date || e.issueDate));
      setLevel(e.level || "jila");
      setEventType(e.event_type || e.eventType || "धरणा");
      setLocation(e.location || "");
      setAttendees(e.attendees_count || 0);

      const safeParse = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        try { return JSON.parse(v || "[]"); } catch { return []; }
      };
      const photos = safeParse(e.photos);
      const mediaPhotos = safeParse(e.media_photos);
      setExistingPhotos(photos);
      setExistingMediaPhotos(mediaPhotos);
      setExistingVideo(e.video_path || null);
    } catch (err) {
      console.error("Load event failed:", err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }

  // ---------------- File preview helpers ----------------
  function fileToDataUrl(file) {
    return new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = () => res(null);
      fr.readAsDataURL(file);
    });
  }

  // New photos
  function handleNewPhotos(e) {
    const files = Array.from(e.target.files || []);
    const total = existingPhotos.length + newPhotos.length + files.length;
    if (total > 10) {
      alert("कुल फ़ोटो 10 से अधिक नहीं हो सकतीं।");
      e.target.value = "";
      return;
    }
    setNewPhotos((p) => [...p, ...files]);
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    Promise.all(imgs.map(fileToDataUrl)).then((previews) => {
      setNewPhotoPreviews((p) => [...p, ...previews]);
    });
    e.target.value = "";
  }
  function removeNewPhoto(index) {
    setNewPhotos((arr) => arr.filter((_, i) => i !== index));
    setNewPhotoPreviews((arr) => arr.filter((_, i) => i !== index));
  }

  // New media
  function handleNewMedia(e) {
    const files = Array.from(e.target.files || []);
    const total = existingMediaPhotos.length + newMedia.length + files.length;
    if (total > 5) {
      alert("कुल मीडिया फ़ोटो 5 से अधिक नहीं हो सकतीं।");
      e.target.value = "";
      return;
    }
    setNewMedia((p) => [...p, ...files]);
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    Promise.all(imgs.map(fileToDataUrl)).then((previews) => {
      setNewMediaPreviews((p) => [...p, ...previews]);
    });
    e.target.value = "";
  }
  function removeNewMedia(index) {
    setNewMedia((arr) => arr.filter((_, i) => i !== index));
    setNewMediaPreviews((arr) => arr.filter((_, i) => i !== index));
  }

  // Remove existing (mark for deletion)
  function removeExistingPhoto(url) {
    setExistingPhotos((arr) => arr.filter((p) => p !== url));
    setRemovedPhotos((r) => [...r, url]);
  }
  function removeExistingMedia(url) {
    setExistingMediaPhotos((arr) => arr.filter((p) => p !== url));
    setRemovedMediaPhotos((r) => [...r, url]);
  }

  // Video handling (new + existing)
  function handleNewVideo(e) {
    setVideoError(null);
    const f = e.target.files[0];
    if (!f) return;
    const sizeMB = f.size / (1024 * 1024);
    if (sizeMB < 10) {
      setVideoError("वीडियो कम से कम 10MB होना चाहिए");
      e.target.value = "";
      return;
    }
    if (sizeMB > 200) {
      setVideoError("वीडियो 200MB से अधिक नहीं होना चाहिए");
      e.target.value = "";
      return;
    }
    setNewVideo(f);
    setRemoveVideoFlag(false);
    e.target.value = "";
  }
  function removeExistingVideo() {
    if (!existingVideo) return;
    setExistingVideo(null);
    setRemoveVideoFlag(true);
  }
  function removeNewVideo() {
    setNewVideo(null);
    setVideoError(null);
  }

  // create preview URL for newVideo and cleanup
  useEffect(() => {
    let u;
    if (newVideo) {
      u = URL.createObjectURL(newVideo);
      setNewVideoPreview(u);
    } else {
      setNewVideoPreview(null);
    }
    return () => {
      if (u) {
        try { URL.revokeObjectURL(u); } catch {}
      }
    };
  }, [newVideo]);

  // ---------------- Submit ----------------
  async function submit(e) {
    e.preventDefault();
    if (!user || !user.id) {
      alert("कृपया पहले लॉगिन करें");
      return;
    }

    if (existingPhotos.length + newPhotos.length > 10) {
      alert("कुल फ़ोटो 10 से अधिक नहीं हो सकतीं।");
      return;
    }
    if (existingMediaPhotos.length + newMedia.length > 5) {
      alert("कुल मीडिया फ़ोटो 5 से अधिक नहीं हो सकतीं।");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();

      if (user.role === "admin") {
        if (name !== undefined) fd.append("name", name);
        if (description !== undefined) fd.append("description", description);
        if (start) fd.append("start_datetime", datetimeLocalToSQL(start));
        if (end) fd.append("end_datetime", datetimeLocalToSQL(end));
        if (issue) fd.append("issue_date", issue);
        if (level) fd.append("level", level);
        if (eventType) fd.append("event_type", eventType);
      } else {
        fd.append("userId", user.id);
      }

      fd.append("location", location);
      fd.append("attendees_count", attendees);

      removedPhotos.forEach((url) => fd.append("removePhotos", url));
      removedMediaPhotos.forEach((url) => fd.append("removeMediaPhotos", url));
      if (removeVideoFlag) fd.append("removeVideo", "1");

      newPhotos.forEach((f) => fd.append("photos", f));
      newMedia.forEach((f) => fd.append("mediaPhotos", f));
      if (newVideo) fd.append("video", newVideo);

      const res = await updateEvent(id, fd);
      if (res && res.error) {
        alert("त्रुटि: " + res.error);
      } else {
        alert("अपडेट सफल");
        if (onBack) onBack();
        else navigate("/");
      }
    } catch (err) {
      console.error("Update submit failed:", err);
      alert("अपडेट में त्रुटि");
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------- Delete event ----------------
  async function handleDelete() {
    if (!user || user.role !== "admin") {
      alert("केवल एडमिन ही इवेंट हटा सकते हैं।");
      return;
    }
    if (!window.confirm("क्या आप सुनिश्चित हैं कि आप इस इवेंट को हटाना चाहते हैं? यह स्थायी होगा।")) return;

    try {
      const r = await deleteEvent(id);
      if (r && (r.success || !r.error)) {
        alert("इवेंट सफलतापूर्वक हटाया गया।");
        if (onBack) onBack();
        else navigate("/");
      } else if (r && r.message) {
        alert("त्रुटि: " + r.message);
      } else {
        alert("इवेंट हटाने में समस्या आई।");
      }
    } catch (err) {
      console.error("delete failed:", err);
      alert("इवेंट हटाने में त्रुटि।");
    }
  }

  if (loading) return <div className="canvas">लोड हो रहा है...</div>;
  if (!event) return <div className="canvas">इवेंट नहीं मिला</div>;

  return (
    <div className="canvas">
      <button className="button ghost" onClick={() => (onBack ? onBack() : navigate(-1))}>वापस</button>
      <h3>इवेंट अपडेट करें</h3>

      <form onSubmit={submit}>
        <div style={{ marginTop: 8 }}>
          <label>कार्यक्रम का नाम</label>
          {user.role === "admin" ? (
            <input value={name} onChange={(e) => setName(e.target.value)} />
          ) : (
            <div className="muted">{name}</div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label>विवरण</label>
          {user.role === "admin" ? (
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          ) : (
            <div className="muted">{description}</div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label>शुरू (प्रारंभ दिनांक / समय)</label>
            {user.role === "admin" ? (
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
            ) : (
              <div className="muted">{start ? start.replace("T", " ") : "N/A"}</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label>समाप्त (समापन दिनांक / समय)</label>
            {user.role === "admin" ? (
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
            ) : (
              <div className="muted">{end ? end.replace("T", " ") : "N/A"}</div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <label>जारी करने की तिथि</label>
          {user.role === "admin" ? (
            <input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} />
          ) : (
            <div className="muted">{issue || "N/A"}</div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label>कार्यक्रम प्रकार</label>
          {user.role === "admin" ? (
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option>धरणा</option>
              <option>मीटिंग</option>
              <option>बंद</option>
              <option>रैली</option>
              <option>सभा</option>
              <option>ग्यापन</option>
            </select>
          ) : (
            <div className="muted">{eventType}</div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label>स्थान</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div style={{ marginTop: 8 }}>
          <label>हाज़िरी की संख्या</label>
          <input type="number" value={attendees} onChange={(e) => setAttendees(Number(e.target.value))} />
        </div>

        <div style={{ marginTop: 10 }}>
          <label>Photos (अधिकतम 10)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {existingPhotos.map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={url} alt={`existing-${i}`} style={{ height: 80, borderRadius: 8, objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(url)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {newPhotoPreviews.map((p, i) => (
              <div key={"newp" + i} style={{ position: "relative" }}>
                <img src={p} alt={`new-${i}`} style={{ height: 80, borderRadius: 8, objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <input type="file" accept="image/*" multiple onChange={handleNewPhotos} />
            <div className="file-hint">बचा हुआ स्लॉट: {10 - (existingPhotos.length + newPhotos.length)} उपलब्ध</div>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>मीडिया कवरेज फ़ोटो (अधिकतम 5)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {existingMediaPhotos.map((url, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img src={url} alt={`med-${i}`} style={{ height: 80, borderRadius: 8, objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removeExistingMedia(url)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {newMediaPreviews.map((p, i) => (
              <div key={"newm" + i} style={{ position: "relative" }}>
                <img src={p} alt={`nm-${i}`} style={{ height: 80, borderRadius: 8, objectFit: "cover" }} />
                <button
                  type="button"
                  onClick={() => removeNewMedia(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <input type="file" accept="image/*" multiple onChange={handleNewMedia} />
            <div className="file-hint">बचा हुआ स्लॉट: {5 - (existingMediaPhotos.length + newMedia.length)} उपलब्ध</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>वीडियो (कम से कम 10MB)</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
            {existingVideo ? (
              <div style={{ position: "relative" }}>
                <video controls width="240" src={existingVideo} />
                <button
                  type="button"
                  onClick={removeExistingVideo}
                  style={{ display: "block", marginTop: 6 }}
                  className="button ghost"
                >
                  Existing वीडियो हटाएँ
                </button>
              </div>
            ) : null}

            {newVideoPreview ? (
              <div style={{ position: "relative" }}>
                <video controls width="240" src={newVideoPreview} />
                <button type="button" onClick={removeNewVideo} style={{ display: "block", marginTop: 6 }} className="button ghost">
                  नया वीडियो हटाएँ
                </button>
              </div>
            ) : null}

            <div>
              <input type="file" accept="video/*" onChange={handleNewVideo} />
              {videoError && <div style={{ color: "red" }}>{videoError}</div>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? "सबमिट हो रहा है..." : "अपडेट भेजें"}
          </button>
          <button className="button ghost" type="button" onClick={() => (onBack ? onBack() : navigate(-1))}>
            रद्द करें
          </button>
          {user && user.role === "admin" && (
            <button
              type="button"
              onClick={handleDelete}
              className="button secondary"
              style={{ marginLeft: "auto" }}
            >
              इवेंट हटाएँ
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
