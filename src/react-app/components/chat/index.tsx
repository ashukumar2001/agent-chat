import { useAgent } from "agents/react";
import { ChatBox } from "./chat-box";
import { ChatInput } from "../chat-input";
import { useEffect, useMemo, useState } from "react";
import { DEFUALT_MODEL } from "@worker/lib/config";
import { toast } from "sonner";
import { useAgentChat } from "agents/ai-react";
import {
  ChatAddToolApproveResponseFunction,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { ChatMessage, ChatMessageMetadata } from "@/types/ai-types";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useChatUtils } from "@/hooks/use-chat-utils";

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
  const { createNewChatMutation, getChatById, updateChatMutation } =
    useChatUtils();
  const currentChat = useMemo(
    () => (chatId ? getChatById(chatId) : null),
    [chatId, getChatById]
  );

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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    prepareSendMessagesRequest({
      messages,
      id,
      body,
      trigger,
      headers,
      api,
      credentials,
      messageId,
    }) {
      return {
        headers,
        body: {
          messageId,
          id,
          messages,
          trigger,
          metadata: {
            ...((body?.metadata || {
              chatId,
              userId,
              model: selectedModel,
              webSearch: isWebSearchEnabled,
            }) as ChatMessageMetadata),
          },
        },
        api,
        credentials,
      };
    },
    onToolCall: async (params) => {
      if ("addToolOutput" in params) {
        const { toolCall, addToolOutput } = params;
        if (toolCall.toolName === "getLocation") {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            }
          );
          addToolOutput({
            toolCallId: toolCall.toolCallId,
            output: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        }
      }
    },
  });

  const pendingToolCallConfirmation = agentMessages.some((m) =>
    m.parts?.some(
      (part) => isToolUIPart(part) && part.state === "approval-requested"
    )
  );

  const [selectedModel, setSelectedModel] = useState(
    currentChat?.model || DEFUALT_MODEL
  );
  const [agentInput, setAgentInput] = useState("");
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleModelChange = async (newModel: string) => {
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
    data
  ) => {
    agentAddToolApprovalResponse(data);
    sendMessage();
  };
  const ensureChatExists = async (
    chatId: string | undefined,
    input: string,
    customChatId?: string
  ) => {
    if (!chatId) {
      const newChat = await createNewChatMutation.mutateAsync({
        model: selectedModel,
        id: customChatId,
        name: input,
      });
      if (!newChat) return;
      return newChat.id;
    }
    if (agentMessages.length === 0) {
      await updateChatMutation.mutateAsync({
        chatId,
        name: input,
      });
    }
    return chatId;
  };
  // const handleRetryMessage = async ({
  //   messageId,
  // }: {
  //   messageId?: string;
  // } & ChatRequestOptions) => {
  //   const _chatId = await ensureChatExists(currentChat?.id, agentInput, chatId);
  //   regenerate({
  //     messageId,
  //     body: {
  //       metadata: {
  //         model: selectedModel,
  //         userId,
  //         chatId: _chatId,
  //         webSearch: isWebSearchEnabled,
  //       },
  //     },
  //   });
  // };
  const onSubmit = async (
    input?: string,
    chatConfig?: {
      modelId?: string;
      webSearchEnabled?: boolean;
    }
  ) => {
    setIsSubmitting(true);
    try {
      const _chatId = await ensureChatExists(
        currentChat?.id,
        input || agentInput,
        chatId
      );
      if (!_chatId) return;

      sendMessage(
        {
          text: input || agentInput,
        },
        {
          body: {
            metadata: {
              model: chatConfig?.modelId || selectedModel,
              userId,
              chatId: _chatId,
              webSearch: chatConfig?.webSearchEnabled ?? isWebSearchEnabled,
            },
          },
        }
      );
      setAgentInput("");
    } catch (error) {
      console.warn(error);
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (routerState.message) {
      onSubmit(routerState.message, routerState.chatConfig).then(() => {
        // Create navigation state to prevent resubmission
        navigate({ to: routerState.pathname, replace: true });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerState]);
  useEffect(() => {
    console.log(agentMessages);
  }, [agentMessages]);

  // Update selectedModel when currentChat changes (e.g., navigating to different chat)
  useEffect(() => {
    if (currentChat?.model) {
      setSelectedModel(currentChat.model);
    } else {
      setSelectedModel(DEFUALT_MODEL);
    }
  }, [currentChat?.model]);
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
