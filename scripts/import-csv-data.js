/**
 * ══════════════════════════════════════════════════════════════════════════════
 * HappyPets Legacy Data Migration Script
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Imports three CSV files into the MySQL database in FK-safe order:
 *   1. Pet_Client_Reminder.csv  → users (clients) + pets
 *   2. Pet_Report_Exam.csv      → medical_records
 *   3. Pet_Reminder_Notification.csv → vaccinations (placeholder) + reminders_log
 *
 * Prerequisites:
 *   npm install csv-parser      (assumed already done)
 *   bcryptjs, mysql2            (already project dependencies)
 *
 * Usage:
 *   node scripts/import-csv-data.js
 *
 * Note: lib/db.js uses ESM (import/export) which cannot be require()'d from a
 * standalone CJS script. This file recreates the same pool configuration and
 * mirrors the project's transaction conventions (see orders/create/route.js).
 * ══════════════════════════════════════════════════════════════════════════════
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────────────────────────────────────
// Environment Variable Loader
// Next.js auto-loads .env.local; standalone scripts must load it manually.
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Database Configuration — mirrors lib/db.js pool settings exactly
// ─────────────────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "happypets",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

/**
 * Mirrors lib/db.js getConnection(), but also exposes beginTransaction,
 * commit, and rollback so the codebase transaction pattern works correctly.
 */
async function getConnection() {
  const conn = await pool.getConnection();
  return {
    execute: async (sql, values = []) => {
      const [results] = await conn.query(sql, values);
      return [results];
    },
    beginTransaction: () => conn.beginTransaction(),
    commit: () => conn.commit(),
    rollback: () => conn.rollback(),
    release: () => conn.release(),
  };
}

