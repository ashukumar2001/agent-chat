import { useAgent } from "agents/react";
import { ChatBox } from "./chat-box";
import { ChatInput } from "../chat-input";
import { useEffect, useMemo, useState } from "react";
import { clientTools } from "@worker/lib/tools";
import { DEFUALT_MODEL } from "@worker/lib/config";
import { useChats } from "@/hooks/use-chats";
import { toast } from "sonner";
import { toolsRequiringConfirmation } from "@worker/lib/utils";
import { AITool, useAgentChat } from "agents/ai-react";
import { ChatRequestOptions, isToolUIPart, ToolUIPart } from "ai";
import { ChatMessage } from "@/types/ai-types";
import { useNavigate, useRouterState } from "@tanstack/react-router";

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
    useChats(userId);
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
    addToolOutput: originalAddToolResult,
    status,
    stop,
    regenerate,
  } = useAgentChat<unknown, ChatMessage>({
    agent,
    onError: (error) => {
      toast.error("An error occurred", {
        description: error?.message,
        closeButton: true,
      });
    },
    experimental_automaticToolResolution: true,
    toolsRequiringConfirmation,
    tools: clientTools satisfies Record<string, AITool>,
  });
  // Wrapper to match ChatBox's expected signature
  const addToolResult = async ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: unknown;
  }) => {
    // Extract tool name from the message parts
    const toolName = agentMessages
      .flatMap((m) => m.parts || [])
      .find(
        (part) =>
          part.type.startsWith("tool-") &&
          (part as ToolUIPart).toolCallId === toolCallId
      )
      ?.type?.replace("tool-", "");
    if (toolName) {
      const _chatId = await ensureChatExists(
        currentChat?.id,
        agentInput,
        chatId
      );
      if (!_chatId) return;
      await originalAddToolResult({
        tool: toolName,
        toolCallId,
        output: result,
      });
    }
  };

  // Tools requiring confirmation are auto-detected by useAgentChat from tools object
  // Tools without execute function need confirmation (getWeatherInformation)
  // Tools with execute function are automatic (getLocalTime)
  const pendingToolCallConfirmation = agentMessages.some((m) =>
    m.parts?.some(
      (part) => isToolUIPart(part) && part.state === "input-available"
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
  const handleRetryMessage = async ({
    messageId,
  }: {
    messageId?: string;
  } & ChatRequestOptions) => {
    const _chatId = await ensureChatExists(currentChat?.id, agentInput, chatId);
    regenerate({
      messageId,
      body: {
        config: {
          userId,
          chatId: _chatId,
          model: selectedModel,
          webSearch: isWebSearchEnabled,
        },
      },
    });
  };
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
            config: {
              userId,
              chatId: _chatId,
              model: chatConfig?.modelId || selectedModel,
              webSearch: chatConfig?.webSearchEnabled || isWebSearchEnabled,
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
        addToolResult={addToolResult}
        status={status}
        regenerate={handleRetryMessage}
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
