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

export function seedDatabaseIfEmpty() {
  const { db } = getDatabase()
  const existingMembers = db.select().from(members).all()
  if (existingMembers.length > 0) return

  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  // Seed sample members
  const memberList = [
    { name: 'Thomas', email: 'thomas@example.com', phone: '06 12 34 56 78', dropoffLocation: 'Makerspace / Atelier', createdAt: now },
    { name: 'Sophie', email: 'sophie@example.com', phone: '06 98 76 54 32', dropoffLocation: 'Bureau Thomas', createdAt: now },
    { name: 'Lucas', email: 'lucas@example.com', phone: '07 11 22 33 44', dropoffLocation: 'Maison Thomas (soir)', createdAt: now },
    { name: 'Camille', email: 'camille@example.com', phone: '06 55 44 33 22', dropoffLocation: 'Atelier FabLab', createdAt: now }
  ]

  const insertedMembers = db.insert(members).values(memberList).returning().all()
  const [thomas, sophie, lucas, camille] = insertedMembers

  // Seed a sample group order with Thomas as buyer
  const [order1] = db.insert(groupOrders).values({
    orderNumber: 'FR24098112',
    buyerId: thomas.id,
    purchaseDate: today,
    status: 'COMMANDE',
    totalAmount: 125.93,
    shippingFee: 0,
    notes: 'Livraison express estimée vendredi. Commande passée sur le store EU Bambu Lab.',
    createdAt: now
  }).returning().all()

  // Seed demands: some linked to order1, some pending (DEMANDE)
  db.insert(filamentDemands).values([
    // Demands in order1
    {
      memberId: thomas.id,
      groupOrderId: order1.id,
      filamentType: 'PLA Basic',
      format: 'RECHARGE',
      colorName: 'Bambu Green',
      colorHex: '#00AE42',
      quantity: 2,
      estimatedUnitPrice: 16.99,
      actualUnitPrice: 15.99,
      status: 'COMMANDE',
      notes: 'Pour les boîtiers de prototypage',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: sophie.id,
      groupOrderId: order1.id,
      filamentType: 'PLA Matte',
      format: 'BOBINE',
      colorName: 'Charcoal Black',
      colorHex: '#1E1E1E',
      quantity: 2,
      estimatedUnitPrice: 18.99,
      actualUnitPrice: 17.99,
      status: 'COMMANDE',
      notes: 'Finition mate pour décorations',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      groupOrderId: order1.id,
      filamentType: 'PETG HF',
      format: 'RECHARGE',
      colorName: 'Blanc Jade',
      colorHex: '#FFFFFF',
      quantity: 2,
      estimatedUnitPrice: 17.99,
      actualUnitPrice: 16.99,
      status: 'COMMANDE',
      notes: 'Pièces extérieures résistantes UV',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: camille.id,
      groupOrderId: order1.id,
      filamentType: 'TPU 95A',
      format: 'BOBINE',
      colorName: 'Gris Cendre',
      colorHex: '#808080',
      quantity: 1,
      estimatedUnitPrice: 24.99,
      actualUnitPrice: 23.99,
      status: 'COMMANDE',
      notes: 'Joints étanches et semelles souples',
      createdAt: now,
      updatedAt: now
    },
    // New pending demands for next order
    {
      memberId: sophie.id,
      groupOrderId: null,
      filamentType: 'PLA Silk',
      format: 'RECHARGE',
      colorName: 'Or Métallique',
      colorHex: '#D4AF37',
      quantity: 1,
      estimatedUnitPrice: 19.99,
      actualUnitPrice: null,
      status: 'DEMANDE',
      notes: 'Projet trophées impression',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      groupOrderId: null,
      filamentType: 'PETG-CF',
      format: 'BOBINE',
      colorName: 'Noir Carbone',
      colorHex: '#121212',
      quantity: 2,
      estimatedUnitPrice: 29.99,
      actualUnitPrice: null,
      status: 'DEMANDE',
      notes: 'Support moteur haute rigidité',
      createdAt: now,
      updatedAt: now
    }
  ]).run()

  // Seed sample settlement: Sophie already reimbursed 20€ to Thomas via Lydia
  db.insert(settlements).values({
    groupOrderId: order1.id,
    payerId: sophie.id,
    receiverId: thomas.id,
    amount: 20.0,
    paymentMethod: 'LYDIA',
    settledAt: today,
    notes: 'Acompte Lydia',
    createdAt: now
  }).run()
}
