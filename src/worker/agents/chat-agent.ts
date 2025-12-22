import { AIChatAgent } from "./ai-chat-agent";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  stepCountIs,
  LanguageModel,
  StreamTextOnFinishCallback,
  ToolSet,
} from "ai";
import { tools } from "../lib/tools";
import {
  processToolCalls,
  hasToolConfirmation,
  executions,
} from "../lib/utils";
import { DEFAULT_SYSTEM_PROMPT, DEFUALT_MODEL } from "../lib/config";
import { MODELS } from "../lib/models";
import {
  createGoogleGenerativeAI,
  google,
  GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import { getUserKey } from "../lib/user-keys";

export class ChatAgent extends AIChatAgent<Env> {
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    {
      config,
      abortSignal,
    }: {
      abortSignal: AbortSignal | undefined;
      config?: Record<string, unknown>;
    }
  ) {
    const userId = config?.userId as string;
    const modelId = (config?.model as string) || DEFUALT_MODEL;
    const webSearchEnabled = Boolean(config?.webSearch);
    const startTime = Date.now();
    const lastMessage = this.messages[this.messages.length - 1];

    if (hasToolConfirmation(lastMessage)) {
      // Process tool confirmations using UI stream
      const stream = createUIMessageStream({
        execute: async ({ writer }) => {
          await processToolCalls(
            { writer, messages: this.messages, tools },
            executions
          );
        },
        originalMessages: this.messages,
      });
      return createUIMessageStreamResponse({ stream });
    }
    const modelConfig = MODELS.find((model) => model.id === modelId);

    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`);
    }
    let modelInstance: LanguageModel | null = null;
    const apiKey = await getUserKey(userId, modelConfig.providerId, this.env);
    // Use the dynamic model configuration instead of hardcoded model
    if (modelConfig.apiSdk) {
      modelInstance = modelConfig.apiSdk(apiKey);
    } else {
      if (this.env.GEMINI_API_KEY) {
        // Fallback to Google SDK if no API key is configured
        const google = createGoogleGenerativeAI({
          apiKey: this.env.GEMINI_API_KEY,
        });
        modelInstance = google(modelConfig.id);
      } else {
        throw new Error(
          `No API key configured for provider ${modelConfig.provider}`
        );
      }
    }
    // Use streamText directly and return with metadata
    const result = streamText({
      system: DEFAULT_SYSTEM_PROMPT,
      messages: convertToModelMessages(this.messages),
      model: modelInstance,
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
      providerOptions: {
        google: {
          ...(modelConfig.reasoning && {
            thinkingConfig: {
              includeThoughts: true,
              thinkingBudget: modelConfig.reasoning ? 1024 : 0,
            },
          }),
        } as GoogleGenerativeAIProviderOptions,
      },
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
            cachedInputTokens: part.totalUsage.cachedInputTokens,
          };
        }
      },
    });
  }
}
