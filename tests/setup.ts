for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  if (!process.env[key]) {
    throw new Error(
      `${key} is not set. Run tests via \`npm test\` (which loads .env.local) — these are real integration tests against the dev database, not mocks.`,
    );
  }
}
