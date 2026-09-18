import { getDatabase } from './index'

console.log('🔄 Initialisation du schéma SQLite...')
const { sqlite } = getDatabase()
console.log('✅ Base de données locale prête et à jour.')
process.exit(0)
