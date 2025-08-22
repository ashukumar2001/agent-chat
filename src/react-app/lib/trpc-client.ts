import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../worker/routes";
import { QueryClient } from "@tanstack/react-query";

export const trpcClient = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: "/trpc",
        }),
    ],
});
export const queryClient = new QueryClient();
export const trpc = createTRPCOptionsProxy<AppRouter>({
    client: trpcClient,
    queryClient,
});
