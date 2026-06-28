const mysql = require("mysql2/promise");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const envVars = {};
function loadEnvFile() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    envVars[key] = val;
  }
}

loadEnvFile();

const pool = mysql.createPool({
  host: envVars.DB_HOST || process.env.DB_HOST || "localhost",
  port: parseInt(envVars.DB_PORT || process.env.DB_PORT || "3306"),
  user: envVars.DB_USER || process.env.DB_USER || "root",
  password: "tensorflow69!",
  database: envVars.DB_NAME || process.env.DB_NAME || "happypets",
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

async function migrate() {
  try {
    const conn = await pool.getConnection();
    console.log("Starting migration: Add share_token to test_reports...");

    try {
      await conn.query("ALTER TABLE test_reports ADD COLUMN share_token CHAR(36) UNIQUE");
      console.log("Added share_token column to test_reports table.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("share_token column already exists.");
      } else {
        throw err;
      }
    }

    const [reports] = await conn.query("SELECT id FROM test_reports WHERE share_token IS NULL");
    console.log(`Found ${reports.length} records needing share_tokens.`);

    for (const report of reports) {
      const token = crypto.randomUUID();
      await conn.query("UPDATE test_reports SET share_token = ? WHERE id = ?", [token, report.id]);
    }

    console.log("Migration completed successfully.");
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
