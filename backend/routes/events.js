import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../db.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});

function makeFileUrl(req, filename) {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.get("host");
  return `${proto}://${host}/uploads/${filename}`;
}

function safeJsonParse(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

function deleteFileIfExists(fileUrl) {
  try {
    if (typeof fileUrl !== "string" || !fileUrl.includes("/uploads/")) return;
    const fn = path.basename(fileUrl);
    const fp = path.join(uploadDir, fn);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch (err) {
    console.warn("⚠️ File deletion failed:", err.message || err);
  }
}

// GET events list
router.get("/", async (req, res) => {
  try {
    const type = req.query.type === "previous" ? "previous" : "ongoing";
    const sql =
      type === "previous"
        ? "SELECT * FROM events WHERE end_datetime < NOW() ORDER BY start_datetime DESC"
        : "SELECT * FROM events WHERE end_datetime >= NOW() ORDER BY start_datetime ASC";

    const [rows] = await pool.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("इवेंट लिस्ट त्रुटि:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

// GET single event
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "अमान्य ID" });

    const [rows] = await pool.query("SELECT * FROM events WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "इवेंट नहीं मिला" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("इवेंट विवरण त्रुटि:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

// Mark viewed
router.post("/:id/view", async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "userId आवश्यक है" });

    const [rows] = await pool.query("SELECT * FROM event_views WHERE event_id = ? AND user_id = ?", [eventId, userId]);

    if (rows.length === 0) {
      await pool.query("INSERT INTO event_views (event_id, user_id, viewed, updated_details, accepted, updated_at) VALUES (?,?,1,0,0,NOW())", [eventId, userId]);
    } else {
      await pool.query("UPDATE event_views SET viewed = 1, updated_at = NOW() WHERE id = ?", [rows[0].id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("व्यू मार्क त्रुटि:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

// Update event
router.post(
  "/:id/update",
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "mediaPhotos", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ success: false, error: "अमान्य ID" });

      const [existingRows] = await pool.query("SELECT * FROM events WHERE id = ? LIMIT 1", [id]);
      if (!existingRows.length) return res.status(404).json({ success: false, error: "इवेंट नहीं मिला" });

      const event = existingRows[0];
      const { name, description, start_datetime, end_datetime, issue_date, location, level, event_type, attendees_count, userId } = req.body;

      const removePhotosRaw = req.body.removePhotos;
      const removeMediaRaw = req.body.removeMediaPhotos;
      const removeVideoFlag = req.body.removeVideo === "1" || req.body.removeVideo === "true" || req.body.removeVideo === 1;

      const removePhotos = removePhotosRaw ? (Array.isArray(removePhotosRaw) ? removePhotosRaw : [removePhotosRaw]) : [];
      const removeMedia = removeMediaRaw ? (Array.isArray(removeMediaRaw) ? removeMediaRaw : [removeMediaRaw]) : [];

      const photos = event.photos ? safeJsonParse(event.photos) : [];
      const media_photos = event.media_photos ? safeJsonParse(event.media_photos) : [];
      let video_path = event.video_path || null;

      for (const url of removePhotos) {
        if (!url) continue;
        const idx = photos.indexOf(url);
        if (idx !== -1) photos.splice(idx, 1);
        deleteFileIfExists(url);
      }

      for (const url of removeMedia) {
        if (!url) continue;
        const idx = media_photos.indexOf(url);
        if (idx !== -1) media_photos.splice(idx, 1);
        deleteFileIfExists(url);
      }

      if (req.files?.photos) {
        req.files.photos.forEach((f) => photos.push(makeFileUrl(req, path.basename(f.path))));
      }

      if (req.files?.mediaPhotos) {
        req.files.mediaPhotos.forEach((f) => media_photos.push(makeFileUrl(req, path.basename(f.path))));
      }

      if (removeVideoFlag && video_path) {
        deleteFileIfExists(video_path);
        video_path = null;
      }

      if (req.files?.video?.[0]) {
        const v = req.files.video[0];
        if (v.size < 10 * 1024 * 1024) {
          try { fs.unlinkSync(v.path); } catch {}
          return res.status(400).json({ success: false, error: "वीडियो का आकार कम से कम 10MB होना चाहिए।" });
        }
        if (video_path) deleteFileIfExists(video_path);
        video_path = makeFileUrl(req, path.basename(v.path));
      }

      const updated = {
        name: name !== undefined ? name : event.name,
        description: description !== undefined ? description : event.description,
        start_datetime: start_datetime !== undefined ? start_datetime : event.start_datetime,
        end_datetime: end_datetime !== undefined ? end_datetime : event.end_datetime,
        issue_date: issue_date !== undefined ? issue_date : event.issue_date,
        location: location !== undefined ? location : event.location,
        level: level !== undefined ? level : event.level,
        event_type: event_type !== undefined ? event_type : event.event_type,
        attendees_count: attendees_count !== undefined ? attendees_count : event.attendees_count || 0,
      };

      await pool.query(
        `UPDATE events SET
          name=?, description=?, start_datetime=?, end_datetime=?, issue_date=?, location=?, level=?, event_type=?, attendees_count=?, photos=?, media_photos=?, video_path=?, updated_at=NOW()
        WHERE id=?`,
        [
          updated.name,
          updated.description,
          updated.start_datetime,
          updated.end_datetime,
          updated.issue_date,
          updated.location,
          updated.level,
          updated.event_type,
          updated.attendees_count,
          JSON.stringify(photos),
          JSON.stringify(media_photos),
          video_path,
          id,
        ]
      );

      if (userId) {
        const [ev] = await pool.query("SELECT * FROM event_views WHERE event_id=? AND user_id=?", [id, userId]);
        if (ev.length === 0) {
          await pool.query("INSERT INTO event_views (event_id, user_id, viewed, updated_details, accepted, updated_at) VALUES (?,?,?,?,?,NOW())", [id, userId, 1, 1, 0]);
        } else {
          await pool.query("UPDATE event_views SET updated_details=1, updated_at=NOW() WHERE id=?", [ev[0].id]);
        }
      }

      res.json({ success: true, message: "इवेंट सफलतापूर्वक अपडेट किया गया।" });
    } catch (err) {
      console.error("अपडेट त्रुटि:", err);
      res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
    }
  }
);

// Create event
router.post(
  "/",
  upload.fields([
    { name: "photos", maxCount: 10 },
    { name: "mediaPhotos", maxCount: 5 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { name, description, start_datetime, end_datetime, issue_date, location, level, event_type, created_by } = req.body;

      if (!name || !start_datetime || !end_datetime) {
        return res.status(400).json({ success: false, error: "आवश्यक फ़ील्ड ग़ायब हैं।" });
      }

      const photos = req.files?.photos?.map((f) => makeFileUrl(req, path.basename(f.path))) || [];
      const media_photos = req.files?.mediaPhotos?.map((f) => makeFileUrl(req, path.basename(f.path))) || [];

      let video_path = null;
      if (req.files?.video?.[0]) {
        const v = req.files.video[0];
        if (v.size < 10 * 1024 * 1024) {
          try { fs.unlinkSync(v.path); } catch {}
          return res.status(400).json({ success: false, error: "वीडियो का आकार कम से कम 10MB होना चाहिए।" });
        }
        video_path = makeFileUrl(req, path.basename(v.path));
      }

      const [result] = await pool.query(
        `INSERT INTO events 
          (name, description, start_datetime, end_datetime, issue_date, location, level, event_type, created_by, photos, media_photos, video_path, attendees_count, created_at, updated_at) 
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,NOW(),NOW())`,
        [
          name,
          description,
          start_datetime,
          end_datetime,
          issue_date,
          location,
          level,
          event_type,
          created_by,
          JSON.stringify(photos),
          JSON.stringify(media_photos),
          video_path,
        ]
      );

      res.json({ success: true, id: result.insertId });
    } catch (err) {
      console.error("एड इवेंट त्रुटि:", err);
      res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
    }
  }
);

// Report list
router.get("/:id/report", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "अमान्य ID" });

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.designation, 
         IF(ev.viewed=1,1,0) AS viewed, 
         IF(ev.updated_details=1,1,0) AS updated,
         IF(ev.accepted=1,1,0) AS accepted
       FROM users u 
       LEFT JOIN event_views ev 
         ON u.id = ev.user_id AND ev.event_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error("रिपोर्ट त्रुटि:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

// Accept report
router.post("/:id/report/accept", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: "userId आवश्यक है" });

    const [rows] = await pool.query("SELECT * FROM event_views WHERE event_id=? AND user_id=?", [id, userId]);
    if (rows.length === 0) {
      await pool.query("INSERT INTO event_views (event_id, user_id, viewed, updated_details, accepted, updated_at) VALUES (?,?,?,?,?,NOW())", [id, userId, 0, 0, 1]);
    } else {
      await pool.query("UPDATE event_views SET accepted=1, updated_at=NOW() WHERE id=?", [rows[0].id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("रिपोर्ट स्वीकार त्रुटि:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

// Delete event
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "अमान्य ID" });

    const [rows] = await pool.query("SELECT * FROM events WHERE id = ? LIMIT 1", [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: "इवेंट नहीं मिला।" });

    const ev = rows[0];
    const allFiles = [...safeJsonParse(ev.photos), ...safeJsonParse(ev.media_photos), ev.video_path].filter(Boolean);
    allFiles.forEach(deleteFileIfExists);

    await pool.query("DELETE FROM event_views WHERE event_id = ?", [id]);
    await pool.query("DELETE FROM events WHERE id = ?", [id]);

    res.json({ success: true, message: "इवेंट सफलतापूर्वक हटाया गया।" });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, message: "इवेंट हटाने में समस्या आई।" });
  }
});

export default router;
