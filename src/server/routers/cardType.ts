import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listCardTypesSchema,
  createCardTypeSchema,
  updateCardTypeSchema,
  deleteCardTypeSchema,
} from "@/schemas/cardType.schema";

function isUniqueNameViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export const cardTypeRouter = router({
  list: protectedProcedure.input(listCardTypesSchema).query(({ ctx, input }) =>
    ctx.db.cardType.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: "asc" },
    }),
  ),

  create: protectedProcedure.input(createCardTypeSchema).mutation(async ({ ctx, input }) => {
    try {
      return await ctx.db.cardType.create({
        data: { organizationId: input.organizationId, name: input.name, color: input.color },
      });
    } catch (err) {
      if (isUniqueNameViolation(err)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A card type with that name already exists." });
      }
      throw err;
    }
  }),

  update: protectedProcedure.input(updateCardTypeSchema).mutation(async ({ ctx, input }) => {
    const { cardTypeId, ...fields } = input;
    const cardType = await ctx.db.cardType.findUnique({ where: { id: cardTypeId } });
    if (!cardType) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    try {
      return await ctx.db.cardType.update({ where: { id: cardTypeId }, data: fields });
    } catch (err) {
      if (isUniqueNameViolation(err)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A card type with that name already exists." });
      }
      throw err;
    }
  }),

  delete: protectedProcedure.input(deleteCardTypeSchema).mutation(async ({ ctx, input }) => {
    const cardType = await ctx.db.cardType.findUnique({ where: { id: input.cardTypeId } });
    if (!cardType) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    // Card.cardTypeId is onDelete: SetNull — deleting a type just clears
    // it off any cards that had it, no blocking needed.
    await ctx.db.cardType.delete({ where: { id: input.cardTypeId } });
    return { ok: true };
  }),
});
