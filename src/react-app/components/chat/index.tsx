import { useAgent } from "agents/react";
import { ChatBox } from "./chat-box";
import { ChatInput } from "../chat-input";
import { useEffect, useMemo, useState } from "react";
import { tools, toolsRequiringConfirmation } from "@worker/lib/tools";
import { DEFUALT_MODEL } from "@worker/lib/config";
import { useChats } from "@/hooks/use-chats";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { toast } from "sonner";

export const Chat = ({
  chatId,
  userId,
}: {
  chatId: string;
  userId: string;
}) => {
  const agent = useAgent({
    agent: "my-chat-agent",
    name: `${userId}:${chatId}`,
  });
  const {
    messages: agentMessages,
    sendMessage,
    addToolResult: originalAddToolResult,
    status,
  } = useAgentChat({
    agent,
    onError: (error) => {
      toast.error("An error occurred", {
        description: error?.message,
        closeButton: true,
      });
    },
  });
  // Wrapper to match ChatBox's expected signature
  const addToolResult = async ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => {
    // Extract tool name from the message parts
    const toolName = agentMessages
      .flatMap((m) => m.parts || [])
      .find((part: any) => part.toolCallId === toolCallId)
      ?.type?.replace("tool-", "");
    if (toolName) {
      const _chatId = await ensureChatExists(chatId, agentInput);
      if (!_chatId) return;
      await originalAddToolResult({
        tool: toolName,
        toolCallId,
        output: result,
      });
      sendMessage(undefined, {
        body: {
          userId,
          chatId: _chatId,
          model: selectedModel,
        },
      });
    }
  };
  const { createNewChatMutation, getChatById, updateChatMutation } =
    useChats(userId);

  const pendingToolCallConfirmation = useMemo(
    () =>
      agentMessages.some((m) =>
        m.parts?.some((part) => {
          if (part.type.startsWith("tool-")) {
            const toolPart = part as any; // Type assertion to access state property
            return (
              toolPart.state === "input-available" &&
              toolsRequiringConfirmation.includes(
                part.type.replace("tool-", "") as keyof typeof tools
              )
            );
          }
          return false;
        })
      ),
    [agentMessages]
  );
  const currentChat = useMemo(
    () => (chatId ? getChatById(chatId) : null),
    [chatId, getChatById]
  );
  const [selectedModel, setSelectedModel] = useState(
    currentChat?.model || DEFUALT_MODEL
  );
  const [agentInput, setAgentInput] = useState("");

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
  const ensureChatExists = async (chatId: string, input: string) => {
    if (!currentChat) {
      const newChat = await createNewChatMutation.mutateAsync({
        model: selectedModel,
        id: chatId,
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
    return currentChat.id;
  };
  const onSubmit = async () => {
    const _chatId = await ensureChatExists(chatId, agentInput);
    if (!_chatId) return;

    sendMessage(
      {
        text: agentInput,
      },
      {
        body: {
          userId,
          chatId: _chatId,
          model: selectedModel,
        },
      }
    );
    setAgentInput("");
  };
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
        key={chatId}
        messages={agentMessages}
        addToolResult={addToolResult}
        status={status}
      />
      <div className="relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl">
        <ChatInput
          key={chatId}
          value={agentInput}
          handleInputChange={(e) => setAgentInput(e.target.value)}
          handleSubmit={onSubmit}
          isLoading={status === "streaming"}
          pendingToolCallConfirmation={pendingToolCallConfirmation}
          selectedModel={selectedModel}
          handleModelChange={handleModelChange}
        />
      </div>
    </div>
  );
};
