import { cache } from "react";
import { unstable_cache as nextCache } from "next/cache";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY, 
        text TEXT
      )`);
  } finally {
    client.release();
  }
}

initDb();

export async function addMessage(message) {
  const client = await pool.connect();
  try {
    await client.query("INSERT INTO messages (text) VALUES ($1)", [message]);
  } finally {
    client.release();
  }
}

export const getMessages = nextCache(
  cache(async function getMessages() {
    console.log("Fetching messages from db");
    const client = await pool.connect();
    try {
      const result = await client.query("SELECT * FROM messages");
      return result.rows;
    } finally {
      client.release();
    }
  }),
  ["messages"],
  {
    //revalidate: 5
    tags: ["msg", "other"],
  }
);
