import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  LanguageModel,
  StreamTextOnFinishCallback,
  ToolSet,
  type UIMessage,
} from "ai";
import { tools } from "../lib/tools";
import { DEFAULT_SYSTEM_PROMPT, DEFUALT_MODEL } from "../lib/config";
import { MODELS } from "../lib/models";
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { getUserKey } from "../lib/user-keys";
import { AIChatAgent, type OnChatMessageOptions } from "@cloudflare/ai-chat";
import {
  checkUsageLimit,
  incrementRequestQuota,
  incrementTokenUsage,
} from "../lib/usage";

type UsageBillingContext = {
  userId: string;
  modelId: string;
  hasOwnApiKey: boolean;
};

export class ChatAgent extends AIChatAgent<Env> {
  private _usageBillingByRequestId = new Map<string, UsageBillingContext>();
  /**
   * Creates an SSE-formatted error response that will be processed by _reply.
   * This ensures errors go through the normal stream processing path.
   */
  private createErrorResponse(errorMessage: string): Response {
    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        // Format as SSE (Server-Sent Events) with error event
        const errorEvent = JSON.stringify({
          type: "error",
          errorText: errorMessage,
        });
        controller.enqueue(encoder.encode(`data: ${errorEvent}\n\n`));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    });
  }

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    { abortSignal, body: metadata, requestId }: OnChatMessageOptions,
  ) {
    const userId = (metadata?.userId as string) || "";
    const modelId = (metadata?.model as string) ?? DEFUALT_MODEL;
    const webSearchEnabled = Boolean(metadata?.webSearch);
    const startTime = Date.now();

    const modelConfig = MODELS.find((model) => model.id === modelId);

    if (!modelConfig) {
      return this.createErrorResponse(`Model ${modelId} not found`);
    }

    let modelInstance: LanguageModel | null;

    const apiKey = await getUserKey(userId, modelConfig.providerId, this.env);
    const hasOwnApiKey = Boolean(apiKey);

    // Check usage limits before processing the request
    // Only check if user doesn't have their own API key
    if (!hasOwnApiKey && userId) {
      const usageCheck = await checkUsageLimit(userId, modelId, hasOwnApiKey);
      if (!usageCheck.allowed) {
        const errorMessage = usageCheck.reason || "Usage limit exceeded";
        return this.createErrorResponse(errorMessage);
      }
    }

    // Use the dynamic model configuration
    if (modelConfig.apiSdk) {
      if (apiKey) {
        // User has their own API key configured
        modelInstance = modelConfig.apiSdk(apiKey);
      } else {
        // Use platform API key - the apiSdk function will use environment variables
        // when called without an apiKey argument
        modelInstance = modelConfig.apiSdk();
      }
    } else {
      return this.createErrorResponse(
        `No API SDK configured for model ${modelConfig.id}`,
      );
    }

    this._usageBillingByRequestId.set(requestId, {
      userId,
      modelId,
      hasOwnApiKey,
    });

    // Use streamText directly and return with metadata
    const result = streamText({
      system: DEFAULT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(this.messages),
      model: modelInstance!,
      onFinish: async (finishResult) => {
        // Token usage for every completed model segment (incl. tool-approval continuations)
        if (!hasOwnApiKey && userId) {
          try {
            await incrementTokenUsage(
              userId,
              finishResult.usage?.inputTokens ?? 0,
              finishResult.usage?.outputTokens ?? 0,
            );
          } catch (error) {
            console.error("Failed to increment token usage:", error);
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (onFinish as any)(finishResult);
      },
      tools: modelConfig.tools
        ? ((modelConfig.webSearch && webSearchEnabled
            ? { google_search: google.tools.googleSearch({}) }
            : tools) as ToolSet)
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
          };
        }
      },
    });
  }

  protected override async onChatResponse(result: {
    message: UIMessage;
    requestId: string;
    continuation: boolean;
    status: "completed" | "error" | "aborted";
    error?: string;
  }): Promise<void> {
    await super.onChatResponse(result);

    const ctx = this._usageBillingByRequestId.get(result.requestId);
    this._usageBillingByRequestId.delete(result.requestId);

    if (
      !ctx ||
      ctx.hasOwnApiKey ||
      !ctx.userId ||
      result.status !== "completed" ||
      result.continuation
    ) {
      return;
    }

    try {
      await incrementRequestQuota(ctx.userId, ctx.modelId);
    } catch (error) {
      console.error("Failed to increment request quota:", error);
    }
  }
}
