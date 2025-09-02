import dotenv from "dotenv";
import { type Config } from "drizzle-kit";
dotenv.config({ path: process.env.CLOUDFLARE_ENV === "prod" ? ".dev.vars.prod" : ".dev.vars.dev" });

const getDbConfiguration = () => {
    return {
        driver: 'd1-http',
        dbCredentials: {
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
            token: process.env.CLOUDFLARE_D1_TOKEN!
        }
    }
};
const dbConfig = getDbConfiguration();
export default {
    out: "./src/worker/drizzle",
    schema: "./src/worker/db/schema.ts",
    dialect: "sqlite",
    ...dbConfig
} as Config
