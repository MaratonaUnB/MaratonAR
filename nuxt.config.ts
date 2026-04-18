// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('a-')
    }
  },
  app: {
    head: {
      title: 'Bottons AR - Scan Your Style',
      script: []
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  }
})
