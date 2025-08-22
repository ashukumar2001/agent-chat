import { router } from "../trpc";
import { chats } from "./chats";
import { greet } from "./greet";
import { userSettings } from "./userSettings";

export const appRouter = router({
  greet,
  chats,
  userSettings,
});


export type AppRouter = typeof appRouter;
