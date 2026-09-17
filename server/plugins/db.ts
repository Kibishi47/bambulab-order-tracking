import { getDatabase, seedDatabaseIfEmpty } from '../database'

export default defineNitroPlugin(() => {
  try {
    getDatabase()
    seedDatabaseIfEmpty()
    console.log('✅ SQLite database initialized and ready.')
  } catch (error) {
    console.error('❌ Failed to initialize SQLite database:', error)
  }
})
