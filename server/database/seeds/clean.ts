import { getDatabase } from '../index'
import { settlements, filamentDemands, groupOrders, members } from '../schema'

export function cleanDatabase() {
  const { db, sqlite } = getDatabase()
  console.log('🧹 Nettoyage complet des tables...')

  sqlite.transaction(() => {
    db.delete(settlements).run()
    db.delete(filamentDemands).run()
    db.delete(groupOrders).run()
    db.delete(members).run()
    try {
      sqlite.exec("DELETE FROM sqlite_sequence WHERE name IN ('settlements', 'filament_demands', 'group_orders', 'members');")
    } catch {
      // Ignored if sqlite_sequence does not exist yet
    }
  })()

  console.log('✅ Toutes les tables ont été vidées avec succès.')
}

if (process.argv[1]?.endsWith('clean.ts')) {
  cleanDatabase()
}
