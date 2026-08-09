/// One-time (and idempotent) ops script: creates the app_user role if it
/// doesn't exist, applies 001_helper_functions.sql and 002_policies.sql,
/// then makes sure DATABASE_URL in .env.local points to a *working*
/// app_user connection. Run via `npm run db:rls`.
///
/// Never logs the generated password — writes it straight to .env.local.
///
/// IMPORTANT: this only rotates app_user's password when necessary (role
/// doesn't exist yet, or the existing DATABASE_URL no longer connects).
/// If DATABASE_URL already points to a working app_user connection, this
/// is a no-op on the password — rotating unconditionally on every run
/// invalidates whatever's currently deployed (e.g. on Vercel, which has
/// its own separate copy of DATABASE_URL that this script can't reach),
/// breaking production the moment a rotation succeeds locally but isn't
/// copied over everywhere else in time.
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

async function canConnect(connectionString: string): Promise<boolean> {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query("select 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) throw new Error("DIRECT_URL is not set");

  const envContent = fs.readFileSync(ENV_PATH, "utf8");
  const currentDatabaseUrl = readEnvVar(envContent, "DATABASE_URL");
  if (!currentDatabaseUrl) throw new Error("DATABASE_URL not found in .env.local");

  const parsed = new URL(currentDatabaseUrl);
  const poolerHost = parsed.hostname;
  const poolerPort = parsed.port;
  const currentlyPointsAtAppUser = parsed.username.startsWith("app_user.");
  const projectRef = currentlyPointsAtAppUser
    ? parsed.username.split(".")[1]
    : parsed.username.split(".")[1]; // same "<role>.<project-ref>" convention either way

  const admin = new Client({ connectionString: directUrl });
  await admin.connect();

  try {
    const { rows } = await admin.query("select 1 from pg_roles where rolname = 'app_user'");
    const roleExists = rows.length > 0;

    let needsNewPassword = !roleExists;
    if (roleExists && currentlyPointsAtAppUser) {
      const stillWorks = await canConnect(currentDatabaseUrl);
      if (!stillWorks) {
        console.log("app_user role exists but the current DATABASE_URL no longer connects — rotating.");
        needsNewPassword = true;
      } else {
        console.log("app_user role exists and DATABASE_URL already works — leaving its password alone.");
      }
    } else if (roleExists) {
      // Role exists but DATABASE_URL isn't pointed at it yet (still the
      // superuser) — need a password to switch over, but this doesn't
      // invalidate anything currently deployed since nothing points at
      // app_user yet.
      needsNewPassword = true;
    }

    let appUserPassword: string | null = null;

    if (needsNewPassword) {
      appUserPassword = crypto.randomBytes(24).toString("base64url");
      if (!roleExists) {
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
        console.log("Rotated app_user's password.");
      }
    }

    for (const file of [
      "001_helper_functions.sql",
      "002_policies.sql",
      "003_realtime.sql",
      "004_storage.sql",
      "005_invite_lookup.sql",
      "006_epics_notifications_automations.sql",
      "007_workflow_templates.sql",
      "008_card_assignees.sql",
    ]) {
      const sql = fs.readFileSync(path.join(RLS_DIR, file), "utf8");
      await admin.query(sql);
      console.log(`Applied ${file}`);
    }

    // Must run after 001 (which creates the app schema). EXECUTE on a
    // function isn't enough on its own — Postgres also requires USAGE on
    // the schema the function lives in, granted separately. Idempotent,
    // so safe to re-run unconditionally.
    await admin.query("grant usage on schema app to app_user");
    console.log("Granted USAGE on schema app to app_user.");

    if (!appUserPassword) {
      return; // DATABASE_URL already correct and working — nothing more to do.
    }

    const candidateUrl = `postgresql://app_user.${projectRef}:${appUserPassword}@${poolerHost}:${poolerPort}/postgres?pgbouncer=true`;

    if (await canConnect(candidateUrl)) {
      const updated = writeEnvVar(envContent, "DATABASE_URL", candidateUrl);
      fs.writeFileSync(ENV_PATH, updated);
      console.log(
        "app_user connects successfully through the pooler — DATABASE_URL in .env.local now points to app_user. " +
          "If DATABASE_URL is also set anywhere else (e.g. Vercel), update it there too with the same value now, " +
          "or RLS will start rejecting that deployment's connection.",
      );
    } else {
      console.log(
        "app_user was created/rotated, but the pooler connection test failed. DATABASE_URL was left unchanged " +
          "in .env.local. If it was already pointing at app_user, IT IS NOW BROKEN — re-run this script to retry.",
      );
    }
  } finally {
    await admin.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
