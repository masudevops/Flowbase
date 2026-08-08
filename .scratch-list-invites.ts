import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const r = await client.query(
    "select id, email, organization_id, created_at from invites order by created_at desc limit 5",
  );
  console.log(r.rows);
  await client.end();
}

main();
