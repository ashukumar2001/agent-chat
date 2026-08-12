import { useAgent } from "agents/react";
import { ChatBox } from "./chat-box";
import { ChatInput } from "../chat-input";
import { useEffect, useRef, useState } from "react";
import { DEFUALT_MODEL } from "@worker/lib/config";
import { toast } from "sonner";
import { useAgentChat } from "@cloudflare/ai-chat/react";
import { ChatAddToolApproveResponseFunction, isToolUIPart } from "ai";
import { ChatMessage, ChatMessageMetadata } from "@/types/ai-types";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useChatUtils } from "@/hooks/use-chat-utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";
import { USAGE_STATS_QUERY_KEY } from "@/hooks/use-usage";

export const Chat = ({
  chatId,
  userId,
}: {
  chatId?: string;
  userId: string;
}) => {
  const navigate = useNavigate();
  const routerState = useRouterState({
    select(state) {
      return {
        message: state.location.state?.message,
        chatConfig: state.location.state?.chatConfig,
        pathname: state.location.pathname,
      };
    },
  });
  const { createNewChatMutation, updateChatMutation } = useChatUtils();
  const queryClient = useQueryClient();

  // Derive the chat reactively from a subscribing query so we never act on a
  // stale value while the chats list refetches (previously caused a duplicate
  // insert race right after creating a chat).
  const chatByIdQuery = useQuery(
    trpc.chats.chatById.queryOptions(
      { chatId: chatId ?? "" },
      { enabled: Boolean(chatId) }
    )
  );
  // The query is disabled without a chatId, so its data is already the
  // authoritative source (null when on the new-chat page).
  const currentChat = chatByIdQuery.data ?? null;

  const agent = useAgent({
    agent: "chat-agent",
    name: `${userId}:${chatId}`,
  });
  const {
    messages: agentMessages,
    sendMessage,
    status,
    stop,
    addToolApprovalResponse: agentAddToolApprovalResponse,
  } = useAgentChat<unknown, ChatMessage>({
    agent,
    onError: (error) => {
      toast.error("An error occurred", {
        description: error?.message,
        closeButton: true,
      });
    },
    // sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    body: () =>
      ({
        chatId,
        userId,
        model: selectedModel,
        webSearch: isWebSearchEnabled,
      }) as ChatMessageMetadata,
    onToolCall: async (params) => {
      if ("addToolOutput" in params) {
        const { toolCall, addToolOutput } = params;
        if (toolCall.toolName === "getLocation") {
          try {
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
              },
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
            addToolOutput({
              toolCallId: toolCall.toolCallId,
              output: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            });
          } catch (error) {
            // Without this, a denied/timed-out geolocation promise leaves the
            // tool part pending forever and stalls the conversation.
            addToolOutput({
              toolCallId: toolCall.toolCallId,
              state: "output-error",
              errorText: "Unable to get location",
            });
          }
        }
      }
    },
  });

  const pendingToolCallConfirmation = agentMessages.some((m) =>
    m.parts?.some(
      (part) => isToolUIPart(part) && part.state === "approval-requested",
    ),
  );

  const [selectedModel, setSelectedModel] = useState(
    currentChat?.model || DEFUALT_MODEL,
  );
  const [agentInput, setAgentInput] = useState("");
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set once the user picks a model manually so the chat-sync effect below
  // doesn't stomp their selection with the chat's persisted model.
  const userChangedModelRef = useRef(false);

  const handleModelChange = async (newModel: string) => {
    userChangedModelRef.current = true;
    setSelectedModel(newModel);

    // Update the model in the database if chat exists
    if (currentChat) {
      try {
        await updateChatMutation.mutateAsync({
          chatId: currentChat.id,
          model: newModel,
        });
      } catch (error) {
        console.error("Failed to update model in database:", error);
        toast.error("Failed to update model", {
          description: "There was an error saving your model selection",
          closeButton: true,
        });
      }
    }
  };

  const addToolApprovalResponse: ChatAddToolApproveResponseFunction = (
    data,
  ) => {
    agentAddToolApprovalResponse(data);
  };
  const ensureChatExists = async (
    chatIdArg: string | undefined,
    input: string,
    customChatId?: string,
  ) => {
    if (currentChat?.id) return currentChat.id;

    const routeChatId = customChatId ?? chatIdArg;

    // If we have a route chatId but the chat query hasn't settled yet, wait
    // for it — creating the chat before the query resolves can race with an
    // existing row (duplicate primary key) and drop the first message.
    if (routeChatId && chatByIdQuery.isPending) {
      await chatByIdQuery.refetch();
    }
    // Re-read via the query directly: the closure's `currentChat` is the
    // render-time value, which can trail the refetched data.
    if (chatByIdQuery.data) return chatByIdQuery.data.id;

    const newChat = await createNewChatMutation.mutateAsync({
      model: selectedModel,
      id: routeChatId || undefined,
      name: input,
    });
    if (!newChat) return;
    return newChat.id;
  };
  const onSubmit = async (
    input?: string,
    chatConfig?: {
      modelId?: string;
      webSearchEnabled?: boolean;
    },
  ) => {
    setIsSubmitting(true);
    try {
      const _chatId = await ensureChatExists(
        currentChat?.id,
        input || agentInput,
        chatId,
      );
      if (!_chatId) return;

      sendMessage(
        {
          text: input || agentInput,
        },
        {
          body: {
            model: chatConfig?.modelId || selectedModel,
            userId,
            chatId: _chatId,
            webSearch: chatConfig?.webSearchEnabled ?? isWebSearchEnabled,
          },
        },
      );
      setAgentInput("");
    } catch (error) {
      console.warn(error);
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSubmittedRouterMessage = useRef(false);
  useEffect(() => {
    // Wait for the chatById query to settle so auto-submitted messages never
    // race chat creation (duplicate insert / lost first message).
    if (
      routerState.message &&
      !hasSubmittedRouterMessage.current &&
      !chatByIdQuery.isPending
    ) {
      hasSubmittedRouterMessage.current = true;
      onSubmit(routerState.message, routerState.chatConfig).then(() => {
        navigate({ to: routerState.pathname, replace: true });
      });
    }
    if (!routerState.message) {
      hasSubmittedRouterMessage.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerState, chatByIdQuery.isPending]);

  // Update selectedModel when currentChat changes (e.g., navigating to
  // different chat), unless the user picked one manually.
  useEffect(() => {
    if (userChangedModelRef.current) return;
    if (currentChat?.model) {
      setSelectedModel(currentChat.model);
    } else {
      setSelectedModel(DEFUALT_MODEL);
    }
  }, [currentChat?.model]);
  // Invalidate usage stats when chat status changes from streaming to ready
  useEffect(() => {
    if (status === "ready") {
      queryClient.invalidateQueries({ queryKey: USAGE_STATS_QUERY_KEY });
    }
  }, [status, queryClient]);
  return (
    <div className="@container/main relative flex h-full flex-col items-center justify-end md:justify-center">
      <ChatBox
        key={currentChat?.id}
        messages={agentMessages}
        addToolApprovalResponse={addToolApprovalResponse}
        status={status}
      />
      <div className="relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl">
        <ChatInput
          key={currentChat?.id}
          value={agentInput}
          handleInputChange={(e) => setAgentInput(e.target.value)}
          handleSubmit={onSubmit}
          pendingToolCallConfirmation={pendingToolCallConfirmation}
          selectedModel={selectedModel}
          handleModelChange={handleModelChange}
          isWebSearchEnabled={isWebSearchEnabled}
          setIsWebSearchEnabled={setIsWebSearchEnabled}
          stop={stop}
          status={status}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};
