import { ChatRequestOptions } from "ai";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";
import { useState } from "react";
import { type ChatMessage } from "@/types/ai-types";

type MessageProps = {
  children: string;
  id: string;
  variant: ChatMessage["role"];
  parts: ChatMessage["parts"];
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: unknown;
  }) => void;
  status: "streaming" | "ready" | "submitted" | "error";
  isLastMessage: boolean;
  regenerate: (
    props: {
      messageId?: string;
    } & ChatRequestOptions
  ) => Promise<void>;
  metadata?: ChatMessage["metadata"];
};
export const Message = ({
  children,
  variant,
  parts,
  addToolResult,
  id,
  status,
  isLastMessage,
  regenerate,
  metadata,
}: MessageProps) => {
  const [copied, setCopied] = useState(false);
  const isAssistant = variant === "assistant";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  return isAssistant ? (
    <AssistantMessage
      children={children}
      parts={parts}
      addToolResult={addToolResult}
      copied={copied}
      copyToClipboard={copyToClipboard}
      id={id}
      status={status}
      isLastMessage={isLastMessage}
      metadata={metadata}
    />
  ) : (
    <UserMessage
      regenerate={regenerate}
      children={children}
      id={id}
      copied={copied}
      copyToClipboard={copyToClipboard}
    />
  );
};