/** Mirrors lib/db.js query() — pool-level, auto-releases connection. */
async function query(sql, values = []) {
  try {
    const [results] = await pool.query(sql, values);
    return results;
  } catch (error) {
    console.error("[v0] Database error:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV File Paths — expected in the same /scripts directory
// ─────────────────────────────────────────────────────────────────────────────
const CSV_DIR = __dirname;
const CSV_FILES = {
  clients: path.join(CSV_DIR, "Pet_Client_Reminder.csv"),
  reports: path.join(CSV_DIR, "Pet_Report_Exam.csv"),
  reminders: path.join(CSV_DIR, "Pet_Reminder_Notification.csv"),
};

// ─────────────────────────────────────────────────────────────────────────────
// Utility Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a CSV file into an array of row objects. */
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
}

/** Generate a random 8-character alphanumeric password string. */
function generateRandomPassword() {
  return Math.random().toString(36).slice(-8);
}

/**
 * Build a unique key for a client row using Email > Phone > Name fallback.
 * This determines how we deduplicate clients within the CSV.
 */
function getClientKey(row) {
  const email = (row["Client Email"] || "").trim().toLowerCase();
  const phone = (row["Client PhoneNumber"] || "").trim();
  if (email) return `email:${email}`;
  if (phone) return `phone:${phone}`;
  const first = (row["Client FirstName"] || "").trim();
  const last = (row["Client LastName"] || "").trim();
  return `name:${first} ${last}`.trim();
}

/**
 * Attempt to normalize a date string into MySQL-compatible YYYY-MM-DD.
 * Returns null if the value is empty or unparseable.
 */
function normalizeDate(raw) {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw.trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  // Try native Date parsing (handles ISO, MM/DD/YYYY, etc.)
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  console.warn(`[v0]   ⚠ Could not parse date: "${cleaned}" — using NULL.`);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Migration Pipeline
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  HappyPets — Legacy CSV Data Migration");
  console.log("══════════════════════════════════════════════════════\n");

  // ── Pre-flight: Verify all CSV files exist ──
  for (const [label, filePath] of Object.entries(CSV_FILES)) {
    if (!fs.existsSync(filePath)) {
      console.error(`[v0] FATAL: Missing CSV file for "${label}": ${filePath}`);
      process.exit(1);
    }
  }
  console.log("[v0] ✓ All 3 CSV files located in /scripts.\n");

  // ── Pre-flight: Resolve default vet_id (required for medical_records) ──
  const admins = await query(
    "SELECT id, full_name FROM users WHERE role = 'admin' AND is_active = 1 ORDER BY id ASC LIMIT 1"
  );
  if (!admins.length) {
    console.error(
      '[v0] FATAL: No active user with role = "admin" found in the users table.\n' +
      "       medical_records.vet_id requires a valid user reference.\n" +
      "       Please create an admin user first (see 01-init-schema.sql)."
    );
    process.exit(1);
  }
  const defaultVetId = admins[0].id;
  console.log(
    `[v0] ✓ Default vet resolved → id: ${defaultVetId} ("${admins[0].full_name}")\n`
  );

  // ── Counters for the final summary ──
  const stats = {
    clientsInserted: 0,
    clientsSkipped: 0,
    petsInserted: 0,
    petsSkipped: 0,
    medicalInserted: 0,
    medicalSkipped: 0,
    remindersInserted: 0,
    remindersSkipped: 0,
  };

  // ── Acquire a dedicated connection for the transaction ──
  let connection;
  try {
    connection = await getConnection();
    console.log("[v0] ✓ Database connection acquired.\n");
    await connection.beginTransaction();

    // ═════════════════════════════════════════════════════════════════════════
    // PHASE 1 — Pet_Client_Reminder.csv → users (clients) + pets
    // ═════════════════════════════════════════════════════════════════════════
    console.log("──── Phase 1: Clients & Pets ────────────────────────");
    const clientRows = await parseCSV(CSV_FILES.clients);
    console.log(`[v0] Parsed ${clientRows.length} rows from Pet_Client_Reminder.csv`);

    // ── 1a. Deduplicate clients by Email > Phone > Name ──
    const uniqueClients = new Map(); // clientKey → first CSV row with that key
    for (const row of clientRows) {
      const key = getClientKey(row);
      if (!uniqueClients.has(key)) {
        uniqueClients.set(key, row);
      }
    }
    console.log(`[v0] Identified ${uniqueClients.size} unique clients.\n`);

    // ── 1b. Insert clients into users table ──
    const clientKeyToUserId = new Map(); // clientKey → users.id

    for (const [key, row] of uniqueClients) {
      const email = (row["Client Email"] || "").trim() || null;
      const phone = (row["Client PhoneNumber"] || "").trim() || null;
      const firstName = (row["Client FirstName"] || "").trim();
      const lastName = (row["Client LastName"] || "").trim();
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown Client";
      const address = (row["Client Address"] || "").trim() || null;

      // Check for existing user by email to avoid UNIQUE constraint violation
      if (email) {
        const [existingRows] = await connection.execute(
          "SELECT id FROM users WHERE email = ?",
          [email]
        );
        if (existingRows.length > 0) {
          clientKeyToUserId.set(key, existingRows[0].id);
          stats.clientsSkipped++;
          console.log(
            `[v0]   ↳ Skipped (exists): "${fullName}" <${email}> → user_id ${existingRows[0].id}`
          );
          continue;
        }
      }

      // Generate a bcrypt-hashed random password (matches codebase: 10 rounds)
      const hashedPassword = await bcrypt.hash(generateRandomPassword(), 10);

      const [result] = await connection.execute(
        `INSERT INTO users (full_name, email, phone_number, address, password, role, is_active)
         VALUES (?, ?, ?, ?, ?, 'client', TRUE)`,
        [fullName, email, phone, address, hashedPassword]
      );

      clientKeyToUserId.set(key, result.insertId);
      stats.clientsInserted++;

      if (stats.clientsInserted % 50 === 0) {
        console.log(`[v0]   ... inserted ${stats.clientsInserted} clients so far`);
      }
    }
    console.log(
      `[v0] ✓ Clients done: ${stats.clientsInserted} inserted, ${stats.clientsSkipped} skipped (pre-existing).\n`
    );

    // ── 1c. Insert pets, mapping each to its owner's new user_id ──
    //   Composite key "petName|userId" prevents duplicate pets for the same owner.
    //   simplePetNameMap provides a best-effort lookup for Phase 2 & 3 CSVs
    //   that only include pet name (no owner info).
    const petCompositeMap = new Map(); // "petName|userId" → pet_id
    const simplePetNameMap = new Map(); // "petName" → pet_id (first-match)
    const duplicatePetNames = new Set(); // track ambiguous pet names

    for (const row of clientRows) {
      const petName = (row["Pet Name"] || "").trim();
      if (!petName) continue;

      const clientKey = getClientKey(row);
      const userId = clientKeyToUserId.get(clientKey);
      if (!userId) {
        console.warn(`[v0]   ⚠ Skipping pet "${petName}": could not resolve owner.`);
        stats.petsSkipped++;
        continue;
      }

      // Skip if this exact pet+owner combo was already inserted
      const compositeKey = `${petName}|${userId}`;
      if (petCompositeMap.has(compositeKey)) continue;

      const species = (row["Species Name"] || "").trim() || "Unknown";
      const breed = (row["Breed Name"] || "").trim() || null;
      const dob = normalizeDate(row["Pet Birthday"]);
      const sex = (row["Pet Gender"] || "").trim() || null;
      const rawWeight = parseFloat(row["Pet Weight"]);
      const weight = isNaN(rawWeight) ? null : rawWeight;

      const [result] = await connection.execute(
        `INSERT INTO pets (user_id, name, species, breed, dob, sex, weight)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, petName, species, breed, dob, sex, weight]
      );

      const petId = result.insertId;
      petCompositeMap.set(compositeKey, petId);

      // Build the simple name map (first occurrence wins)
      if (simplePetNameMap.has(petName)) {
        duplicatePetNames.add(petName);
      } else {
        simplePetNameMap.set(petName, petId);
      }

      stats.petsInserted++;
      if (stats.petsInserted % 50 === 0) {
        console.log(`[v0]   ... inserted ${stats.petsInserted} pets so far`);
      }
    }

    if (duplicatePetNames.size > 0) {
      console.warn(
        `[v0]   ⚠ ${duplicatePetNames.size} pet name(s) appear under multiple owners: ` +
        `${[...duplicatePetNames].slice(0, 5).join(", ")}${duplicatePetNames.size > 5 ? "..." : ""}. ` +
        `Reports/Reminders will map to the first-inserted pet with that name.`
      );
    }
    console.log(
      `[v0] ✓ Pets done: ${stats.petsInserted} inserted, ${stats.petsSkipped} skipped.\n`
    );

    // ═════════════════════════════════════════════════════════════════════════
    // PHASE 2 — Pet_Report_Exam.csv → medical_records
    // ═════════════════════════════════════════════════════════════════════════
    console.log("──── Phase 2: Medical Records ──────────────────────");
    const reportRows = await parseCSV(CSV_FILES.reports);
    console.log(`[v0] Parsed ${reportRows.length} rows from Pet_Report_Exam.csv`);

    for (const row of reportRows) {
      const petName = (row["Pet Name"] || "").trim();
      const petId = simplePetNameMap.get(petName);

      if (!petId) {
        console.warn(
          `[v0]   ⚠ Skipping medical record: pet "${petName}" not found in imported data.`
        );
        stats.medicalSkipped++;
        continue;
      }

      // Map CSV headers → medical_records columns
      const rawTemp = parseFloat(row["Report Temp"]);
      const temperature = isNaN(rawTemp) ? null : rawTemp;
      const chiefComplaint = (row["Report Reason"] || "").trim() || null;
      const clinicalFindings = (row["Report History"] || "").trim() || null;
      const primaryDiagnosis = (row["Report Diagnosis"] || "").trim() || null;
      const treatmentInterventions = (row["Report Treatment"] || "").trim() || null;
      const prescribedMedicines = (row["Report Prescription"] || "").trim() || null;

      await connection.execute(
        `INSERT INTO medical_records
           (pet_id, vet_id, chief_complaint, temperature, clinical_findings,
            primary_diagnosis, treatment_interventions, prescribed_medicines)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          petId,
          defaultVetId,
          chiefComplaint,
          temperature,
          clinicalFindings,
          primaryDiagnosis,
          treatmentInterventions,
          prescribedMedicines,
        ]
      );

      stats.medicalInserted++;
      if (stats.medicalInserted % 50 === 0) {
        console.log(`[v0]   ... inserted ${stats.medicalInserted} medical records so far`);
      }
    }
    console.log(
      `[v0] ✓ Medical records done: ${stats.medicalInserted} inserted, ${stats.medicalSkipped} skipped.\n`
    );

    // ═════════════════════════════════════════════════════════════════════════
    // PHASE 3 — Pet_Reminder_Notification.csv → vaccinations + reminders_log
    // ═════════════════════════════════════════════════════════════════════════
    console.log("──── Phase 3: Reminders ────────────────────────────");
    const reminderRows = await parseCSV(CSV_FILES.reminders);
    console.log(`[v0] Parsed ${reminderRows.length} rows from Pet_Reminder_Notification.csv`);

    for (const row of reminderRows) {
      const petName = (row["Pet Name"] || "").trim();
      const petId = simplePetNameMap.get(petName);

      if (!petId) {
        console.warn(
          `[v0]   ⚠ Skipping reminder: pet "${petName}" not found in imported data.`
        );
        stats.remindersSkipped++;
        continue;
      }

      // Resolve the pet's owner (client_id) — required FK for reminders_log
      const [ownerRows] = await connection.execute(
        "SELECT user_id FROM pets WHERE id = ?",
        [petId]
      );
      if (!ownerRows.length || !ownerRows[0].user_id) {
        console.warn(
          `[v0]   ⚠ Skipping reminder: could not resolve owner for pet "${petName}" (id: ${petId}).`
        );
        stats.remindersSkipped++;
        continue;
      }
      const clientId = ownerRows[0].user_id;

      const notificationDate = normalizeDate(row["Notification Date"]);
      const reasonsFor =
        (row["Reminder ReasonsFor"] || "").trim() || "General Reminder";
      const details = (row["Notification Details"] || "").trim() || null;

      // 3a. Insert a placeholder vaccination to satisfy the reminders_log FK.
      //     Uses 'Reminder ReasonsFor' as the vaccine_name and today as given_date.
      const [vacResult] = await connection.execute(
        `INSERT INTO vaccinations (pet_id, vaccine_name, given_date, next_due_date, notes)
         VALUES (?, ?, CURRENT_DATE, ?, ?)`,
        [
          petId,
          reasonsFor,
          notificationDate,
          details
            ? `[CSV Migration] ${details}`
            : "[CSV Migration] Placeholder for legacy reminder",
        ]
      );
      const vaccinationId = vacResult.insertId;

      // 3b. Insert the reminders_log record linked to the new vaccination
      const sentDate = notificationDate
        ? notificationDate
        : new Date().toISOString().slice(0, 19).replace("T", " ");

      await connection.execute(
        `INSERT INTO reminders_log (vaccination_id, pet_id, client_id, type, status, sent_date)
         VALUES (?, ?, ?, 'Email', 'Sent', ?)`,
        [vaccinationId, petId, clientId, sentDate]
      );

      stats.remindersInserted++;
      if (stats.remindersInserted % 50 === 0) {
        console.log(`[v0]   ... inserted ${stats.remindersInserted} reminders so far`);
      }
    }
    console.log(
      `[v0] ✓ Reminders done: ${stats.remindersInserted} inserted, ${stats.remindersSkipped} skipped.\n`
    );

    // ═════════════════════════════════════════════════════════════════════════
    // COMMIT — all phases succeeded, persist everything
    // ═════════════════════════════════════════════════════════════════════════
    await connection.commit();

    console.log("══════════════════════════════════════════════════════");
    console.log("  Migration Complete ✓");
    console.log("══════════════════════════════════════════════════════");
    console.log(`  Clients:         ${stats.clientsInserted} inserted, ${stats.clientsSkipped} skipped`);
    console.log(`  Pets:            ${stats.petsInserted} inserted, ${stats.petsSkipped} skipped`);
    console.log(`  Medical Records: ${stats.medicalInserted} inserted, ${stats.medicalSkipped} skipped`);
    console.log(`  Reminders:       ${stats.remindersInserted} inserted, ${stats.remindersSkipped} skipped`);
    console.log("══════════════════════════════════════════════════════\n");
  } catch (error) {
    // ── Rollback on any failure — atomic: all-or-nothing ──
    if (connection) {
      await connection.rollback();
      console.error("[v0] ✗ Transaction ROLLED BACK — no data was persisted.");
    }
    console.error("[v0] Migration failed:", error);
    process.exit(1);
  } finally {
    // ── Always release the connection and close the pool ──
    if (connection) {
      connection.release();
    }
    await pool.end();
    console.log("[v0] Database connection pool closed.");
  }
}

// ─── Execute ────────────────────────────────────────────────────────────────
main();
