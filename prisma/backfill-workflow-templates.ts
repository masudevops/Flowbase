/// One-time (idempotent) data migration: seeds the three built-in
/// workflow templates into every org that already existed before
/// templates became real rows (new orgs get this automatically at
/// creation — see organization.service.ts). Connects via DIRECT_URL
/// (superuser, bypasses RLS) same reasoning as prisma/seed.ts: no
/// logged-in session to satisfy RLS's INSERT checks, and a
/// PrismaClient instance is structurally the same TransactionClient
/// interface seedBuiltInTemplates() already expects.
import { PrismaClient } from "@prisma/client";
import { seedBuiltInTemplates } from "../src/server/services/workflowTemplate.service";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL } },
});

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  for (const org of orgs) {
    await seedBuiltInTemplates(prisma, org.id);
    console.log(`Seeded built-in templates for "${org.name}" (${org.id})`);
  }
  console.log(`Done — ${orgs.length} orgs processed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
