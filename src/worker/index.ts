export { ChatAgent } from "./agents/chat-agent";
export { UserSettings } from "./durable_objects/user-settings";
import { trpcServer } from "@hono/trpc-server";
import { logger } from "hono/logger";
import { Hono } from "hono";
import { createContext } from "./trpc";
import { appRouter } from "./routes";
import { routeAgentRequest } from "agents";
import { auth } from "./lib/auth";
import { agentsMiddleware } from "hono-agents";
const app = new Hono<{ Bindings: Env }>();
app.use("*", logger());
app.use(
  "*",
  agentsMiddleware({
    options: {
      async onBeforeConnect(req) {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) return new Response("Unauthorized", { status: 401 });
      },
      prefix: "agents",
    },
    onError: (error) => console.error(error),
  })
);
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));
app.get("/api/health", (c) => c.json({ status: true }, 200));
app.use("/trpc/*", async (c, next) =>
  trpcServer({
    router: appRouter,
    createContext: () => createContext(c),
  })(c, next)
);
app.get("/agents/**", async (c) => {
  return (
    (await routeAgentRequest(c.req.raw, c.env)) ||
    new Response("Not found", { status: 404 })
  );
});

export default app;
