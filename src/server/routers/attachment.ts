import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  listAttachmentsSchema,
  createAttachmentSchema,
  deleteAttachmentSchema,
} from "@/schemas/attachment.schema";
import { createClient } from "@/lib/supabase/server";

export const attachmentRouter = router({
  list: protectedProcedure.input(listAttachmentsSchema).query(({ ctx, input }) =>
    ctx.db.attachment.findMany({
      where: { cardId: input.cardId },
      include: { uploadedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ),

  create: protectedProcedure.input(createAttachmentSchema).mutation(async ({ ctx, input }) => {
    const card = await ctx.db.card.findUnique({ where: { id: input.cardId } });
    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // The file is already in Storage by the time this runs (the browser
    // uploads directly, governed by storage.objects RLS — see
    // prisma/rls/004_storage.sql) — this just records the metadata.
    return ctx.db.attachment.create({
      data: {
        organizationId: card.organizationId,
        cardId: input.cardId,
        uploadedById: ctx.userId,
        fileName: input.fileName,
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      },
    });
  }),

  delete: protectedProcedure.input(deleteAttachmentSchema).mutation(async ({ ctx, input }) => {
    const attachment = await ctx.db.attachment.findUnique({
      where: { id: input.attachmentId },
    });
    if (!attachment) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // Uses the caller's own session (cookie-based), so this respects the
    // exact same storage.objects RLS policy as the upload — not a
    // service-role bypass.
    const supabase = await createClient();
    await supabase.storage.from("attachments").remove([attachment.storagePath]);

    await ctx.db.attachment.delete({ where: { id: input.attachmentId } });

    return { success: true };
  }),
});
