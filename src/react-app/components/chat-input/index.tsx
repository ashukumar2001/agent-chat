import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { Button } from "../ui/button";
import { ArrowUp, Globe, Square } from "lucide-react";
import { ModelSwitcher } from "../chat/model-switcher";
import { useEffect } from "react";
import { MODELS } from "@worker/lib/models";

type ChatInputProps = {
  value: string;
  handleSubmit: () => void;
  isLoading: boolean;
  pendingToolCallConfirmation: boolean;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  selectedModel: string;
  handleModelChange: (model: string) => void;
  isWebSearchEnabled: boolean;
  setIsWebSearchEnabled: React.Dispatch<React.SetStateAction<boolean>>;
};
export const ChatInput = ({
  value,
  handleInputChange,
  handleSubmit,
  isLoading,
  pendingToolCallConfirmation,
  selectedModel,
  handleModelChange,
  isWebSearchEnabled,
  setIsWebSearchEnabled,
}: ChatInputProps) => {
  const modelConfig = MODELS.find((model) => model.id === selectedModel);

  useEffect(() => {
    if (!modelConfig?.webSearch) {
      setIsWebSearchEnabled(false);
    }
  }, [modelConfig?.webSearch]);
  return (
    <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
      <PromptInput
        onSubmit={handleSubmit}
        value={value}
        className="border-input bg-popover relative z-10 overflow-hidden border p-2 shadow-xs backdrop-blur-xl"
      >
        <PromptInputTextarea
          placeholder="Ask me anything..."
          disabled={pendingToolCallConfirmation}
          onChange={handleInputChange}
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
            tooltip={isLoading ? "Stop generation" : "Send message"}
          >
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={isLoading ? () => {} : handleSubmit}
              disabled={
                pendingToolCallConfirmation ||
                (!isLoading && (!value || !value.trim()))
              }
            >
              {isLoading ? (
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
