import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth";
import { z } from "zod";
import { getChapterAudio } from "./chapterAudio";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      try {
        await auth.api.signOut({
          headers: fromNodeHeaders(ctx.req.headers),
        });
      } catch (err) {
        console.warn("[Auth] Sign out error:", err);
      }
      return {
        success: true,
      } as const;
    }),
  }),

  chapterAudio: router({
    get: publicProcedure.input(z.object({ slug: z.string().min(1).max(100) })).mutation(async ({ input }) => getChapterAudio(input.slug)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
