import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listContactsSchema,
  createContactSchema,
  updateContactSchema,
  deleteContactSchema,
} from "@/schemas/contact.schema";

export const contactRouter = router({
  list: protectedProcedure.input(listContactsSchema).query(({ ctx, input }) =>
    ctx.db.contact.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { name: "asc" },
    }),
  ),

  create: protectedProcedure.input(createContactSchema).mutation(({ ctx, input }) =>
    ctx.db.contact.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
    }),
  ),

  update: protectedProcedure.input(updateContactSchema).mutation(async ({ ctx, input }) => {
    const { contactId, ...fields } = input;
    const contact = await ctx.db.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return ctx.db.contact.update({ where: { id: contactId }, data: fields });
  }),

  delete: protectedProcedure.input(deleteContactSchema).mutation(async ({ ctx, input }) => {
    const contact = await ctx.db.contact.findUnique({ where: { id: input.contactId } });
    if (!contact) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    await ctx.db.contact.delete({ where: { id: input.contactId } });
    return { ok: true };
  }),
});
