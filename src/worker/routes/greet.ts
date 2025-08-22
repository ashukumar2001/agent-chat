import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export const greet = router({
  hello: publicProcedure
    .input(z.string().optional())
    .query(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return `Hello ${input ?? "World"}!`;
    }),
});
