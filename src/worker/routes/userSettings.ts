import z from "zod";
import { protectedProcedure, router } from "../trpc";
import { decryptString, encryptString } from "../lib/crypto";

export const userSettings = router({
    getUserApiKeys: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session?.user.id;
        const doId = ctx.workerContext.env.UserSettings.idFromName(userId);
        const stub = ctx.workerContext.env.UserSettings.get(doId);
        const encryptedUserApiKeys = await stub.getUserApiKeys();
        const keyString = ctx.workerContext.env.DATA_ENCRYPTION_KEY;
        const decryptedEntries = await Promise.all(
            Object.entries(encryptedUserApiKeys).map(async ([provider, value]) => {
                try {
                    const decrypted = await decryptString(value as string, keyString);
                    return [provider, decrypted] as const;
                } catch {
                    return [provider, ""] as const;
                }
            })
        );
        return Object.fromEntries(decryptedEntries);
    }),
    setUserApiKey: protectedProcedure.input(z.object({
        key: z.string(),
        provider: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user.id;
        const doId = ctx.workerContext.env.UserSettings.idFromName(userId);
        const stub = ctx.workerContext.env.UserSettings.get(doId);
        const keyString = ctx.workerContext.env.DATA_ENCRYPTION_KEY;
        const encrypted = await encryptString(input.key, keyString);
        const userKeys = await stub.addOrUpdateUserApiKey(input.provider, encrypted);

        return {
            success: true,
            data: userKeys,
        };
    }),
    deleteUserApiKey: protectedProcedure.input(z.object({
        provider: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const userId = ctx.session?.user.id;
        const doId = ctx.workerContext.env.UserSettings.idFromName(userId);
        const stub = ctx.workerContext.env.UserSettings.get(doId);
        const userKeys = await stub.removeUserApiKey(input.provider);
        return {
            success: true,
            data: userKeys,
        };
    })
});