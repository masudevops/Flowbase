/// One-time (idempotent) data migration: assigns board_id to every
/// existing card_types row now that CardType is board-scoped instead of
/// org-scoped (see the CardType model comment in schema.prisma for why).
///
/// For each card type, looks at which board(s) its cards actually live
/// on:
///   - exactly one board  -> assign that board directly, same row
///   - zero boards (unused) -> assign the org's earliest-created board
///     (deterministic fallback for orphaned/never-used types)
///   - two or more boards -> the real "leaked across boards" case this
///     whole migration exists for: keep the original row on the
///     earliest of those boards, and for every other board, create a
///     new card_types row (same name/color) scoped to that board, then
///     re-point that board's cards at the new row
///
/// Safe to re-run: any row that already has board_id set is skipped.
/// Run via `npm run db:backfill-cardtype-board`.
import { Client } from "pg";
import { randomUUID } from "node:crypto";

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  try {
    const { rows: cardTypes } = await client.query(`
      select id, organization_id, board_id, name, color, is_default, created_at
      from card_types
      order by created_at asc
    `);

    let assignedDirect = 0;
    let assignedFallback = 0;
    let split = 0;
    let skipped = 0;

    for (const ct of cardTypes) {
      if (ct.board_id) {
        skipped++;
        continue;
      }

      const { rows: boardUsage } = await client.query(
        `
        select b.id, b.created_at
        from boards b
        where b.id in (select distinct board_id from cards where card_type_id = $1)
        order by b.created_at asc
        `,
        [ct.id],
      );

      if (boardUsage.length === 1) {
        await client.query(`update card_types set board_id = $1 where id = $2`, [
          boardUsage[0].id,
          ct.id,
        ]);
        assignedDirect++;
        continue;
      }

      if (boardUsage.length === 0) {
        const { rows: orgBoards } = await client.query(
          `select id from boards where organization_id = $1 order by created_at asc limit 1`,
          [ct.organization_id],
        );
        if (orgBoards.length === 0) {
          throw new Error(
            `card_type ${ct.id} ("${ct.name}") is unused and its org (${ct.organization_id}) has no boards — nothing to assign it to. Investigate before re-running.`,
          );
        }
        await client.query(`update card_types set board_id = $1 where id = $2`, [
          orgBoards[0].id,
          ct.id,
        ]);
        assignedFallback++;
        continue;
      }

      // Used on 2+ boards: keep this row on the earliest board, split the rest.
      const [primary, ...rest] = boardUsage;
      await client.query(`update card_types set board_id = $1 where id = $2`, [
        primary.id,
        ct.id,
      ]);

      for (const board of rest) {
        const newId = randomUUID();
        await client.query(
          `insert into card_types (id, organization_id, board_id, name, color, is_default, created_at)
           values ($1, $2, $3, $4, $5, $6, now())`,
          [newId, ct.organization_id, board.id, ct.name, ct.color, ct.is_default],
        );
        await client.query(
          `update cards set card_type_id = $1 where card_type_id = $2 and board_id = $3`,
          [newId, ct.id, board.id],
        );
      }
      split++;
    }

    console.log(
      `Backfill complete: ${assignedDirect} assigned directly, ${assignedFallback} assigned via org-fallback, ${split} split across boards, ${skipped} already had board_id.`,
    );

    const { rows: stillNull } = await client.query(
      `select count(*) from card_types where board_id is null`,
    );
    if (Number(stillNull[0].count) > 0) {
      throw new Error(
        `${stillNull[0].count} card_types rows still have a null board_id after backfill — do not proceed to the NOT NULL migration until this is resolved.`,
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
