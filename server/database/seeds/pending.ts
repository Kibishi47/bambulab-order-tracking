import { getDatabase } from '../index'
import { members, filamentDemands } from '../schema'
import { cleanDatabase } from './clean'

export function seedPending() {
  cleanDatabase()

  const { db } = getDatabase()
  const now = new Date().toISOString()

  console.log('🌱 Injection du jeu de données "pending" (besoins en attente)...')

  // Inserer 4 membres
  const [thomas, sophie, lucas, camille] = db.insert(members).values([
    {
      name: 'Thomas',
      email: 'thomas@example.com',
      phone: '06 12 34 56 78',
      dropoffLocation: 'Atelier / Makerspace',
      createdAt: now
    },
    {
      name: 'Sophie',
      email: 'sophie@example.com',
      phone: '06 98 76 54 32',
      dropoffLocation: 'Bureau Thomas',
      createdAt: now
    },
    {
      name: 'Lucas',
      email: 'lucas@example.com',
      phone: '07 11 22 33 44',
      dropoffLocation: 'Maison Thomas (soir)',
      createdAt: now
    },
    {
      name: 'Camille',
      email: 'camille@example.com',
      phone: '06 55 44 33 22',
      dropoffLocation: 'FabLab Ville',
      createdAt: now
    }
  ]).returning().all()

  // Inserer 6 besoins variés en attente de commande groupée
  db.insert(filamentDemands).values([
    {
      memberId: thomas.id,
      groupOrderId: null,
      filamentType: 'PLA Basic',
      format: 'RECHARGE',
      colorName: 'Bambu Green',
      colorHex: '#00AE42',
      quantity: 2,
      estimatedUnitPrice: 15.99,
      status: 'DEMANDE',
      notes: 'Boîtiers de capteurs météo',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: sophie.id,
      groupOrderId: null,
      filamentType: 'PLA Matte',
      format: 'BOBINE',
      colorName: 'Charcoal Black',
      colorHex: '#1E1E1E',
      quantity: 2,
      estimatedUnitPrice: 17.99,
      status: 'DEMANDE',
      notes: 'Vases et objets déco salon',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: sophie.id,
      groupOrderId: null,
      filamentType: 'PLA Silk',
      format: 'RECHARGE',
      colorName: 'Or Métallique',
      colorHex: '#D4AF37',
      quantity: 1,
      estimatedUnitPrice: 19.99,
      status: 'DEMANDE',
      notes: 'Médailles et trophées tournoi',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      groupOrderId: null,
      filamentType: 'PETG HF',
      format: 'RECHARGE',
      colorName: 'Blanc Jade',
      colorHex: '#FFFFFF',
      quantity: 2,
      estimatedUnitPrice: 16.99,
      status: 'DEMANDE',
      notes: 'Supports jardinière balcon',
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
      quantity: 1,
      estimatedUnitPrice: 29.99,
      status: 'DEMANDE',
      notes: 'Bras rigide imprimante 3D',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: camille.id,
      groupOrderId: null,
      filamentType: 'TPU 95A',
      format: 'BOBINE',
      colorName: 'Gris Cendre',
      colorHex: '#808080',
      quantity: 1,
      estimatedUnitPrice: 24.99,
      status: 'DEMANDE',
      notes: 'Pieds anti-vibrations',
      createdAt: now,
      updatedAt: now
    }
  ]).run()

  console.log('✅ Jeu de données "pending" injecté (4 membres, 9 bobines réparties sur 6 besoins).')
}

if (process.argv[1]?.endsWith('pending.ts')) {
  seedPending()
}
