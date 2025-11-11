/**
 * Database Initialization Script
 *
 * This script creates the necessary database schema for the URL shortener.
 * Run this script once after setting up PostgreSQL to create tables and indexes.
 *
 * Usage:
 *   npm run init-db
 *
 * Schema Overview:
 * - urls table: Stores short codes and their corresponding original URLs
 * - Indexes for fast lookups and pagination
 */

// Load environment variables
import 'dotenv/config';
import pool from '#config/pool.js';

/**
 * Initialize the database with required schema
 */
async function initDatabase() {
  const client = await pool.connect();

  try {
    console.log('Starting Database Initialization...');

    // Start a transaction
    await client.query('BEGIN');

    // Create urls table
    console.log('📋 Creating "urls" table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(50) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP
      );
    `);
    console.log('✅ Table "urls" created successfully\n');

    // Create index on short_code for fast lookups
    console.log('🔍 Creating index on "short_code"...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_short_code ON urls(short_code);
    `);
    console.log('✅ Index "idx_short_code" created successfully\n');

    // Create index on created_at for efficient sorting/pagination
    console.log('🔍 Creating index on "created_at"...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_created_at ON urls(created_at DESC);
    `);
    console.log('✅ Index "idx_created_at" created successfully\n');

    // Commit the transaction
    await client.query('COMMIT');

    // Display schema information
    console.log('\n');
    console.log('Database Schema Information');

    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'urls'
      ORDER BY ordinal_position;
    `);

    console.log('Table: urls');
    console.log('Columns:');
    tableInfo.rows.forEach(col => {
      console.log(
        `  - ${col.column_name.padEnd(20)} ${col.data_type.padEnd(25)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'.padEnd(8)} ${col.column_default || ''}`
      );
    });

    console.log('✅ Database initialized successfully!');
    console.log('You can now start the application with:');
    console.log('  npm run start');
    console.log('  OR');
    console.log('  docker-compose up -d\n');
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('\n❌ Error initializing database:');
    console.error(error.message);
    console.error('\nPlease check:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database credentials in .env are correct');
    console.error('  3. Database "urlshortener" exists');
    console.error('\nTo create the database, run:');
    console.error('  psql -U postgres -c "CREATE DATABASE urlshortener;"\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Verify database connection before initialization
 */
async function verifyConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ Connected to PostgreSQL at ${result.rows[0].now}\n`);
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to database:');
    console.error(error.message);
    console.error(
      '\nPlease ensure PostgreSQL is running and credentials are correct.\n'
    );
    return false;
  }
}

// Main execution
(async () => {
  const connected = await verifyConnection();
  if (connected) {
    await initDatabase();
  } else {
    process.exit(1);
  }
})();
