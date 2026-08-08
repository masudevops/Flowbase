/// One-off dev-only cleanup: drops the tables/enums/migration-tracking
/// table created by the (now-deleted) camelCase-column migration, so a
/// fresh `prisma migrate dev --name init` can regenerate them with the
/// corrected snake_case column mapping. Safe only because this database
/// has no real data yet. Not wired into any npm script — run directly
/// with tsx if ever needed again.
import { Client } from "pg";

const TABLES = [
  "audit_logs",
  "checklist_items",
  "comments",
  "card_labels",
  "cards",
  "labels",
  "card_types",
  "columns",
  "boards",
  "workspace_module_settings",
  "invites",
  "memberships",
  "users",
  "organizations",
  "_prisma_migrations",
];

const ENUMS = ["AuditAction", "ModuleKey", "Priority", "MembershipStatus", "MembershipRole"];

async function main() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) throw new Error("DIRECT_URL is not set");

  const client = new Client({ connectionString: directUrl });
  await client.connect();

  try {
    for (const table of TABLES) {
      await client.query(`drop table if exists "${table}" cascade`);
    }
    for (const enumName of ENUMS) {
      await client.query(`drop type if exists "${enumName}" cascade`);
    }
    console.log("Dropped all Flowbase tables and enums.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
