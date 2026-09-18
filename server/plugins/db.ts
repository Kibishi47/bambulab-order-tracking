import { getDatabase } from '../database'
import { seedDatabase } from '../database/seed'

export default defineNitroPlugin(() => {
  try {
    // Strictly initialize SQLite tables/schema
    getDatabase()
    console.log('✅ SQLite database schema initialized and ready.')

    // Zero seeding in production: only run seed if explicitly requested in non-production
    if (process.env.NODE_ENV !== 'production' && process.env.RUN_SEED === 'true') {
      console.log('🌱 RUN_SEED=true détecté en environnement de développement: application du seed.')
      seedDatabase()
    }
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error)
  }
})
