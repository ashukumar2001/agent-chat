import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { Check, Copy, Trash } from "lucide-react";
import { type UIMessage as MessageType } from "ai";
import { Tool, ToolPart } from "../ui/tool";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
type AssistantMessageProps = {
  children: string;
  copied: boolean;
  copyToClipboard: () => void;
  parts: MessageType["parts"];
  id: string;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
  status: "streaming" | "ready" | "submitted" | "error";
  isLastMessage: boolean;
};
export const AssistantMessage = ({
  children,
  copied,
  copyToClipboard,
  parts,
  id,
  status,
  isLastMessage,
}: AssistantMessageProps) => {
  const isContentEmpty = children !== null && children !== "";
  console.log({ isLastMessage, messageId: id, status });
  return (
    <Message>
      <div className="group flex flex-col w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2 mb-2 mx-auto">
        <div className={cn("flex min-w-full flex-col gap-2")}>
          {parts?.map((part, idx) => {
            // In AI SDK v5, handle tool-call parts
            if (part.type.startsWith("tool-")) {
              return <Tool toolPart={part as ToolPart} />;
            } else if (part.type === "text") {
              return (
                <MessageContent
                  className={cn(
                    "prose dark:prose-invert relative min-w-full bg-transparent p-0",
                    "prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto"
                  )}
                  markdown={true}
                >
                  {part.text}
                </MessageContent>
              );
            } else if (part.type === "reasoning") {
              return (
                <Reasoning
                  key={`${id}-${idx}`}
                  isStreaming={
                    status === "streaming" &&
                    idx === parts.length - 1 &&
                    isLastMessage
                  }
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );
            }
            return;
          })}
        </div>
        {isContentEmpty ? (
          <MessageActions className="opacity-0 transition-opacity group-hover:opacity-100">
            <MessageAction
              tooltip={copied ? "Copied!" : "Copy text"}
              side="bottom"
              delayDuration={0}
            >
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Copy text"
                onClick={copyToClipboard}
                type="button"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </MessageAction>
            <MessageAction tooltip="Delete" side="bottom" delayDuration={0}>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Delete"
                // onClick={handleDelete}
                type="button"
              >
                <Trash className="size-4" />
              </button>
            </MessageAction>
          </MessageActions>
        ) : null}
      </div>
    </Message>
  );
};
