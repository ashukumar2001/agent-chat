import { DurableObject } from "cloudflare:workers";

export class UserSettings extends DurableObject<Env> {
    userApiKeys: Map<string, string> = new Map();
    private hasLoadedFromStorage = false;
    private static readonly STORAGE_KEY = "userApiKeys";

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }

    private async ensureLoadedFromStorage() {
        if (this.hasLoadedFromStorage) return;
        const stored = await this.ctx.storage.get<Record<string, string>>(UserSettings.STORAGE_KEY);
        if (stored && typeof stored === "object") {
            this.userApiKeys = new Map(Object.entries(stored));
        }
        this.hasLoadedFromStorage = true;
    }

    async addOrUpdateUserApiKey(providerId: string, apiKey: string) {
        await this.ensureLoadedFromStorage();
        if (!providerId) return Object.fromEntries(this.userApiKeys);
        this.userApiKeys.set(providerId, apiKey);
        await this.ctx.storage.put(UserSettings.STORAGE_KEY, Object.fromEntries(this.userApiKeys));
        return Object.fromEntries(this.userApiKeys);
    }

    async removeUserApiKey(providerId: string) {
        await this.ensureLoadedFromStorage();
        if (!providerId) return Object.fromEntries(this.userApiKeys);
        this.userApiKeys.delete(providerId);
        await this.ctx.storage.put(UserSettings.STORAGE_KEY, Object.fromEntries(this.userApiKeys));
        return Object.fromEntries(this.userApiKeys);
    }

    async getUserApiKeys() {
        await this.ensureLoadedFromStorage();
        if (this.userApiKeys.size === 0) return {} as Record<string, string>;
        return Object.fromEntries(this.userApiKeys);
    }

    async getUserApiKeyFromProviderId(providerId: string) {
        await this.ensureLoadedFromStorage();
        if (this.userApiKeys.size === 0) return "";
        return this.userApiKeys.get(providerId) || "";
    }
}