const mysql = require('mysql2/promise');

async function migrate() {
  console.log("Starting migration to add reminder_status and reminder_remarks...");
  
  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'happypets',
    });

    const connection = await pool.getConnection();

    try {
      console.log("Adding reminder_status column...");
      await connection.query("ALTER TABLE vaccinations ADD COLUMN reminder_status VARCHAR(50) DEFAULT 'Pending';");
      console.log("Success.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("reminder_status column already exists. Skipping.");
      } else {
        throw err;
      }
    }

    try {
      console.log("Adding reminder_remarks column...");
      await connection.query("ALTER TABLE vaccinations ADD COLUMN reminder_remarks TEXT;");
      console.log("Success.");
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("reminder_remarks column already exists. Skipping.");
      } else {
        throw err;
      }
    }

    connection.release();
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  }
}

migrate();
