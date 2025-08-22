import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const books = router({
  getBooks: publicProcedure.query(async () => {
    return [
      { id: 1, title: "The Book", author: "Author 1" },
      { id: 2, title: "Another Book", author: "Author 2" },
    ];
  }),
  createBook: publicProcedure
    .input(
      z.object({
        title: z.string(),
        author: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Here you would typically save to a database
      return { id: Date.now(), ...input };
    }),
});
