import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { Button } from "../ui/button";
import { ArrowUp, Globe, Square } from "lucide-react";
import { ModelSwitcher } from "../chat/model-switcher";
import { useCallback, useEffect } from "react";
import { MODELS } from "@worker/lib/models";
import { ChatStatus } from "ai";

type ChatInputProps = {
  value: string;
  handleSubmit: () => void;
  pendingToolCallConfirmation?: boolean;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  selectedModel: string;
  handleModelChange: (model: string) => void;
  isWebSearchEnabled: boolean;
  setIsWebSearchEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  stop?: () => Promise<void>;
  status?: ChatStatus;
  isSubmitting: boolean;
};
export const ChatInput = ({
  value,
  handleInputChange,
  handleSubmit,
  pendingToolCallConfirmation = false,
  selectedModel,
  handleModelChange,
  isWebSearchEnabled,
  setIsWebSearchEnabled,
  status,
  stop = async () => {},
  isSubmitting,
}: ChatInputProps) => {
  const modelConfig = MODELS.find((model) => model.id === selectedModel);
  const isStreaming = status === "streaming";
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSubmitting) {
        e.preventDefault();
        return;
      }

      if (e.key === "Enter" && isStreaming) {
        e.preventDefault();
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (!value || value.trim() === "") {
          return;
        }

        e.preventDefault();
        handleSubmit();
      }
    },
    [isSubmitting, handleSubmit, isStreaming, value]
  );
  useEffect(() => {
    if (!modelConfig?.webSearch) {
      setIsWebSearchEnabled(false);
    }
  }, [modelConfig?.webSearch]);
  return (
    <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
      <PromptInput
        value={value}
        className="border-input bg-popover relative z-10 overflow-hidden border p-2 shadow-xs backdrop-blur-xl"
      >
        <PromptInputTextarea
          placeholder="Ask me anything..."
          disabled={pendingToolCallConfirmation}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <PromptInputActions className="justify-between mt-4">
          <div className="gap-2 flex">
            <PromptInputAction tooltip="Model">
              <ModelSwitcher
                selectedModel={selectedModel}
                handleModelChange={handleModelChange}
              />
            </PromptInputAction>
            {modelConfig?.webSearch && (
              <PromptInputAction tooltip="Search">
                <Button
                  onClick={() => setIsWebSearchEnabled((prev) => !prev)}
                  variant={isWebSearchEnabled ? "default" : "outline"}
                  className="rounded-full"
                >
                  <Globe size={18} />
                  Search
                </Button>
              </PromptInputAction>
            )}
          </div>

          <PromptInputAction
            tooltip={isStreaming ? "Stop generation" : "Send message"}
          >
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={isStreaming ? stop : () => handleSubmit()}
              disabled={
                !isStreaming
                  ? pendingToolCallConfirmation ||
                    !value ||
                    !value.trim() ||
                    isSubmitting
                  : false
              }
              aria-label={isStreaming ? "Stop generation" : "Send message"}
            >
              {isStreaming ? (
                <Square className="size-4 fill-current" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
};
