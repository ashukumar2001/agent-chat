import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { Check, Copy, Trash } from "lucide-react";
import { type UIMessage as MessageType } from "ai";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { APPROVAL } from "@worker/lib/utils";
import { tools, toolsRequiringConfirmation } from "@worker/lib/tools";
type AssistantMessageProps = {
  children: string;
  copied: boolean;
  copyToClipboard: () => void;
  parts: MessageType["parts"];
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
};
export const AssistantMessage = ({
  children,
  copied,
  copyToClipboard,
  parts,
  addToolResult,
}: AssistantMessageProps) => {
  const isContentEmpty = children !== null && children !== "";
  return (
    <Message>
      <div className="group flex flex-col w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2 mb-2 mx-auto">
        <div className={cn("flex min-w-full flex-col gap-2")}>
          {isContentEmpty ? (
            <MessageContent
              className={cn(
                "prose dark:prose-invert relative min-w-full bg-transparent p-0",
                "prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto"
              )}
              markdown={true}
            >
              {children}
            </MessageContent>
          ) : null}

          {parts?.map((part, index) => {
            // In AI SDK v5, handle tool-call parts
            if (part.type.startsWith("tool-")) {
              // Type guard for tool call parts
              if (
                part.type === "tool-call" &&
                "toolCallId" in part &&
                "toolName" in part &&
                "args" in part &&
                "state" in part
              ) {
                const toolCallId = part.toolCallId as string;
                const toolName = part.toolName as string;
                const args = part.args as Record<string, any>;
                const state = part.state as string;

                // Check if this tool needs confirmation and is awaiting approval
                if (
                  toolsRequiringConfirmation.includes(
                    toolName as keyof typeof tools
                  ) &&
                  (state === "input-available" || state === "input-streaming")
                ) {
                  return (
                    <Card key={`${toolCallId}-${index}`}>
                      <CardHeader className="flex">
                        <span className="font-medium">Running:</span>
                        <pre>{toolName}</pre>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">Arguments:</p>
                        <pre className="text-xs bg-accent p-3 rounded-md">
                          {JSON.stringify(args, null, 2)}
                        </pre>
                      </CardContent>
                      <CardFooter className="justify-end gap-3">
                        <Button
                          onClick={() =>
                            addToolResult({ toolCallId, result: APPROVAL.NO })
                          }
                          variant="outline"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          onClick={() =>
                            addToolResult({ toolCallId, result: APPROVAL.YES })
                          }
                        >
                          Approve
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                }
              }
            }
            return null;
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
