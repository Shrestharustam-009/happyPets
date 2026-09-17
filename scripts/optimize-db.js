const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

function loadEnvFile() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
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
}

loadEnvFile();

async function addIndex(conn, table, indexName, column) {
  try {
    await conn.query(CREATE INDEX  ON ());
    console.log([OK] Added index  on ());
  } catch(e) {
    if (e.code === 'ER_DUP_KEYNAME') {
       console.log([SKIP] Index  already exists on );
    } else {
       console.log([ERROR] Failed to add index on : );
    }
  }
}

async function run() {
  console.log("Starting Database Optimization...");
  const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "happypets",
  });
  
  await addIndex(conn, "users", "idx_created_at", "created_at");
  await addIndex(conn, "pets", "idx_created_at", "created_at");
  await addIndex(conn, "medical_records", "idx_visit_date", "visit_date");
  await addIndex(conn, "test_reports", "idx_report_date", "report_date");
  await addIndex(conn, "vaccinations", "idx_given_date", "given_date");
  await addIndex(conn, "appointments", "idx_appointment_date", "appointment_date");
  await addIndex(conn, "invoices", "idx_issue_date", "issue_date");
  await addIndex(conn, "orders", "idx_created_at", "created_at");
  await addIndex(conn, "products", "idx_created_at", "created_at");
  await addIndex(conn, "consent_forms", "idx_created_at", "created_at");
  
  console.log("Database Optimization Complete! All pages should load instantly now.");
  await conn.end();
}

run();
