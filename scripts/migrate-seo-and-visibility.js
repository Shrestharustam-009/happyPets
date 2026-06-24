/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HappyPets Schema Migration: Add SEO columns and Products visibility
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Adds the optional 'is_visible' to 'products', and 'seo_title', 'seo_slug',
 * 'seo_description', 'focus_keyphrase' to 'blog_posts'.
 *
 * Usage:
 *   node scripts/migrate-seo-and-visibility.js
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

    // 1. Check & Add Products column
    console.log("[v0] Checking columns in products...");
    const [prodColumns] = await conn.query("SHOW COLUMNS FROM products");
    const hasIsVisible = prodColumns.some(c => c.Field === "is_visible");
    if (!hasIsVisible) {
      console.log("[v0] Adding 'is_visible' column to products...");
      await conn.query("ALTER TABLE products ADD COLUMN is_visible BOOLEAN DEFAULT FALSE;");
      console.log("[v0] Column 'is_visible' added successfully.");
    } else {
      console.log("[v0] Column 'is_visible' already exists in products.");
    }

    // 2. Check & Add Blog Posts columns
    console.log("[v0] Checking columns in blog_posts...");
    const [blogColumns] = await conn.query("SHOW COLUMNS FROM blog_posts");
    
    const blogAdds = [
      { field: "seo_title", sql: "ALTER TABLE blog_posts ADD COLUMN seo_title VARCHAR(255) NULL;" },
      { field: "seo_slug", sql: "ALTER TABLE blog_posts ADD COLUMN seo_slug VARCHAR(255) NULL;" },
      { field: "seo_description", sql: "ALTER TABLE blog_posts ADD COLUMN seo_description TEXT NULL;" },
      { field: "focus_keyphrase", sql: "ALTER TABLE blog_posts ADD COLUMN focus_keyphrase VARCHAR(255) NULL;" },
    ];

    for (const add of blogAdds) {
      const hasField = blogColumns.some(c => c.Field === add.field);
      if (!hasField) {
        console.log(`[v0] Adding '${add.field}' column to blog_posts...`);
        await conn.query(add.sql);
        console.log(`[v0] Column '${add.field}' added successfully.`);
      } else {
        console.log(`[v0] Column '${add.field}' already exists in blog_posts.`);
      }
    }

    conn.release();
  } catch (error) {
    console.error("[v0] Migration failed:", error);
  } finally {
    await pool.end();
  }
}

run();
