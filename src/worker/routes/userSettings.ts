import z from "zod";
import { protectedProcedure, router } from "../trpc";
import { encryptString } from "../lib/crypto";
const SUGGESTED_PROVIDERS_IDS = [
  "openai",
  "mistral",
  "perplexity",
  "google",
  "anthropic",
  "xai",
  "ollama",
  "openrouter",
];

export const userSettings = router({
  getUserApiKeysStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session?.user.id;
    const doId = ctx.workerContext.env.UserSettings.idFromName(userId);
    const stub = ctx.workerContext.env.UserSettings.get(doId);
    const providerFromUserKeys = await stub.getUserApiKeysStatus();
    const userKeysStatus = SUGGESTED_PROVIDERS_IDS.reduce(
      (acc, provider) => {
        acc[provider] = providerFromUserKeys.includes(provider);
        return acc;
      },
      {} as Record<string, boolean>
    );

    return userKeysStatus;
  }),
  setUserApiKey: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        provider: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      const doId = ctx.workerContext.env.UserSettings.idFromName(userId);
      const stub = ctx.workerContext.env.UserSettings.get(doId);
      const keyString = ctx.workerContext.env.DATA_ENCRYPTION_KEY;
      const encrypted = await encryptString(input.key, keyString);
      await stub.addOrUpdateUserApiKey(input.provider, encrypted);

      return {
        success: true,
      };
    }),
  deleteUserApiKey: protectedProcedure
    .input(
      z.object({
        provider: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.user.id;
      const doId = ctx.workerContext.env.UserSettings.idFromName(userId);
      const stub = ctx.workerContext.env.UserSettings.get(doId);
      await stub.removeUserApiKey(input.provider);
      return {
        success: true,
      };
    }),
});
