import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const adminPass = await bcrypt.hash('admin123', 10);
  const eventoPass = await bcrypt.hash('Evento123', 10);

  const client = await pool.connect();
  try {
    console.log('Inserting admin user...');
    await client.query(`
      INSERT INTO users (email, name, password_hash, role, status, tabs)
      VALUES ($1, $2, $3, 'superadmin', 'approved', '[]')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        tabs = EXCLUDED.tabs
    `, ['admin@ocasa.com', 'Admin Global', adminPass]);

    console.log('Inserting evento user...');
    await client.query(`
      INSERT INTO users (email, name, password_hash, role, status, tabs)
      VALUES ($1, $2, $3, 'viewer', 'approved', '["evento"]')
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        tabs = EXCLUDED.tabs
    `, ['evento@ocasa.com', 'Evento', eventoPass]);

    console.log('Users created successfully!');
  } catch (err) {
    console.error('Error creating users:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
