import { trpc } from "@/lib/trpc-client";
import { Chat } from "@/types/misc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function useChatUtils() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chats = queryClient.getQueryData<Chat[]>(trpc.chats.chats.queryKey());
  const createNewChatMutation = useMutation(
    trpc.chats.createNewChat.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.chats.chats.queryKey(),
        });
        // Seed the chatById cache immediately so a page that navigates to
        // the new chat right away never sees a stale "chat missing" state.
        if (data) {
          queryClient.setQueryData(
            trpc.chats.chatById.queryKey({ chatId: data.id }),
            (old: Chat | undefined) => old ?? data
          );
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateChatMutation = useMutation(
    trpc.chats.updateChat.mutationOptions({
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.chats.chats.queryKey(),
        });
        if (data) {
          queryClient.setQueryData(
            trpc.chats.chatById.queryKey({ chatId: variables.chatId }),
            (old: Chat | undefined) => (old ? { ...old, ...data } : data)
          );
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const deleteChatMutation = useMutation(
    trpc.chats.deleteChat.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.chats.chats.queryKey(),
        });
        navigate({ to: "/chat", replace: true });
      },
    })
  );

  const getChatById = (id: string) => {
    return chats?.find((chat) => chat.id === id);
  };

  return {
    createNewChatMutation,
    updateChatMutation,
    deleteChatMutation,
    getChatById,
  };
}
