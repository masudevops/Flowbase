import { z } from "zod";

export const listCommentsSchema = z.object({
  cardId: z.string(),
});

export const createCommentSchema = z.object({
  cardId: z.string(),
  body: z.string().trim().min(1).max(5000),
});

export const updateCommentSchema = z.object({
  commentId: z.string(),
  body: z.string().trim().min(1).max(5000),
});

export const deleteCommentSchema = z.object({
  commentId: z.string(),
});
