import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    // `api/` is its own npm project (its own vitest run via `npm test` in
    // api/) — exclude it here so the root config doesn't try to execute
    // its tests against the frontend's dependency tree.
    exclude: ["**/node_modules/**", "api/**"],
  },
});
