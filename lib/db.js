import mysql from "mysql2/promise"

let pool = null

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "happypets",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    })
  }
  return pool
}

export async function query(sql, values = []) {
  try {
    const [results] = await getPool().query(sql, values)
    return results
  } catch (error) {
    console.error("[v0] Database error:", error)
    throw error
  }
}

export async function getConnection() {
  const connection = await getPool().getConnection()
  return {
    beginTransaction: async () => {
      await connection.beginTransaction()
    },
    commit: async () => {
      await connection.commit()
    },
    rollback: async () => {
      await connection.rollback()
    },
    execute: async (sql, values = []) => {
      const [results] = await connection.query(sql, values)
      return [results]
    },
    release: () => {
      connection.release()
    }
  }
}

