import { resolve } from "path";
import { defineConfig } from "vitest/config";

const alias = { "@": resolve(__dirname, "src/renderer/src") };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      // Fast tests with no network: `npm test`
      { resolve: { alias }, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" } },
      // Talks to a local Supabase (`npm run db:start` first): `npm run test:db`
      { resolve: { alias }, test: { name: "db", include: ["tests/db/**/*.test.ts"], environment: "node", testTimeout: 30000, fileParallelism: false } }
    ]
  }
});
