import {
  Message,
  MessageAction,
  MessageActions,
} from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { Check, Copy, Trash } from "lucide-react";
import { getToolName, isToolUIPart, type UIMessage as MessageType } from "ai";
import { Tool, ToolPart } from "../ui/tool";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Button } from "../ui/button";
import { Response } from "../ai-elements/response";
import { APPROVAL } from "@worker/lib/utils";
import { tools, toolsRequiringConfirmation } from "@worker/lib/tools";
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
  addToolResult,
}: AssistantMessageProps) => {
  const isContentEmpty = children !== null && children !== "";
  const toolCallStatusList = parts?.filter(
    (part) => part.type === "data-tool-call-status"
  ) as {
    type: "data-tool-call-status";
    data: {
      status: "loading" | "success" | "error" | undefined;
      toolCallId: string;
    };
  }[];

  return (
    <Message>
      <div className="group flex flex-col w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2 mb-2 mx-auto">
        <div className={cn("flex min-w-full flex-col gap-2")}>
          {parts?.map((part, idx) => {
            // In AI SDK v5, handle tool-call parts
            if (part.type === "text") {
              return <Response key={idx}>{part.text}</Response>;
            } else if (isToolUIPart(part)) {
              const toolCallStatus = toolCallStatusList?.find(
                (status) => status.data.toolCallId === part.toolCallId
              )?.data?.status;
              const toolName = getToolName(part);
              const toolCallId = part.toolCallId;
              return (
                <div key={toolCallId} title={toolName} className="space-y-2">
                  <Tool
                    toolPart={
                      {
                        ...part,
                        state:
                          toolCallStatus === "loading"
                            ? "input-streaming"
                            : toolCallStatus === "success"
                              ? "output-available"
                              : toolCallStatus === "error"
                                ? "output-error"
                                : part.state,
                      } as ToolPart
                    }
                  />
                  {toolsRequiringConfirmation.includes(
                    toolName as keyof typeof tools
                  ) &&
                    part.state === "input-available" && (
                      <div>
                        <Button
                          onClick={async () => {
                            addToolResult({
                              toolCallId,
                              result: APPROVAL.YES,
                            });
                          }}
                        >
                          Yes
                        </Button>
                        <Button
                          onClick={async () => {
                            addToolResult({
                              toolCallId,
                              result: APPROVAL.NO,
                            });
                          }}
                        >
                          No
                        </Button>
                      </div>
                    )}
                </div>
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
