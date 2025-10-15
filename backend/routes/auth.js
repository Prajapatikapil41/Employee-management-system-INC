import express from "express";
import pool from "../db.js";

const router = express.Router();

/**
 * POST /api/auth/login
 * लॉगिन 4-digit कोड से होता है
 */
router.post("/login", async (req, res) => {
  try {
    if (!req.body || !req.body.code) {
      return res.status(400).json({ success: false, error: "कोड आवश्यक है" });
    }

    let { code } = req.body;
    code = (code || "").toString().trim();

    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({ success: false, error: "कृपया 4 अंकों का कोड दर्ज करें" });
    }

    const [rows] = await pool.query(
      "SELECT id, name, role, designation, last_visit, monthly_visit_count FROM users WHERE code = ? LIMIT 1",
      [code]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: "अमान्य कोड!" });
    }

    const user = rows[0];

    await pool.query(
      "UPDATE users SET last_visit = NOW(), monthly_visit_count = IFNULL(monthly_visit_count, 0) + 1 WHERE id = ?",
      [user.id]
    );

    const [u2] = await pool.query("SELECT id, name, role, designation, last_visit, monthly_visit_count FROM users WHERE id = ?", [user.id]);
    const updatedUser = u2[0];

    res.json({
      success: true,
      message: "लॉगिन सफल",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        designation: updatedUser.designation,
        last_visit: updatedUser.last_visit,
        monthly_visit_count: updatedUser.monthly_visit_count || 0,
      },
    });
  } catch (err) {
    console.error("🔴 Login Error:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

/**
 * GET /api/auth/users/jila
 */
router.get("/users/jila", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, designation FROM users WHERE role = 'user' AND designation = 'जिला अध्यक्ष'"
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("🔴 User Fetch Error:", err);
    res.status(500).json({ success: false, error: "सर्वर त्रुटि" });
  }
});

export default router;
