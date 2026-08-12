import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChatInput } from "@/components/chat-input";
import { useState } from "react";
import { DEFUALT_MODEL } from "@worker/lib/config";
import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useChatUtils } from "@/hooks/use-chat-utils";
export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { createNewChatMutation } = useChatUtils();
  const [selectedModel, setSelectedModel] = useState(DEFUALT_MODEL);
  const [agentInput, setAgentInput] = useState("");
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
  };
  const onSubmit = async () => {
    setIsSubmitting(true);
    try {
      const newChat = await createNewChatMutation.mutateAsync({
        model: selectedModel,
        name: agentInput,
      });

      if (!newChat) {
        toast.error("Failed to create chat");
        return;
      }
      navigate({
        to: "/chat/$chatId",
        params: { chatId: newChat.id },
        state: {
          message: agentInput,
          chatConfig: {
            modelId: selectedModel,
            webSearchEnabled: isWebSearchEnabled,
          },
        },
      });
    } catch (error) {
      console.warn(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="@container/main relative flex h-full flex-col items-center justify-end md:justify-center">
      <div className="relative flex h-full w-full flex-col items-center overflow-x-hidden overflow-y-auto justify-center">
        <div className="group flex w-full max-w-3xl flex-col space-y-4 px-6 mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl"
          >
            How can I help you?
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-2"
          >
            <PromptSuggestion onClick={() => setAgentInput("Tell me a joke")}>
              Tell me a joke
            </PromptSuggestion>

            <PromptSuggestion
              onClick={() => setAgentInput("How does this work?")}
            >
              How does this work?
            </PromptSuggestion>

            <PromptSuggestion
              onClick={() => setAgentInput("Generate an image of a cat")}
            >
              Generate an image of a cat
            </PromptSuggestion>

            <PromptSuggestion onClick={() => setAgentInput("Write a poem")}>
              Write a poem
            </PromptSuggestion>
            <PromptSuggestion
              onClick={() => setAgentInput("Code a React component")}
            >
              Code a React component
            </PromptSuggestion>
          </motion.div>
        </div>
      </div>
      <div className="relative inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl">
        <ChatInput
          value={agentInput}
          handleInputChange={(e) => setAgentInput(e.target.value)}
          handleSubmit={onSubmit}
          selectedModel={selectedModel}
          handleModelChange={handleModelChange}
          isWebSearchEnabled={isWebSearchEnabled}
          setIsWebSearchEnabled={setIsWebSearchEnabled}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
