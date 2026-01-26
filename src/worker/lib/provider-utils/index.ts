import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { createMistral, mistral } from "@ai-sdk/mistral";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createPerplexity, perplexity } from "@ai-sdk/perplexity";
import type { LanguageModel } from "ai";
import { createXai, xai } from "@ai-sdk/xai";
import { getProviderForModel } from "./provider-map";
import type {
  AnthropicModel,
  GeminiModel,
  MistralModel,
  OllamaModel,
  OpenAIModel,
  PerplexityModel,
  SupportedModel,
  XaiModel,
} from "./types";

type OpenAIChatSettings = Parameters<typeof createOpenAI>[0];
type MistralProviderSettings = Parameters<typeof createMistral>[0];
type GoogleGenerativeAIProviderSettings = Parameters<
  typeof createGoogleGenerativeAI
>[0];
type PerplexityProviderSettings = Parameters<typeof createPerplexity>[0];
type AnthropicProviderSettings = Parameters<typeof createAnthropic>[0];
type XaiProviderSettings = Parameters<typeof createXai>[0];
type OllamaProviderSettings = OpenAIChatSettings; // Ollama uses OpenAI-compatible API

type ModelSettings<T extends SupportedModel> = T extends OpenAIModel
  ? OpenAIChatSettings
  : T extends MistralModel
    ? MistralProviderSettings
    : T extends PerplexityModel
      ? PerplexityProviderSettings
      : T extends GeminiModel
        ? GoogleGenerativeAIProviderSettings
        : T extends AnthropicModel
          ? AnthropicProviderSettings
          : T extends XaiModel
            ? XaiProviderSettings
            : T extends OllamaModel
              ? OllamaProviderSettings
              : never;

export type OpenProvidersOptions<T extends SupportedModel> = ModelSettings<T>;

export function openproviders<T extends SupportedModel>(
  modelId: T,
  settings?: OpenProvidersOptions<T>,
  apiKey?: string,
): LanguageModel {
  const provider = getProviderForModel(modelId);

  if (provider === "openai") {
    if (apiKey) {
      const openaiProvider = createOpenAI({
        ...(settings as OpenAIChatSettings),
        apiKey,
      });
      return openaiProvider(modelId as OpenAIModel);
    }
    return openai(modelId as OpenAIModel);
  }

  if (provider === "mistral") {
    if (apiKey) {
      const mistralProvider = createMistral({
        ...(settings as MistralProviderSettings),
        apiKey,
      });
      return mistralProvider(modelId as MistralModel);
    }
    return mistral(modelId as MistralModel);
  }

  if (provider === "google") {
    if (apiKey) {
      const googleProvider = createGoogleGenerativeAI({
        ...(settings as GoogleGenerativeAIProviderSettings),
        apiKey,
      });
      return googleProvider(modelId as GeminiModel);
    }
    return google(modelId as GeminiModel);
  }

  if (provider === "perplexity") {
    if (apiKey) {
      const perplexityProvider = createPerplexity({ apiKey });
      return perplexityProvider(
        modelId as PerplexityModel,
        // settings as PerplexityProviderSettings
      );
    }
    return perplexity(
      modelId as PerplexityModel,
      // settings as PerplexityProviderSettings
    );
  }

  if (provider === "anthropic") {
    if (apiKey) {
      const anthropicProvider = createAnthropic({
        ...(settings as AnthropicProviderSettings),
        apiKey,
      });
      return anthropicProvider(modelId as AnthropicModel);
    }
    return anthropic(modelId as AnthropicModel);
  }

  if (provider === "xai") {
    if (apiKey) {
      const xaiProvider = createXai({
        ...(settings as XaiProviderSettings),
        apiKey,
      });
      return xaiProvider(modelId as XaiModel);
    }
    return xai(modelId as XaiModel);
  }

  throw new Error(`Unsupported model: ${modelId}`);
}
