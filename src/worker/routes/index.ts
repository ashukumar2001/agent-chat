import { router } from "../trpc";
import { chats } from "./chats";
import { greet } from "./greet";
import { userSettings } from "./userSettings";
import { payments } from "./payments-trpc";

export const appRouter = router({
  greet,
  chats,
  userSettings,
  payments,
});

export type AppRouter = typeof appRouter;
