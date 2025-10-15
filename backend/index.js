import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./db.js";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const UPLOAD_DIR_NAME = process.env.UPLOAD_DIR || "uploads";
const UPLOAD_DIR = path.join(__dirname, UPLOAD_DIR_NAME);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log(`📁 Uploads डायरेक्टरी बनाई गई: ${UPLOAD_DIR}`);
}
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);

app.get("/", (req, res) => {
  res.send("✅ INC इवेंट मैनेजमेंट सर्वर सफलतापूर्वक चल रहा है!");
});

app.use((req, res) => {
  res.status(404).json({ error: "API Endpoint नहीं मिला" });
});

app.use((err, req, res, next) => {
  console.error("❌ अप्रत्याशित सर्वर त्रुटि:", err);
  res.status(500).json({ error: "सर्वर में अप्रत्याशित त्रुटि हुई" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  console.log(`🚀 सर्वर पोर्ट ${PORT} पर चल रहा है`);

  try {
    const conn = await pool.getConnection();
    console.log("✅ डेटाबेस कनेक्शन सत्यापित");
    conn.release();
  } catch (dbErr) {
    console.error("⚠️ डेटाबेस कनेक्शन विफल:", dbErr.message);
  }
});
