/// One-time (and idempotent) ops script: creates the app_user role if it
/// doesn't exist, applies 001_helper_functions.sql and 002_policies.sql,
/// then verifies app_user can actually connect through the pooler before
/// writing anything back to .env.local. Run via `npm run db:rls`.
///
/// Never logs the generated password — writes it straight to .env.local.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Client } from "pg";

const ENV_PATH = path.join(__dirname, "..", "..", ".env.local");
const RLS_DIR = __dirname;

function readEnvVar(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`^${key}="([^"]*)"$`, "m"));
  return match?.[1];
}

function writeEnvVar(content: string, key: string, value: string): string {
  const line = `${key}="${value}"`;
  if (new RegExp(`^${key}=".*"$`, "m").test(content)) {
    return content.replace(new RegExp(`^${key}=".*"$`, "m"), line);
  }
  return `${content.trimEnd()}\n${line}\n`;
}

async function main() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) throw new Error("DIRECT_URL is not set");

  const admin = new Client({ connectionString: directUrl });
  await admin.connect();

  // Always rotate the password (idempotent create-or-reset), so a
  // re-run always ends with a password we actually know — the role can
  // exist from a prior run that errored out before persisting it anywhere.
  const appUserPassword = crypto.randomBytes(24).toString("base64url");

  try {
    const { rows } = await admin.query("select 1 from pg_roles where rolname = 'app_user'");

    if (rows.length === 0) {
      await admin.query(`create role app_user with login password '${appUserPassword}'`);
      await admin.query("grant usage on schema public to app_user");
      await admin.query(
        "grant select, insert, update, delete on all tables in schema public to app_user",
      );
      await admin.query(
        "alter default privileges in schema public grant select, insert, update, delete on tables to app_user",
      );
      console.log("Created app_user role and granted table privileges.");
    } else {
      await admin.query(`alter role app_user with password '${appUserPassword}'`);
      console.log("app_user role already existed — rotated its password.");
    }

    for (const file of ["001_helper_functions.sql", "002_policies.sql"]) {
      const sql = fs.readFileSync(path.join(RLS_DIR, file), "utf8");
      await admin.query(sql);
      console.log(`Applied ${file}`);
    }
  } finally {
    await admin.end();
  }

  // Verify app_user can actually connect through the pooler before writing
  // anything to .env.local — the dotted "role.project-ref" username
  // convention Supabase's pooler expects for the default postgres role
  // isn't guaranteed to work identically for a custom role.
  const envContent = fs.readFileSync(ENV_PATH, "utf8");
  const currentDatabaseUrl = readEnvVar(envContent, "DATABASE_URL");
  if (!currentDatabaseUrl) throw new Error("DATABASE_URL not found in .env.local");

  const parsed = new URL(currentDatabaseUrl);
  const poolerHost = parsed.hostname;
  const poolerPort = parsed.port;
  const projectRef = parsed.username.split(".")[1];

  const candidateUrl = `postgresql://app_user.${projectRef}:${appUserPassword}@${poolerHost}:${poolerPort}/postgres?pgbouncer=true`;

  const test = new Client({ connectionString: candidateUrl });
  try {
    await test.connect();
    await test.query("select 1");
    await test.end();

    const updated = writeEnvVar(envContent, "DATABASE_URL", candidateUrl);
    fs.writeFileSync(ENV_PATH, updated);
    console.log(
      "app_user connects successfully through the pooler — DATABASE_URL in .env.local now points to app_user (RLS is enforced at runtime from now on). DIRECT_URL is left as the postgres superuser, since migrations need DDL rights app_user doesn't have.",
    );
  } catch (err) {
    console.log(
      "app_user was created, but the pooler connection test failed — DATABASE_URL was left unchanged (still the postgres superuser, so RLS policies exist but aren't enforced yet). Error:",
      err instanceof Error ? err.message : err,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
