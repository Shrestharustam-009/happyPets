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

async function run() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "happypets",
    });
    console.log("Adding index to test_reports table...");
    await conn.query("CREATE INDEX idx_report_date ON test_reports(report_date);");
    console.log("Successfully added index! Loading speed should be instant now.");
    await conn.end();
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log("Index already exists. All good!");
    } else {
      console.error("Failed:", error);
    }
  }
}

run();
async function addMedicalRecordsIndex() {
  const mysql = require("mysql2/promise");
  const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "happypets",
  });
  try {
    await conn.query("CREATE INDEX idx_visit_date ON medical_records(visit_date);");
    console.log("Added index for medical_records");
  } catch(e) {}
  await conn.end();
}
addMedicalRecordsIndex();
