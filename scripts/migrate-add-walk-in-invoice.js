const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");

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
});

async function migrate() {
  try {
    const [columns] = await pool.query(`SHOW COLUMNS FROM invoices`);
    const colNames = columns.map(c => c.Field);
    
    if (!colNames.includes("walk_in_name")) {
      await pool.query(`ALTER TABLE invoices ADD COLUMN walk_in_name VARCHAR(255) NULL`);
      console.log("Added walk_in_name to invoices.");
    }
    
    if (!colNames.includes("walk_in_phone")) {
      await pool.query(`ALTER TABLE invoices ADD COLUMN walk_in_phone VARCHAR(50) NULL`);
      console.log("Added walk_in_phone to invoices.");
    }

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
