import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "inc_events",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+05:30",
});

pool
  .getConnection()
  .then((conn) => {
    console.log(`✅ MySQL कनेक्शन सफल (डेटाबेस: ${process.env.DB_NAME})`);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL कनेक्शन विफल:", err.message);
  });

process.on("SIGINT", async () => {
  try {
    await pool.end();
    console.log("🛑 MySQL पूल बंद किया गया");
    process.exit(0);
  } catch (err) {
    console.error("MySQL पूल बंद करने में त्रुटि:", err);
    process.exit(1);
  }
});

export default pool;
