import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { db } from "../db/db";
import { chats as chatsTable } from "../db/schema";
import { and, eq, desc } from "drizzle-orm";

export const chats = router({
  chats: protectedProcedure.query(async ({ ctx }) => {
    const results = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.userId, ctx.session?.user.id))
      .orderBy(desc(chatsTable.updatedAt));
    return results;
  }),
  createNewChat: protectedProcedure
    .input(
      z.object({
        model: z.string().optional(),
        name: z.string().default("New Chat"),
        id: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const newChat = await db
        .insert(chatsTable)
        .values({
          id: input.id || crypto.randomUUID(),
          userId: ctx.session?.user.id,
          model: input.model || "",
          name: input.name,
        })
        .returning();
      return newChat[0];
    }),
  updateChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string({ error: "Chat ID is required" }),
        model: z.string().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const updatedChats = await db
        .update(chatsTable)
        .set(input)
        .where(
          and(
            eq(chatsTable.id, input.chatId),
            eq(chatsTable.userId, ctx.session?.user.id)
          )
        )
        .returning();
      return updatedChats[0];
    }),
  deleteChat: protectedProcedure
    .input(
      z.object({
        chatId: z.string({ error: "Chat ID is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const response = await db
        .delete(chatsTable)
        .where(
          and(
            eq(chatsTable.id, input.chatId),
            eq(chatsTable.userId, ctx.session?.user.id)
          )
        );

      if (response.success) {
        try {
          const doId = ctx.workerContext.env.ChatAgent.idFromName(
            `${ctx.session?.user.id}:${input.chatId}`
          );
          const doStub = ctx.workerContext.env.ChatAgent.get(doId);
          await doStub.destroy();
        } catch (error) {
          console.error("Error destroying Durable Object:", error);
        }
      }

      return { success: response.success, error: response.error };
    }),
  chatById: protectedProcedure
    .input(
      z.object({
        chatId: z.string({ error: "Chat ID is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const chat = await db
        .select()
        .from(chatsTable)
        .where(
          and(
            eq(chatsTable.id, input.chatId),
            eq(chatsTable.userId, ctx.session?.user.id)
          )
        );
      return chat[0];
    }),
});
