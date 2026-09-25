import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/military_assets';
const needsSsl = /neon\.tech|sslmode=require/i.test(connectionString);

export const pool = new Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });
export let isDatabaseReady = false;

export async function query(text, params = []) {
  return pool.query(text, params);
}

async function ensureUserColumns() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id text`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS picture text`);
  await pool.query(`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notes text`);
  await pool.query(`ALTER TABLE transfers ADD COLUMN IF NOT EXISTS notes text`);
  await pool.query(`ALTER TABLE assignments ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'`);
  await pool.query(`ALTER TABLE expenditures ADD COLUMN IF NOT EXISTS notes text`);
}

async function seedReferenceData() {
  const baseCount = await pool.query('SELECT COUNT(*)::int AS count FROM bases');
  if ((baseCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO bases (name, commander) VALUES
        ('Base Alpha', 'Commander Adams'),
        ('Base Bravo', 'Commander Singh'),
        ('Base Charlie', 'Commander Omar')
    `);
  }

  const typeCount = await pool.query('SELECT COUNT(*)::int AS count FROM equipment_types');
  if ((typeCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO equipment_types (name) VALUES
        ('Vehicle'),
        ('Weapon'),
        ('Ammunition')
    `);
  }

  const inventoryCount = await pool.query('SELECT COUNT(*)::int AS count FROM inventory');
  if ((inventoryCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO inventory (base_id, equipment_type_id, opening_balance, closing_balance, quantity_on_hand, assigned_quantity, expended_quantity)
      SELECT b.id, e.id,
        CASE e.name WHEN 'Vehicle' THEN 40 WHEN 'Weapon' THEN 120 ELSE 800 END,
        CASE e.name WHEN 'Vehicle' THEN 40 WHEN 'Weapon' THEN 120 ELSE 800 END,
        CASE e.name WHEN 'Vehicle' THEN 40 WHEN 'Weapon' THEN 120 ELSE 800 END,
        0, 0
      FROM bases b
      CROSS JOIN equipment_types e
    `);
  }

  const purchaseCount = await pool.query('SELECT COUNT(*)::int AS count FROM purchases');
  if ((purchaseCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, purchase_date, notes)
      VALUES
        (1, 1, 8, 24000, NOW() - INTERVAL '20 days', 'Armored vehicle replenishment'),
        (2, 2, 18, 1200, NOW() - INTERVAL '16 days', 'Small arms resupply'),
        (3, 3, 1500, 30, NOW() - INTERVAL '12 days', 'Ammunition lot'),
        (1, 2, 12, 1450, NOW() - INTERVAL '6 days', 'Optics-ready rifles')
    `);
  }

  const transferCount = await pool.query('SELECT COUNT(*)::int AS count FROM transfers');
  if ((transferCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, transfer_date, notes)
      VALUES
        (1, 2, 1, 4, NOW() - INTERVAL '14 days', 'Vehicle support for Bravo'),
        (3, 1, 2, 6, NOW() - INTERVAL '9 days', 'Weapons to Alpha'),
        (2, 3, 3, 250, NOW() - INTERVAL '4 days', 'Ammunition redistribution')
    `);
  }

  const assignmentCount = await pool.query('SELECT COUNT(*)::int AS count FROM assignments');
  if ((assignmentCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO assignments (base_id, equipment_type_id, asset_name, assigned_to, quantity, status, assigned_at)
      VALUES
        (1, 1, 'MRAP-12', 'Maj. Patel', 2, 'active', NOW() - INTERVAL '8 days'),
        (2, 2, 'Rifle-9', 'Capt. Lee', 6, 'active', NOW() - INTERVAL '5 days'),
        (3, 3, 'Ammunition Box-14', 'Sgt. Gomez', 40, 'active', NOW() - INTERVAL '2 days')
    `);
  }

  const expenditureCount = await pool.query('SELECT COUNT(*)::int AS count FROM expenditures');
  if ((expenditureCount.rows[0]?.count || 0) === 0) {
    await pool.query(`
      INSERT INTO expenditures (base_id, equipment_type_id, asset_name, quantity, expenditure_date, notes)
      VALUES
        (3, 3, 'Ammunition Box-7', 200, NOW() - INTERVAL '7 days', 'Live-fire exercise'),
        (1, 1, 'Vehicle-4', 1, NOW() - INTERVAL '3 days', 'Write-off after field damage'),
        (2, 2, 'Weapon Cache-3', 3, NOW() - INTERVAL '1 day', 'Range expenditure')
    `);
  }

  const demoUsers = [
    { name: 'Owner Admin', username: 'owner', email: 'avachatrushikesh45@gmail.com', password: 'Rushi123', role: 'admin', assignedBaseId: null },
    { name: 'General John Doe', username: 'admin', email: 'admin@military.com', password: 'Admin@123', role: 'admin', assignedBaseId: null },
    { name: 'Commander Adams', username: 'commander', email: 'commander@military.com', password: 'Commander@123', role: 'base_commander', assignedBaseId: 1 },
    { name: 'Lt. Logistics', username: 'logistics', email: 'logistics@military.com', password: 'Logistics@123', role: 'logistics_officer', assignedBaseId: null },
  ];

  for (const user of demoUsers) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [user.email, user.username]);
    const passwordHash = bcrypt.hashSync(user.password, 10);

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO users (name, username, email, password_hash, role, assigned_base_id, active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [user.name, user.username, user.email, passwordHash, user.role, user.assignedBaseId]
      );
    } else {
      await pool.query(
        `UPDATE users
         SET name = $1, password_hash = $2, role = $3, assigned_base_id = $4, active = true
         WHERE id = $5`,
        [user.name, passwordHash, user.role, user.assignedBaseId, existing.rows[0].id]
      );
    }
  }
}

export async function initializeDatabase() {
  try {
    await pool.query('SELECT 1');
    await ensureUserColumns();
    await seedReferenceData();
    isDatabaseReady = true;
    console.log('Database connection ready.');
    return true;
  } catch (error) {
    isDatabaseReady = false;
    console.warn('Database connection unavailable. API will run in fallback mode:', error.message);
    return false;
  }
}

export async function testDbConnection() {
  const result = await pool.query('SELECT 1 as ok');
  return result.rows[0];
}

export async function getDb() {
  return db;
}

export async function logAudit(tableName, action, actorRole, details = {}) {
  const result = await pool.query(
    'INSERT INTO audit_logs (table_name, action, actor_role, details) VALUES ($1, $2, $3, $4) RETURNING id',
    [tableName, action, actorRole, JSON.stringify(details)]
  );

  return result.rows[0];
}
