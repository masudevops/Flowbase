import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    // These are real integration tests against the live RLS-enforced
    // database (see tests/README.md) — one worker at a time keeps
    // fixture creation/cleanup from racing across test files.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
