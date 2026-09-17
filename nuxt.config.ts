// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  future: {
    compatibilityVersion: 3
  },
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  runtimeConfig: {
    databasePath: process.env.DATABASE_PATH || './data/bambulab.db'
  }
})
