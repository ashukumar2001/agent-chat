import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { anonymous } from "better-auth/plugins";
import { db } from "../db/db";
import * as schema from "../db/schema";
export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite", schema,
        usePlural: true,
    }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
    },
    plugins: [
        anonymous()
    ]
});
