import { router, protectedProcedure } from "../trpc";
import { updateProfileSchema } from "@/schemas/user.schema";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) =>
    ctx.db.user.findUniqueOrThrow({ where: { id: ctx.userId } }),
  ),

  updateProfile: protectedProcedure.input(updateProfileSchema).mutation(({ ctx, input }) =>
    ctx.db.user.update({ where: { id: ctx.userId }, data: { fullName: input.fullName } }),
  ),
});
