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
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.chats.chats.queryKey(),
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const updateChatMutation = useMutation(
    trpc.chats.updateChat.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.chats.chats.queryKey(),
        });
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
