import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  LanguageModel,
  StreamTextOnFinishCallback,
  ToolSet,
} from "ai";
import { tools } from "../lib/tools";
import { DEFAULT_SYSTEM_PROMPT, DEFUALT_MODEL } from "../lib/config";
import { MODELS } from "../lib/models";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { getUserKey } from "../lib/user-keys";
import { AIChatAgent, type OnChatMessageOptions } from "./ai-chat-agent";

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    { abortSignal, metadata }: OnChatMessageOptions
  ) {
    const userId = (metadata?.userId as string) || "";
    const modelId = (metadata?.model as string) ?? DEFUALT_MODEL;
    const webSearchEnabled = Boolean(metadata?.webSearch);
    const startTime = Date.now();

    const modelConfig = MODELS.find((model) => model.id === modelId);

    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    let modelInstance: LanguageModel | null = null;
    const apiKey = await getUserKey(userId, modelConfig.providerId, this.env);
    // Use the dynamic model configuration instead of hardcoded model
    if (modelConfig.apiSdk && apiKey) {
      modelInstance = modelConfig.apiSdk(apiKey);
    } else {
      if (this.env.GEMINI_API_KEY) {
        // Fallback to Google SDK if no API key is configured
        const google = createGoogleGenerativeAI({
          apiKey: this.env.GEMINI_API_KEY,
        });
        modelInstance = google("gemini-2.5-flash");
      } else {
        throw new Error(
          `No API key configured for provider ${modelConfig.provider}`
        );
      }
    }
    // Use streamText directly and return with metadata
    const result = streamText({
      system: DEFAULT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      model: modelInstance!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onFinish: onFinish as any,
      tools: modelConfig.tools
        ? {
            ...(modelConfig.webSearch && webSearchEnabled
              ? {
                  google_search: google.tools.googleSearch({}),
                }
              : tools),
          }
        : undefined,
      stopWhen: stepCountIs(5),
      abortSignal,
      // providerOptions: {
      //   google: {
      //     ...(modelConfig.reasoning && {
      //       thinkingConfig: {
      //         includeThoughts: true,
      //         thinkingBudget: modelConfig.reasoning ? 1024 : 0,
      //       },
      //     }),
      //   } as GoogleGenerativeAIProviderOptions,
      // },
    });
    return result.toUIMessageStreamResponse({
      sendSources: true,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            model: modelId,
            createdAt: Date.now(),
            messageCount: this.messages.length,
          };
        }
        if (part.type === "finish-step") {
          return {
            providerMetadata:
              part.providerMetadata?.[modelConfig.providerId] || {},
          };
        }
        if (part.type === "finish") {
          return {
            responseTime: Date.now() - startTime,
            totalTokens: part.totalUsage?.totalTokens,
          };
        }
      },
    });
  }
}
