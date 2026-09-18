import { getDatabase } from './index'
import { members, groupOrders, filamentDemands, settlements } from './schema'

export function seedDatabase() {
  const { db } = getDatabase()
  const existingMembers = db.select().from(members).all()
  if (existingMembers.length > 0) {
    console.log('ℹ️ Base de données déjà initialisée, aucun seed appliqué.')
    return
  }

  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  console.log('🌱 Démarrage du seed des données de démonstration...')

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

  // Seed demands
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
    // Pending demands for next order
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

  // Seed sample settlement
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

  console.log('✅ Seed terminé avec succès.')
}

// If executed directly from command line (e.g. npm run db:seed)
if (process.argv[1]?.endsWith('seed.ts') || process.env.RUN_SEED === 'true') {
  if (process.env.NODE_ENV === 'production' && process.env.RUN_SEED !== 'true') {
    console.warn('⚠️ Seeding désactivé en environnement de production.')
    process.exit(0)
  }
  seedDatabase()
}
