import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
export const db = drizzle(env.EDDY_AI_CHAT_DB, { schema });
