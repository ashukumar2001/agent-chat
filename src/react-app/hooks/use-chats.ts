import { trpc } from "@/lib/trpc-client";
import { useQuery } from "@tanstack/react-query";

export function useChats(userId?: string) {
  const { data: chats, isLoading } = useQuery(
    trpc.chats.chats.queryOptions(undefined, { enabled: !!userId })
  );

  // Return empty array when user is logged out (userId is null/undefined)
  const processedChats = userId ? chats : [];

  return {
    chats: processedChats,
    isLoading,
  };
}
