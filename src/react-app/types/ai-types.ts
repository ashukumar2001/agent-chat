import { UIDataTypes, UIMessage, UITools } from "ai";

export type ChatMessage = UIMessage<
  {
    model: string;
    totalTokens: number;
  },
  UIDataTypes,
  UITools
>;
