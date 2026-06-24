/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HappyPets Schema Migration: Add history to medical_records
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Adds the optional 'history' column to the 'medical_records' table if not exists.
 *
 * Usage:
 *   node scripts/migrate-add-history.js
 * ══════════════════════════════════════════════════════════════════════════════
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.warn("[v0] No .env.local found — using process.env / defaults.");
    return;
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const val = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
  console.log("[v0] ✓ Loaded environment from .env.local");
}

loadEnvFile();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "happypets",
  waitForConnections: true,
  connectionLimit: 1,
  queueLimit: 0,
});

async function run() {
  try {
    const conn = await pool.getConnection();
    console.log("[v0] Checking columns in medical_records...");
    const [columns] = await conn.query("SHOW COLUMNS FROM medical_records");
    const hasHistory = columns.some(c => c.Field === "history");
    if (!hasHistory) {
      console.log("[v0] Adding 'history' column to medical_records...");
      await conn.query("ALTER TABLE medical_records ADD COLUMN history TEXT NULL;");
      console.log("[v0] Column 'history' added successfully.");
    } else {
      console.log("[v0] Column 'history' already exists in medical_records.");
    }
    conn.release();
  } catch (error) {
    console.error("[v0] Migration failed:", error);
  } finally {
    await pool.end();
  }
}

run();
