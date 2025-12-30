import { cn } from "@/lib/utils";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "../ui/message";
import { Check, Copy } from "lucide-react";

type UserMessageProps = {
  children: string;
  copied: boolean;
  copyToClipboard: () => void;

  id: string;
};
export const UserMessage = ({
  children,
  copied,
  copyToClipboard,
}: UserMessageProps) => {
  return (
    <Message
      className={cn(
        "group flex w-full max-w-3xl flex-col items-end gap-2 px-0 md:px-6 pb-2 mx-auto"
      )}
    >
      <MessageContent
        className="bg-accent relative max-w-[70%] rounded-3xl px-5 py-2.5"
        markdown={false}
      >
        {children}
      </MessageContent>
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
      </MessageActions>
    </Message>
  );
};
