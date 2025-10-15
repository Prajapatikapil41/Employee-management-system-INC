import React, { useState, useEffect } from "react";
import { addEvent, getJilaUsers } from "../api";
import { useNavigate } from "react-router-dom";

export default function AddEvent({ user, onBack }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    issueDate: "",
    level: "jila",
    eventType: "धरणा",
    location: "",
    createdBy: user?.id || "",
  });

  // photos: [{ file, url }]
  const [photos, setPhotos] = useState([]);
  const [mediaPhotos, setMediaPhotos] = useState([]);
  const [video, setVideo] = useState(null); // file
  const [videoPreview, setVideoPreview] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [jilaUsers, setJilaUsers] = useState([]);

  useEffect(() => {
    // fetch jila users when admin
    if (user && user.role === "admin") {
      (async () => {
        const res = await getJilaUsers();
        if (res && !res.error && Array.isArray(res)) {
          setJilaUsers(res);
        } else if (res && res.error) {
          console.warn("Failed to fetch jila users:", res.error);
        }
      })();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      // cleanup preview URLs on unmount
      photos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      mediaPhotos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      if (videoPreview) {
        try { URL.revokeObjectURL(videoPreview); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Photos handlers: store {file, url}
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      setMessage("आप अधिकतम 10 फ़ोटो ही चुन सकते हैं।");
      e.target.value = "";
      return;
    }
    const items = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...items]);
    e.target.value = "";
  };
  const handleRemovePhoto = (index) => {
    const removed = photos[index];
    if (removed && removed.url) {
      try { URL.revokeObjectURL(removed.url); } catch {}
    }
    setPhotos((arr) => arr.filter((_, i) => i !== index));
  };

  // Media photos
  const handleMediaPhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (mediaPhotos.length + files.length > 5) {
      setMessage("आप अधिकतम 5 मीडिया फ़ोटो ही चुन सकते हैं।");
      e.target.value = "";
      return;
    }
    const items = files.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setMediaPhotos((p) => [...p, ...items]);
    e.target.value = "";
  };
  const handleRemoveMediaPhoto = (index) => {
    const removed = mediaPhotos[index];
    if (removed && removed.url) {
      try { URL.revokeObjectURL(removed.url); } catch {}
    }
    setMediaPhotos((arr) => arr.filter((_, i) => i !== index));
  };

  // Video
  const handleVideoChange = (e) => {
    setMessage("");
    const file = e.target.files[0];
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB < 10) {
      setMessage("वीडियो कम से कम 10MB का होना चाहिए।");
      e.target.value = "";
      return;
    }
    if (sizeMB > 200) {
      setMessage("वीडियो 200MB से अधिक नहीं होना चाहिए।");
      e.target.value = "";
      return;
    }
    if (videoPreview) {
      try { URL.revokeObjectURL(videoPreview); } catch {}
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removeVideo = () => {
    if (videoPreview) {
      try { URL.revokeObjectURL(videoPreview); } catch {}
    }
    setVideo(null);
    setVideoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!form.name || !form.description || !form.startDate || !form.endDate || !form.issueDate || !form.location) {
      setMessage("कृपया सभी आवश्यक फ़ील्ड भरें।");
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("start_datetime", form.startDate);
      fd.append("end_datetime", form.endDate);
      fd.append("issue_date", form.issueDate);
      fd.append("location", form.location);
      fd.append("level", form.level);
      fd.append("event_type", form.eventType);

      const createdByToSend = form.createdBy || (user && user.id) || "";
      if (createdByToSend) fd.append("created_by", createdByToSend);

      photos.forEach((p) => fd.append("photos", p.file));
      mediaPhotos.forEach((p) => fd.append("mediaPhotos", p.file));
      if (video) fd.append("video", video);

      const res = await addEvent(fd);
      if (res && res.error) {
        setMessage("त्रुटि: " + res.error);
      } else if (res && (res.id || res.insertId)) {
        setMessage("कार्यक्रम सफलतापूर्वक जोड़ा गया।");
        // cleanup previews
        photos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
        mediaPhotos.forEach((p) => p.url && URL.revokeObjectURL(p.url));
        if (videoPreview) {
          try { URL.revokeObjectURL(videoPreview); } catch {}
        }

        setForm({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
          issueDate: "",
          level: "jila",
          eventType: "धरणा",
          location: "",
          createdBy: user?.id || "",
        });
        setPhotos([]);
        setMediaPhotos([]);
        setVideo(null);
        setVideoPreview(null);

        setTimeout(() => {
          if (onBack) onBack();
          else navigate("/");
        }, 800);
      } else {
        setMessage("सर्वर से अप्रत्याशित उत्तर मिला।");
      }
    } catch (err) {
      setMessage("त्रुटि: " + (err.message || "सर्वर से संपर्क नहीं हो सका।"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <main>
        <h2>नया कार्यक्रम जोड़ें</h2>
        {message && <div className="notice" role="status">{message}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div>
            <label>कार्यक्रम का नाम</label>
            <input name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <label>विवरण</label>
            <textarea name="description" value={form.description} onChange={handleChange} required />
          </div>

          <div className="row">
            <div className="col">
              <label>प्रारंभ दिनांक / समय</label>
              <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} required />
            </div>
            <div className="col">
              <label>समापन दिनांक / समय</label>
              <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label>जारी करने की दिनांक</label>
            <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} required />
          </div>

          <div>
            <label>स्थान</label>
            <input name="location" value={form.location} onChange={handleChange} required />
          </div>

          <div>
            <label>स्तर (Level)</label>
            <select name="level" value={form.level} onChange={handleChange}>
              <option value="jila">जिला</option>
              <option value="block">ब्लॉक</option>
            </select>
          </div>

          <div>
            <label>कार्यक्रम प्रकार</label>
            <select name="eventType" value={form.eventType} onChange={handleChange}>
              <option value="धरणा">धरणा</option>
              <option value="मीटिंग">मीटिंग</option>
              <option value="बंद">बंद</option>
              <option value="रैली">रैली</option>
              <option value="सभा">सभा</option>
              <option value="ग्यापन">ग्यापन</option>
            </select>
          </div>

          {user && user.role === "admin" && (
            <div>
              <label>निर्माता (Created By) — जिला अध्यक्ष चुनें</label>
              <select name="createdBy" value={form.createdBy} onChange={handleChange}>
                <option value="">-- खुद एडमिन (डिफ़ॉल्ट) --</option>
                {jilaUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label>फ़ोटो (अधिकतम 10)</label>
            <input type="file" multiple accept="image/*" onChange={handlePhotoChange} />
            <div className="event-thumbs row" style={{ marginTop: 8 }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={p.url} alt="preview" height="70" style={{ marginRight: 8 }} />
                  <button type="button" onClick={() => handleRemovePhoto(i)} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label>मीडिया कवरेज फ़ोटो (अधिकतम 5)</label>
            <input type="file" multiple accept="image/*" onChange={handleMediaPhotoChange} />
            <div className="event-thumbs row" style={{ marginTop: 8 }}>
              {mediaPhotos.map((p, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={p.url} alt="media" height="70" style={{ marginRight: 8 }} />
                  <button type="button" onClick={() => handleRemoveMediaPhoto(i)} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", borderRadius: "50%", width: 20, height: 20 }}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label>वीडियो (कम से कम 10MB, अधिकतम 200MB)</label>
            <input type="file" accept="video/*" onChange={handleVideoChange} />
            {videoPreview && <div style={{ marginTop: 8 }}><video controls src={videoPreview} width="240" /> <div><button type="button" className="button ghost" onClick={removeVideo}>वीडियो हटाएँ</button></div></div>}
          </div>

          <div className="form-actions">
            <button className="button" disabled={loading}>{loading ? "जोड़ा जा रहा है..." : "कार्यक्रम जोड़ें"}</button>
            <button type="button" className="button ghost" onClick={() => (onBack ? onBack() : navigate(-1))}>रद्द करें</button>
          </div>
        </form>
      </main>
    </div>
  );
}
