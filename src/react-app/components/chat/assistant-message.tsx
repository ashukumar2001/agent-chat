import {
  Message,
  MessageAction,
  MessageActions,
} from "@/components/ui/message";
import { Check, Copy } from "lucide-react";
import {
  type ChatAddToolApproveResponseFunction,
  type ChatRequestOptions,
  getToolName,
  isToolUIPart,
  ToolUIPart,
} from "ai";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "../ai-elements/reasoning";
import { Response } from "../ai-elements/response";
import { Source, SourceContent, SourceTrigger } from "../prompt-kit/sources";
import { useMemo } from "react";
import { MODELS } from "@worker/lib/models";
import { type ChatMessage } from "@/types/ai-types";
import { Tool, ToolContent, ToolHeader, ToolInput } from "../ai-elements/tool";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
} from "../ai-elements/confirmation";
type AssistantMessageProps = {
  children: string;
  copied: boolean;
  copyToClipboard: () => void;
  parts: ChatMessage["parts"];
  id: string;
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  status: "streaming" | "ready" | "submitted" | "error";
  isLastMessage: boolean;
  metadata?: ChatMessage["metadata"];
};
export const AssistantMessage = ({
  children,
  copied,
  copyToClipboard,
  parts,
  id,
  status,
  isLastMessage,
  addToolApprovalResponse,
  metadata,
}: AssistantMessageProps) => {
  const isContentEmpty = children !== null && children !== "";
  const modelConfig = useMemo(() => {
    if (metadata?.model) {
      return MODELS.find((model) => model.id === metadata.model);
    }
    return;
  }, [metadata?.model]);
  const sources = parts?.filter((part) => part.type === "source-url") || [];

  return (
    <Message>
      <div className="group flex flex-col w-full max-w-3xl flex-1 items-start gap-4 px-0 md:px-6 pb-2 mb-2 mx-auto">
        <div className="w-full flex flex-col gap-2">
          {sources && sources.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {sources.map((source) => {
                return (
                  <Source href={source.url} key={source.sourceId}>
                    <SourceTrigger showFavicon label={source.title} />
                    <SourceContent
                      title={source.title || source.url}
                      description={source.url}
                    />
                  </Source>
                );
              })}
            </div>
          )}
          {parts?.map((part, idx) => {
            // In AI SDK v5, handle tool-call parts
            if (part.type === "text") {
              return (
                <Response isAnimating={status === "streaming"} key={idx}>
                  {part.text}
                </Response>
              );
            } else if (isToolUIPart(part)) {
              const toolName = getToolName(part);
              const toolCallId = part.toolCallId;
              return (
                <div key={toolCallId} title={toolName} className="space-y-2">
                  <Tool>
                    <ToolHeader
                      state={part.state}
                      type={part.type as ToolUIPart["type"]}
                    />
                    <ToolContent>
                      <ToolInput input={part.input} />
                      {part.approval && (
                        <Confirmation
                          approval={part.approval}
                          state={part.state}
                        >
                          <ConfirmationRequest>
                            Do you approve this action?
                          </ConfirmationRequest>
                          <ConfirmationAccepted>
                            <span>You approved this tool execution</span>
                          </ConfirmationAccepted>
                          <ConfirmationRejected>
                            <span>You rejected this tool execution</span>
                          </ConfirmationRejected>
                          {part.state === "approval-requested" && (
                            <ConfirmationActions>
                              <ConfirmationAction
                                variant="outline"
                                onClick={() =>
                                  addToolApprovalResponse({
                                    id: part.approval.id,
                                    approved: false,
                                  })
                                }
                              >
                                Reject
                              </ConfirmationAction>
                              <ConfirmationAction
                                variant="default"
                                onClick={() =>
                                  addToolApprovalResponse({
                                    id: part.approval.id,
                                    approved: true,
                                  })
                                }
                              >
                                Approve
                              </ConfirmationAction>
                            </ConfirmationActions>
                          )}
                        </Confirmation>
                      )}
                    </ToolContent>
                  </Tool>
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
                  <ReasoningContent className="text-muted-foreground">
                    {part.text}
                  </ReasoningContent>
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
            {!!modelConfig && modelConfig.name && (
              <MessageAction side="bottom" tooltip="Model">
                <div className="text-xs text-muted-foreground">
                  {modelConfig.name}
                </div>
              </MessageAction>
            )}
          </MessageActions>
        ) : null}
      </div>
    </Message>
  );
};
