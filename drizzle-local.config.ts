import { type Config } from "drizzle-kit";
import fs from "node:fs";
import path from "node:path";
const getLocalD1 = () => {
    try {
        const basePath = path.resolve('.wrangler');
        const dbFile = fs
            .readdirSync(basePath, { recursive: true, encoding: 'utf-8' })
            .filter(v => v.endsWith(".sqlite"))
            .map(v => {
                const filePath = path.join(basePath, v);
                return ({
                    path: filePath,
                    mtime: fs.statSync(filePath).mtime.getTime(),
                })
            }).sort((a, b) => b.mtime - a.mtime)

        return dbFile[0]?.path;
    } catch (err) {
        console.error(`Error finding latest sqlite file: ${err}`);
        return undefined;
    }
}
const getDbConfiguration = () => {
    return {
        dbCredentials: {
            url: getLocalD1(),
        }
    }
};
const dbConfig = getDbConfiguration();
console.log(dbConfig);
export default {
    out: "./src/worker/drizzle",
    schema: "./src/worker/db/schema.ts",
    dialect: "sqlite",
    ...dbConfig
} as Config
