import { defineConfig } from "vitest/config";

// Las pruebas comparten un fixture (usuarios + gira) creado una vez y
// pegan contra una base remota: secuenciales y con timeout holgado.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
