import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "hono";
import { auth } from "./lib/auth";
export const createContext = async (
    c: Context<{ Bindings: Env }, "/trpc/*">
) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return ({
        session,
        workerContext: c,
    })
};
const t = initTRPC.context<Awaited<ReturnType<typeof createContext>>>().create();
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Please sign in to continue",
        })
    }
    return next({
        ctx: {
            ...ctx,
            session: ctx.session
        }
    })
})
