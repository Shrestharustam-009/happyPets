const mysql = require("mysql2/promise");
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
    console.log("Starting migration: Add vitals and client details...");

    const alterStatements = [
      {
        table: "users",
        query: "ALTER TABLE users ADD COLUMN alt_phone_number VARCHAR(50)",
        column: "alt_phone_number"
      },
      {
        table: "medical_records",
        query: "ALTER TABLE medical_records ADD COLUMN heart_rate VARCHAR(50)",
        column: "heart_rate"
      },
      {
        table: "medical_records",
        query: "ALTER TABLE medical_records ADD COLUMN blood_pressure VARCHAR(50)",
        column: "blood_pressure"
      },
      {
        table: "medical_records",
        query: "ALTER TABLE medical_records ADD COLUMN advice TEXT",
        column: "advice"
      }
    ];

    for (const stmt of alterStatements) {
      try {
        await conn.query(stmt.query);
        console.log(`Added ${stmt.column} to ${stmt.table}.`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`${stmt.column} already exists in ${stmt.table}.`);
        } else {
          throw err;
        }
      }
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
