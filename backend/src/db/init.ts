import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const schemaPath = path.join(__dirname, 'schema.sql');

  console.log('📄 Reading schema file...');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  console.log('🚀 Executing schema...');
  const client = await pool.connect();

  try {
    await client.query(schemaSql);
    console.log('✅ Database schema initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase()
  .then(() => {
    console.log('🎉 Database initialization complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database initialization failed:', error);
    process.exit(1);
  });
