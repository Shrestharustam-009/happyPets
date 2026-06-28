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
  password: envVars.DB_PASSWORD || process.env.DB_PASSWORD || "",
  database: envVars.DB_NAME || process.env.DB_NAME || "happypets",
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

async function migrate() {
  try {
    const conn = await pool.getConnection();
    console.log("Starting migration: Add share_token to pets...");

    try {
      await conn.query("ALTER TABLE pets ADD COLUMN share_token CHAR(36) UNIQUE");
      console.log("Added share_token column to pets table.");
    } catch (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("share_token column already exists.");
      } else {
        throw err;
      }
    }

    const [pets] = await conn.query("SELECT id FROM pets WHERE share_token IS NULL");
    console.log(`Found ${pets.length} records needing share_tokens.`);

    for (const pet of pets) {
      const token = crypto.randomUUID();
      await conn.query("UPDATE pets SET share_token = ? WHERE id = ?", [token, pet.id]);
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
