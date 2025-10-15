import { ChatRequestOptions, type UIMessage as MessageType } from "ai";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";
import { useState } from "react";

type MessageProps = {
  children: string;
  id: string;
  variant: MessageType["role"];
  parts: MessageType["parts"];
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
  status: "streaming" | "ready" | "submitted" | "error";
  isLastMessage: boolean;
  regenerate: (
    props: {
      messageId?: string;
    } & ChatRequestOptions
  ) => Promise<void>;
  handleDeleteMessage: (messageId: string) => void;
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
  handleDeleteMessage,
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
      handleDeleteMessage={handleDeleteMessage}
    />
  ) : (
    <UserMessage
      regenerate={regenerate}
      children={children}
      id={id}
      copied={copied}
      copyToClipboard={copyToClipboard}
      handleDeleteMessage={handleDeleteMessage}
    />
  );
};
