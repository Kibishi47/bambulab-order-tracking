import { getDatabase } from '../index'
import { members } from '../schema'
import { cleanDatabase } from './clean'

export function seedMinimal() {
  cleanDatabase()

  const { db } = getDatabase()
  const now = new Date().toISOString()

  console.log('🌱 Injection du jeu de données minimal...')

  db.insert(members).values([
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
    }
  ]).run()

  console.log('✅ Jeu de données minimal injecté (3 membres, 0 besoin, 0 commande).')
}

if (process.argv[1]?.endsWith('minimal.ts')) {
  seedMinimal()
}
