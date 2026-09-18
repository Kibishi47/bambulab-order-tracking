import { getDatabase } from '../index'
import { members, groupOrders, filamentDemands, settlements } from '../schema'
import { cleanDatabase } from './clean'

export function seedFull() {
  cleanDatabase()

  const { db } = getDatabase()
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  console.log('🌱 Injection du jeu de données exhaustif ("full")...')

  // 1. Membres complets
  const memberList = [
    {
      name: 'Thomas',
      email: 'thomas@bambushare.fr',
      phone: '06 12 34 56 78',
      dropoffLocation: 'Makerspace / Atelier central',
      createdAt: now
    },
    {
      name: 'Sophie',
      email: 'sophie@bambushare.fr',
      phone: '06 98 76 54 32',
      dropoffLocation: 'Bureau Sophie (Semaine)',
      createdAt: now
    },
    {
      name: 'Lucas',
      email: 'lucas@bambushare.fr',
      phone: '07 11 22 33 44',
      dropoffLocation: 'Maison Thomas (soir)',
      createdAt: now
    },
    {
      name: 'Camille',
      email: 'camille@bambushare.fr',
      phone: '06 55 44 33 22',
      dropoffLocation: 'FabLab Université',
      createdAt: now
    },
    {
      name: 'Alexandre',
      email: 'alexandre@bambushare.fr',
      phone: '07 88 99 00 11',
      dropoffLocation: 'Atelier central',
      createdAt: now
    }
  ]

  const [thomas, sophie, lucas, camille, alexandre] = db.insert(members).values(memberList).returning().all()

  // 2. Commande 1 : Frais de port EQUITABLE (6.00 €), acheteur Thomas, statut LIVRE
  // Total = 2*14.99 + 2*16.99 + 1*15.99 + 6.00 = 29.98 + 33.98 + 15.99 + 6.00 = 85.95 €
  const [order1] = db.insert(groupOrders).values({
    orderNumber: 'FR24098112',
    buyerId: thomas.id,
    purchaseDate: '2026-09-08',
    status: 'LIVRE',
    totalAmount: 85.95,
    shippingFee: 6.00,
    shippingSplitMethod: 'EQUITABLE',
    notes: 'Livraison express reçue à l\'atelier. Bobines prêtes pour remise en main propre.',
    createdAt: now
  }).returning().all()

  // 3. Commande 2 : Frais de port PRORATA (8.50 €), acheteuse Sophie, statut COMMANDE
  // Total = 2*18.99 + 2*28.99 + 1*23.99 + 8.50 = 37.98 + 57.98 + 23.99 + 8.50 = 128.45 €
  const [order2] = db.insert(groupOrders).values({
    orderNumber: 'FR24099450',
    buyerId: sophie.id,
    purchaseDate: '2026-09-15',
    status: 'COMMANDE',
    totalAmount: 128.45,
    shippingFee: 8.50,
    shippingSplitMethod: 'PRORATA',
    notes: 'Commande en cours d\'acheminement transporteur DPD.',
    createdAt: now
  }).returning().all()

  // 4. Demandes associées et statuts variés (DEMANDE, COMMANDE, RECU, DISTRIBUE)
  db.insert(filamentDemands).values([
    // Dans Commande 1 (Statut RECU & DISTRIBUE)
    {
      memberId: thomas.id,
      groupOrderId: order1.id,
      filamentType: 'PLA Basic',
      format: 'RECHARGE',
      colorName: 'Bambu Green',
      colorHex: '#00AE42',
      quantity: 2,
      estimatedUnitPrice: 15.99,
      actualUnitPrice: 14.99,
      status: 'RECU',
      notes: 'Proto boîtiers',
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
      estimatedUnitPrice: 17.99,
      actualUnitPrice: 16.99,
      status: 'DISTRIBUE',
      notes: 'Décoration événementielle - Déjà récupéré',
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
      quantity: 1,
      estimatedUnitPrice: 16.99,
      actualUnitPrice: 15.99,
      status: 'RECU',
      notes: 'Fixations murales',
      createdAt: now,
      updatedAt: now
    },

    // Dans Commande 2 (Statut COMMANDE)
    {
      memberId: sophie.id,
      groupOrderId: order2.id,
      filamentType: 'PLA Silk',
      format: 'RECHARGE',
      colorName: 'Or Métallique',
      colorHex: '#D4AF37',
      quantity: 2,
      estimatedUnitPrice: 19.99,
      actualUnitPrice: 18.99,
      status: 'COMMANDE',
      notes: 'Trophées robotique',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: lucas.id,
      groupOrderId: order2.id,
      filamentType: 'PETG-CF',
      format: 'BOBINE',
      colorName: 'Noir Carbone',
      colorHex: '#121212',
      quantity: 2,
      estimatedUnitPrice: 29.99,
      actualUnitPrice: 28.99,
      status: 'COMMANDE',
      notes: 'Pièces mécaniques drone haute résistance',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: camille.id,
      groupOrderId: order2.id,
      filamentType: 'TPU 95A',
      format: 'BOBINE',
      colorName: 'Gris Cendre',
      colorHex: '#808080',
      quantity: 1,
      estimatedUnitPrice: 24.99,
      actualUnitPrice: 23.99,
      status: 'COMMANDE',
      notes: 'Semelles test prototype',
      createdAt: now,
      updatedAt: now
    },

    // Besoins non commandés (Statut DEMANDE, groupOrderId = null)
    {
      memberId: alexandre.id,
      groupOrderId: null,
      filamentType: 'PLA Galaxy',
      format: 'RECHARGE',
      colorName: 'Violet Nébuleuse',
      colorHex: '#4A0E4E',
      quantity: 2,
      estimatedUnitPrice: 18.99,
      actualUnitPrice: null,
      status: 'DEMANDE',
      notes: 'Prochaine commande pour luminaires',
      createdAt: now,
      updatedAt: now
    },
    {
      memberId: camille.id,
      groupOrderId: null,
      filamentType: 'Support Filament',
      format: 'BOBINE',
      colorName: 'Blanc PVA',
      colorHex: '#F0F0F0',
      quantity: 1,
      estimatedUnitPrice: 29.99,
      actualUnitPrice: null,
      status: 'DEMANDE',
      notes: 'Support soluble à l\'eau pour impression complexe',
      createdAt: now,
      updatedAt: now
    }
  ]).run()

  // 5. Règlements de remboursement (Wero et virement)
  db.insert(settlements).values([
    // Lucas rembourse 20.00 € à Thomas via WERO pour la commande 1
    {
      groupOrderId: order1.id,
      payerId: lucas.id,
      receiverId: thomas.id,
      amount: 17.99,
      paymentMethod: 'WERO',
      settledAt: '2026-09-12',
      notes: 'Remboursement solde commande #FR24098112 via Wero',
      createdAt: now
    },
    // Camille verse un acompte de 20.00 € à Sophie par virement bancaire pour la commande 2
    {
      groupOrderId: order2.id,
      payerId: camille.id,
      receiverId: sophie.id,
      amount: 20.00,
      paymentMethod: 'VIREMENT',
      settledAt: '2026-09-16',
      notes: 'Acompte bobine TPU',
      createdAt: now
    }
  ]).run()

  console.log('✅ Jeu de données exhaustif injecté avec succès :')
  console.log('   - 5 membres avec coordonnées complètes')
  console.log('   - 2 commandes groupées (1 Équitable, 1 Pro-rata)')
  console.log('   - 8 besoins (DEMANDE, COMMANDE, RECU, DISTRIBUE)')
  console.log('   - Règlements via Wero et Virement bancaire')
}

if (process.argv[1]?.endsWith('full.ts')) {
  seedFull()
}
