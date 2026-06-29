const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const crypto = require("crypto");

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

async function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

async function migrate() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    console.log("Starting transaction for CSV data import...");

    const usersMap = new Map(); // temp_client_id -> real_id
    const petsMap = new Map(); // temp_pet_id -> real_id

    // 1. Process Users
    const usersData = await readCSV(path.join(__dirname, "users.csv"));
    for (const row of usersData) {
      const tempId = row.temp_client_id;
      delete row.temp_client_id;
      row.role = "client";
      row.is_active = 1;
      row.password = "[HASHED_DEFAULT]";

      const keys = Object.keys(row);
      const values = keys.map(k => row[k] === "" ? null : row[k]);
      const placeholders = keys.map(() => "?").join(", ");
      
      const sql = `INSERT INTO users (${keys.join(", ")}) VALUES (${placeholders})`;
      const [result] = await conn.execute(sql, values);
      usersMap.set(tempId, result.insertId);
    }
    console.log(`Inserted ${usersData.length} users.`);

    // 2. Process Pets
    const petsData = await readCSV(path.join(__dirname, "pets.csv"));
    for (const row of petsData) {
      const tempPetId = row.temp_pet_id;
      const tempClientId = row.temp_client_id;
      delete row.temp_pet_id;
      delete row.temp_client_id;
      
      const realUserId = usersMap.get(tempClientId);
      if (!realUserId) throw new Error(`Missing user for temp_client_id: ${tempClientId}`);
      
      row.user_id = realUserId;
      row.share_token = crypto.randomUUID();

      const keys = Object.keys(row);
      const values = keys.map(k => row[k] === "" ? null : row[k]);
      const placeholders = keys.map(() => "?").join(", ");
      
      const sql = `INSERT INTO pets (${keys.join(", ")}) VALUES (${placeholders})`;
      const [result] = await conn.execute(sql, values);
      petsMap.set(tempPetId, result.insertId);
    }
    console.log(`Inserted ${petsData.length} pets.`);

    // 3. Process Medical Records
    const recordsData = await readCSV(path.join(__dirname, "medical_records.csv"));
    for (const row of recordsData) {
      const tempPetId = row.temp_pet_id;
      delete row.temp_pet_id;
      
      const realPetId = petsMap.get(tempPetId);
      if (!realPetId) throw new Error(`Missing pet for temp_pet_id: ${tempPetId}`);
      
      row.pet_id = realPetId;
      row.vet_id = 1; // Hardcoded Dr. Raju

      // Handle empty string vitals gracefully
      const vitals = ["temperature", "pulse", "heart_rate", "respiration"];
      vitals.forEach(v => {
        if (row[v] === "") {
          row[v] = null;
        }
      });

      const keys = Object.keys(row);
      const values = keys.map(k => row[k] === "" ? null : row[k]);
      const placeholders = keys.map(() => "?").join(", ");
      
      const sql = `INSERT INTO medical_records (${keys.join(", ")}) VALUES (${placeholders})`;
      await conn.execute(sql, values);
    }
    console.log(`Inserted ${recordsData.length} medical records.`);

    await conn.commit();
    console.log("Transaction committed successfully. Migration complete.");
  } catch (error) {
    console.error("Migration failed, rolling back:", error);
    if (conn) await conn.rollback();
    process.exit(1);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

migrate();
