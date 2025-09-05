// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  modules: ["@nuxt/eslint", "@nuxt/test-utils", "@nuxt/ui", "@vueuse/nuxt"],
  css: ["~/assets/css/main.css"],
});
