import type { ChatRequestOptions, ChatStatus, UIMessage } from "ai";
import { ChatContainer } from "@/components/ui/chat-container";
import { Message } from "./message";
import { useRef, useMemo } from "react";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Loader } from "../ai-elements/loader";
type ChatBoxProps = {
  messages: UIMessage[];
  status: ChatStatus;
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
  regenerate: (
    props: {
      messageId?: string;
    } & ChatRequestOptions
  ) => Promise<void>;
  handleDeleteMessage: (messageId: string) => void;
};
export const ChatBox = ({
  messages,
  status,
  addToolResult,
  regenerate,
  handleDeleteMessage,
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
      // Show loading if assistant message exists but has 0 or 1 parts (just starting)
      if (lastMessage?.role === "assistant") {
        const partsCount = lastMessage.parts?.length || 0;
        return partsCount <= 1;
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
              addToolResult={addToolResult}
              key={message.id}
              id={message.id}
              children={textContent}
              variant={message.role}
              parts={message.parts}
              status={status}
              isLastMessage={message.id === lastMessage?.id}
              regenerate={regenerate}
              handleDeleteMessage={handleDeleteMessage}
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
          <div className="absolute top-[-48px] right-[24px]">
            <ScrollButton containerRef={containerRef} scrollRef={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
};
