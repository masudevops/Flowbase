import { z } from "zod";

export const listAttachmentsSchema = z.object({
  cardId: z.string(),
});

export const createAttachmentSchema = z.object({
  cardId: z.string(),
  fileName: z.string().trim().min(1).max(255),
  storagePath: z.string().min(1),
  mimeType: z.string().min(1).max(127),
  sizeBytes: z.number().int().positive().max(20 * 1024 * 1024), // 20MB ceiling
});

export const deleteAttachmentSchema = z.object({
  attachmentId: z.string(),
});
