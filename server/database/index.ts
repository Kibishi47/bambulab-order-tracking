import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { members, groupOrders, filamentDemands, settlements } from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null
let _sqlite: Database.Database | null = null

export function getDatabase() {
  if (_db) return { db: _db, sqlite: _sqlite! }

  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/bambulab.db')
  const dir = path.dirname(dbPath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  _sqlite = sqlite
  _db = drizzle(sqlite, { schema })

  initSchema(sqlite)

  return { db: _db, sqlite: _sqlite }
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
      status TEXT NOT NULL DEFAULT 'PREPARATION',
      total_amount REAL NOT NULL,
      shipping_fee REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS filament_demands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      group_order_id INTEGER REFERENCES group_orders(id) ON DELETE SET NULL,
      filament_type TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'RECHARGE',
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      estimated_unit_price REAL NOT NULL DEFAULT 16.99,
      actual_unit_price REAL,
      status TEXT NOT NULL DEFAULT 'DEMANDE',
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
      payment_method TEXT NOT NULL DEFAULT 'LYDIA',
      settled_at TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );
  `)
}


