// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
  ],
  unocss: {
    uno: true,
    icons: true
  },
  routeRules: {
    '/**': {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin'
      }
    }
  }
})
