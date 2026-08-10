import { generateKeyBetween } from "fractional-indexing";
import { TRPCError } from "@trpc/server";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import {
  listCustomFieldDefinitionsSchema,
  createCustomFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  deleteCustomFieldDefinitionSchema,
  setCustomFieldValueSchema,
  listCustomFieldValuesSchema,
  type formulaSchema,
} from "@/schemas/customField.schema";
import { evaluateFormula, type Formula } from "@/lib/formula";

async function assertValidFormula(
  db: Prisma.TransactionClient,
  cardTypeId: string,
  formula: z.infer<typeof formulaSchema>,
) {
  const referencedIds = [formula.leftFieldId, ...(formula.right.type === "field" ? [formula.right.fieldId] : [])];
  const referenced = await db.customFieldDefinition.findMany({ where: { id: { in: referencedIds } } });

  if (referenced.length !== referencedIds.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A formula referenced a field that doesn't exist." });
  }
  for (const field of referenced) {
    if (field.cardTypeId !== cardTypeId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A formula can only reference fields on the same card type.",
      });
    }
    if (field.fieldType !== "NUMBER") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A formula can only reference Number fields." });
    }
  }
}

export const customFieldRouter = router({
  listDefinitions: protectedProcedure
    .input(listCustomFieldDefinitionsSchema)
    .query(({ ctx, input }) =>
      ctx.db.customFieldDefinition.findMany({
        where: { cardTypeId: input.cardTypeId },
        orderBy: { position: "asc" },
      }),
    ),

  createDefinition: protectedProcedure
    .input(createCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      if (input.fieldType === "FORMULA" && input.formula) {
        await assertValidFormula(ctx.db, input.cardTypeId, input.formula);
      }

      const last = await ctx.db.customFieldDefinition.findFirst({
        where: { cardTypeId: input.cardTypeId },
        orderBy: { position: "desc" },
      });

      return ctx.db.customFieldDefinition.create({
        data: {
          organizationId: input.organizationId,
          cardTypeId: input.cardTypeId,
          name: input.name,
          fieldType: input.fieldType,
          options: input.fieldType === "SELECT" ? input.options : undefined,
          formula: input.fieldType === "FORMULA" ? input.formula : undefined,
          position: generateKeyBetween(last?.position ?? null, null),
        },
      });
    }),

  updateDefinition: protectedProcedure
    .input(updateCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      const { fieldDefinitionId, ...fields } = input;
      const definition = await ctx.db.customFieldDefinition.findUnique({
        where: { id: fieldDefinitionId },
      });
      if (!definition) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return ctx.db.customFieldDefinition.update({
        where: { id: fieldDefinitionId },
        data: fields,
      });
    }),

  deleteDefinition: protectedProcedure
    .input(deleteCustomFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      const definition = await ctx.db.customFieldDefinition.findUnique({
        where: { id: input.fieldDefinitionId },
      });
      if (!definition) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // CustomFieldValue rows cascade-delete with the definition (see
      // schema) — a field's recorded values don't need to outlive it.
      await ctx.db.customFieldDefinition.delete({ where: { id: input.fieldDefinitionId } });
      return { ok: true };
    }),

  // Returns both real stored values AND computed FORMULA values in the
  // same { fieldDefinitionId, value } shape — a formula field has no row
  // in CustomFieldValue (nothing to store, see Formula's doc comment in
  // schema.prisma), so its value only exists as a query-time computation
  // here, merged in alongside the real ones.
  listValues: protectedProcedure.input(listCustomFieldValuesSchema).query(async ({ ctx, input }) => {
    const [card, storedValues] = await Promise.all([
      ctx.db.card.findUnique({ where: { id: input.cardId }, select: { cardTypeId: true } }),
      ctx.db.customFieldValue.findMany({ where: { cardId: input.cardId } }),
    ]);

    const result = storedValues.map((v) => ({ fieldDefinitionId: v.fieldDefinitionId, value: v.value }));
    if (!card?.cardTypeId) return result;

    const definitions = await ctx.db.customFieldDefinition.findMany({
      where: { cardTypeId: card.cardTypeId, fieldType: "FORMULA" },
    });
    if (definitions.length === 0) return result;

    const valuesByFieldId = new Map(storedValues.map((v) => [v.fieldDefinitionId, v.value]));
    for (const def of definitions) {
      if (!def.formula) continue;
      const computed = evaluateFormula(def.formula as unknown as Formula, valuesByFieldId);
      result.push({ fieldDefinitionId: def.id, value: computed === null ? null : String(computed) });
    }
    return result;
  }),

  setValue: protectedProcedure.input(setCustomFieldValueSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    const definition = await ctx.db.customFieldDefinition.findUnique({
      where: { id: input.fieldDefinitionId },
    });
    if (!definition) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    if (definition.fieldType === "FORMULA") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A formula field's value is computed, not set." });
    }

    if (input.value === null || input.value === "") {
      await ctx.db.customFieldValue.deleteMany({
        where: { cardId: input.cardId, fieldDefinitionId: input.fieldDefinitionId },
      });
      return { ok: true };
    }

    return ctx.db.customFieldValue.upsert({
      where: {
        cardId_fieldDefinitionId: { cardId: input.cardId, fieldDefinitionId: input.fieldDefinitionId },
      },
      create: {
        organizationId: card.organizationId,
        cardId: input.cardId,
        fieldDefinitionId: input.fieldDefinitionId,
        value: input.value,
      },
      update: { value: input.value },
    });
  }),
});
