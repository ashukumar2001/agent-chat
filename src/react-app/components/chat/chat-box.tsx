import type { UIMessage } from "ai";
import { ChatContainer } from "@/components/ui/chat-container";
import { Message } from "./message";
import { useRef } from "react";
import { ScrollButton } from "@/components/ui/scroll-button";
import { Loader } from "../ai-elements/loader";
type ChatBoxProps = {
  messages: UIMessage[];
  status: "streaming" | "ready" | "submitted" | "error";
  addToolResult: ({
    toolCallId,
    result,
  }: {
    toolCallId: string;
    result: any;
  }) => void;
};
export const ChatBox = ({ messages, status, addToolResult }: ChatBoxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage =
    messages?.length > 0 ? messages[messages.length - 1] : null;

  console.log({ lastMessage });

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
            />
          );
        })}
        {status === "streaming" &&
          lastMessage &&
          lastMessage.role === "assistant" &&
          (!lastMessage.parts ||
            lastMessage.parts.filter((part) => part.type === "text").length ===
              0 ||
            lastMessage.parts
              .filter((part) => part.type === "text")
              .every((part) => part.text === "")) && (
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
