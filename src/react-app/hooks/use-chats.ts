import { queryClient, trpc } from "@/lib/trpc-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function useChats(userId?: string) {
    const navigate = useNavigate();
    const { data: chats, isLoading, } = useQuery(
        trpc.chats.chats.queryOptions(undefined, { enabled: !!userId, }),
    );

    const createNewChatMutation = useMutation(trpc.chats.createNewChat.mutationOptions({
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: trpc.chats.chats.queryKey() });
            navigate({ to: "/chat/$chatId", params: { chatId: data.id } });
        },
        onError: (error) => {
            toast.error(error.message);
        }
    }));

    const updateChatMutation = useMutation(trpc.chats.updateChat.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trpc.chats.chats.queryKey() });
        },
        onError: (error) => {
            toast.error(error.message);
        }
    }));

    const deleteChatMutation = useMutation(trpc.chats.deleteChat.mutationOptions({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: trpc.chats.chats.queryKey() });
            navigate({ to: "/chat", replace: true })
        }
    }));

    const getChatById = (id: string) => {
        return chats?.find(chat => chat.id === id);
    }

    return { chats, isLoading, createNewChatMutation, deleteChatMutation, getChatById, updateChatMutation }
};