import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { members, groupOrders, filamentDemands, settlements } from './schema'

// Singleton pattern on global scope to ensure a single instance across HMR and API requests
const globalForDb = globalThis as unknown as {
  _sqlite?: Database.Database
  _drizzle?: ReturnType<typeof drizzle<typeof schema>> & {
    db: ReturnType<typeof drizzle<typeof schema>>
    sqlite: Database.Database
  }
}

export function getDatabase() {
  if (globalForDb._sqlite && globalForDb._drizzle) {
    return globalForDb._drizzle
  }

  const rawPath = process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? '/app/data/bambulab.db' : './data/bambulab.db')
  const dbPath = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(process.cwd(), rawPath)
  const dbDir = path.dirname(dbPath)

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  console.log('✅ Base SQLite connectée avec succès sur :', dbPath)

  initSchema(sqlite)

  const db = drizzle(sqlite, { schema })
  const instance = Object.assign(db, { db, sqlite })

  globalForDb._sqlite = sqlite
  globalForDb._drizzle = instance

  return instance
}

function initSchema(sqlite: Database.Database) {
  // Create tables if they do not exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      dropoff_location TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      buyer_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      purchase_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      total_amount REAL NOT NULL,
      shipping_fee REAL NOT NULL DEFAULT 0,
      shipping_split_method TEXT NOT NULL DEFAULT 'EQUAL',
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS filament_demands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      payer_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
      group_order_id INTEGER REFERENCES group_orders(id) ON DELETE SET NULL,
      filament_type TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'REFILL',
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      estimated_unit_price REAL NOT NULL DEFAULT 16.99,
      actual_unit_price REAL,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      is_paused INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_order_id INTEGER REFERENCES group_orders(id) ON DELETE SET NULL,
      payer_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'WERO',
      settled_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `)

  try {
    sqlite.exec(`ALTER TABLE group_orders ADD COLUMN shipping_split_method TEXT NOT NULL DEFAULT 'EQUAL';`)
  } catch {
    // Column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE filament_demands ADD COLUMN payer_member_id INTEGER REFERENCES members(id) ON DELETE SET NULL;`)
  } catch {
    // Column already exists
  }

  try {
    sqlite.exec(`ALTER TABLE filament_demands ADD COLUMN is_paused INTEGER NOT NULL DEFAULT 0;`)
  } catch {
    // Column already exists
  }

  // Automatic data migration from legacy French enums to standard English enums
  try {
    sqlite.exec(`
      UPDATE group_orders SET status = 'PENDING' WHERE status IN ('PREPARATION', 'EN_ATTENTE');
      UPDATE group_orders SET status = 'ORDERED' WHERE status = 'COMMANDE';
      UPDATE group_orders SET status = 'RECEIVED' WHERE status IN ('LIVRE', 'RECU');
      UPDATE group_orders SET status = 'DISTRIBUTED' WHERE status IN ('CLOTURE', 'DISTRIBUE');

      UPDATE group_orders SET shipping_split_method = 'EQUAL' WHERE shipping_split_method = 'EQUITABLE';
      UPDATE group_orders SET shipping_split_method = 'PRO_RATA' WHERE shipping_split_method = 'PRORATA';

      UPDATE filament_demands SET status = 'REQUESTED' WHERE status = 'DEMANDE';
      UPDATE filament_demands SET status = 'ASSIGNED' WHERE status = 'PRIS_EN_CHARGE';
      UPDATE filament_demands SET status = 'ORDERED' WHERE status = 'COMMANDE';
      UPDATE filament_demands SET status = 'RECEIVED' WHERE status = 'RECU';
      UPDATE filament_demands SET status = 'DISTRIBUTED' WHERE status = 'DISTRIBUE';
      UPDATE filament_demands SET status = 'CANCELLED' WHERE status = 'ANNULE';

      UPDATE filament_demands SET format = 'REFILL' WHERE format = 'RECHARGE';
      UPDATE filament_demands SET format = 'SPOOL' WHERE format = 'BOBINE';

      UPDATE settlements SET payment_method = 'TRANSFER' WHERE payment_method = 'VIREMENT';
      UPDATE settlements SET payment_method = 'CASH' WHERE payment_method = 'ESPECES';
      UPDATE settlements SET payment_method = 'OTHER' WHERE payment_method = 'AUTRE';
    `)
  } catch (err) {
    console.error('Data migration warning:', err)
  }
}


