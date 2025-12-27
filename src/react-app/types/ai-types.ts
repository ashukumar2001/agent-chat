import { UIDataTypes, UIMessage, UITools } from "ai";

/**
 * Metadata attached to each chat message.
 * - `model`: The model ID used for this message.
 * - `totalTokens`: The total tokens consumed (optional, may be absent during streaming).
 * - `userId`: The user ID associated with this message (optional).
 * - `chatId`: The chat session ID (optional).
 * - `webSearch`: Whether web search was enabled (optional).
 */
export type ChatMessageMetadata = {
  model?: string;
  totalTokens?: number;
  userId: string;
  chatId: string;
  webSearch?: boolean;
};

export type ChatMessage = UIMessage<ChatMessageMetadata, UIDataTypes, UITools>;
