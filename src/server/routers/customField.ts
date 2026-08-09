import { generateKeyBetween } from "fractional-indexing";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listCustomFieldDefinitionsSchema,
  createCustomFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  deleteCustomFieldDefinitionSchema,
  setCustomFieldValueSchema,
  listCustomFieldValuesSchema,
} from "@/schemas/customField.schema";

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

  listValues: protectedProcedure.input(listCustomFieldValuesSchema).query(({ ctx, input }) =>
    ctx.db.customFieldValue.findMany({
      where: { cardId: input.cardId },
    }),
  ),

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
