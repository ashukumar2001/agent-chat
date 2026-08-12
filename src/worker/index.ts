export { ChatAgent } from "./agents/chat-agent";
export { UserSettings } from "./durable_objects/user-settings";
import { trpcServer } from "@hono/trpc-server";
import { logger } from "hono/logger";
import { Hono } from "hono";
import { createContext } from "./trpc";
import { appRouter } from "./routes";
import { auth } from "./lib/auth";
import { agentsMiddleware } from "hono-agents";
import paymentsApp from "./routes/payments";
import usageApp from "./routes/usage";

const app = new Hono<{ Bindings: Env }>();
app.use("*", logger());
const PARTYKIT_ROOM_HEADER = "x-partykit-room";

const withPartyKitRoom = (req: Request, room: string): Request => {
  if (req.headers.get(PARTYKIT_ROOM_HEADER) === room) return req;
  const headers = new Headers(req.headers);
  headers.set(PARTYKIT_ROOM_HEADER, room);
  return new Request(req, { headers });
};

const assertAgentSession = async (
  req: Request,
  lobbyName: string
): Promise<Response | Request> => {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });
  // The agent name is `${userId}:${chatId}` — the session user must own it.
  const agentUserId = lobbyName.split(":")[0];
  if (!agentUserId || agentUserId !== session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  // PartyServer reads this.name from ctx.id.name. Older local workerd
  // builds leave that unset; the room header is the documented fallback.
  return withPartyKitRoom(req, lobbyName);
};

app.use(
  "*",
  agentsMiddleware({
    options: {
      async onBeforeConnect(req, lobby) {
        return assertAgentSession(req, lobby.name);
      },
      async onBeforeRequest(req, lobby) {
        // Plain HTTP requests (e.g. /agents/**/get-messages) must also be
        // authorized — onBeforeConnect only runs for WebSocket upgrades.
        return assertAgentSession(req, lobby.name);
      },
      prefix: "agents",
    },
    onError: (error) => console.error(error),
  })
);
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));
app.get("/api/health", (c) => c.json({ status: true }, 200));
// Dodo Payments routes
app.route("/api/payments", paymentsApp);
// Usage tracking routes
app.route("/api/usage", usageApp);

app.use("/trpc/*", async (c, next) =>
  trpcServer({
    router: appRouter,
    createContext: () => createContext(c),
  })(c, next)
);

export default app;
