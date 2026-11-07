import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./lib/auth";
import { z } from "zod";
import { getChapterAudio } from "./chapterAudio";
import { searchTerms, getTermBySlug, getRelatedTerms } from "./elasticsearch";
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

  terms: router({
    search: publicProcedure
      .input(
        z.object({
          query: z.string().trim().max(100).default(""),
          category: z.string().optional(),
          limit: z.number().int().min(1).max(50).default(16),
        })
      )
      .query(({ input }) => searchTerms(input)),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1) }))
      .query(({ input }) => getTermBySlug(input.slug)),

    related: publicProcedure
      .input(
        z.object({
          term: z.string(),
          slug: z.string(),
          tags: z.array(z.string()).default([]),
          limit: z.number().int().min(1).max(10).default(3),
        })
      )
      .query(({ input }) => getRelatedTerms(input, input.limit)),
  }),
});

export type AppRouter = typeof appRouter;
