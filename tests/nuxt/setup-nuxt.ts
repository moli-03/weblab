import { setup, type TestOptions } from "@nuxt/test-utils";

export const setupNuxt = (options?: Partial<TestOptions>) => {
  return setup({
    server: true,
    build: false,
    buildDir: ".output",
    nuxtConfig: {
      nitro: {
        output: {
          dir: ".output",
        },
      },
    },
    ...options,
  });
};
