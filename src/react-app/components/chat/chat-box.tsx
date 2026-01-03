import {
  ToolUIPart,
  type ChatAddToolApproveResponseFunction,
  type ChatStatus,
} from "ai";
import { ChatContainer } from "@/components/ui/chat-container";
import { Message } from "./message";
import { useRef, useMemo } from "react";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Loader } from "../ai-elements/loader";
import { type ChatMessage } from "@/types/ai-types";
type ChatBoxProps = {
  messages: ChatMessage[];
  status: ChatStatus;
  addToolApprovalResponse: ChatAddToolApproveResponseFunction;
};
export const ChatBox = ({
  messages,
  status,
  addToolApprovalResponse,
}: ChatBoxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage =
    messages?.length > 0 ? messages[messages.length - 1] : null;
  // Check if we should show loading animation
  const shouldShowLoading = useMemo(() => {
    if (status === "submitted") {
      return true;
    }

    if (status === "streaming") {
      // Show loading if only user message exists (no assistant response yet)
      if (lastMessage?.role === "user") {
        return true;
      }

      if (lastMessage?.role === "assistant") {
        const partsCount = lastMessage.parts?.length || 0;

        if (partsCount <= 1) {
          return true;
        }
        const lastPart = lastMessage?.parts?.[partsCount - 1];
        if (
          lastPart &&
          ((lastPart.type.startsWith("tool-") &&
            (lastPart as ToolUIPart).state === "approval-responded") ||
            lastPart.type === "step-start" ||
            (lastPart.type === "text" && lastPart.text === ""))
        ) {
          return true;
        }
      }
    }

    return false;
  }, [status, lastMessage]);

  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-x-hidden overflow-y-auto">
      <ChatContainer
        className="flex-1 p-4 h-full w-full"
        autoScroll={true}
        style={{ scrollbarGutter: "stable both-edges" }}
        ref={containerRef}
        scrollToRef={bottomRef}
      >
        {messages.map((message) => {
          // Extract text content from parts array for AI SDK v5 compatibility
          const textContent =
            message.parts
              ?.filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("") || "";

          return (
            <Message
              addToolApprovalResponse={addToolApprovalResponse}
              key={message.id}
              id={message.id}
              children={textContent}
              variant={message.role}
              parts={message.parts}
              status={status}
              isLastMessage={message.id === lastMessage?.id}
              metadata={message.metadata}
            />
          );
        })}
        {shouldShowLoading && (
          <div className="group flex w-full max-w-3xl items-center mx-auto px-6">
            <Loader />
          </div>
        )}
      </ChatContainer>
      {status !== "streaming" && (
        <div className="absolute bottom-0 w-full max-w-3xl">
          <div className="absolute -top-12 right-6">
            <ScrollButton containerRef={containerRef} scrollRef={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
};
