import { Client } from "pg";

async function main() {
  const email = process.argv[2];
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const { rows } = await client.query("select token from invites where email = $1", [email]);
  console.log(rows[0]?.token ?? "NOT_FOUND");
  await client.end();
}

main();
