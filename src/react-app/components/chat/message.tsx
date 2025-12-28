import type { ChatAddToolApproveResponseFunction } from "ai";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";
import { useState } from "react";
import { type ChatMessage } from "@/types/ai-types";

type MessageProps = {
  children: string;
  id: string;
  variant: ChatMessage["role"];
  parts: ChatMessage["parts"];
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
  status: "streaming" | "ready" | "submitted" | "error";
  isLastMessage: boolean;
  metadata?: ChatMessage["metadata"];
};
export const Message = ({
  children,
  variant,
  parts,
  addToolApprovalResponse,
  id,
  status,
  isLastMessage,
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
      addToolApprovalResponse={addToolApprovalResponse}
      copied={copied}
      copyToClipboard={copyToClipboard}
      id={id}
      status={status}
      isLastMessage={isLastMessage}
      metadata={metadata}
    />
  ) : (
    <UserMessage
      children={children}
      id={id}
      copied={copied}
      copyToClipboard={copyToClipboard}
    />
  );
};
