import { decryptString } from "./crypto";

export const getUserKey = async (userId: string, providerId: string, env: Env) => {
    const doId = env.UserSettings.idFromName(userId);
    const stub = env.UserSettings.get(doId);
    const userKey = await stub.getUserApiKeyFromProviderId(providerId);
    if (userKey) return await decryptString(userKey, env.DATA_ENCRYPTION_KEY);
    return "";
}