import Anthropic from "@/components/icons/anthropic";
import Claude from "@/components/icons/claude";
import DeepSeek from "@/components/icons/deepseek";
import Gemini from "@/components/icons/gemini";
import Google from "@/components/icons/google";
import Grok from "@/components/icons/grok";
import Meta from "@/components/icons/meta";
import Mistral from "@/components/icons/mistral";
import Ollama from "@/components/icons/ollama";
import OpenAI from "@/components/icons/openai";
import OpenRouter from "@/components/icons/openrouter";
import Preplexity from "@/components/icons/perplexity";
import Xai from "@/components/icons/xai";
import type { Provider } from "../types/misc";

export const PROVIDERS: Provider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: OpenRouter,
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAI,
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: Mistral,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: DeepSeek,
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: Gemini,
  },
  {
    id: "claude",
    name: "Claude",
    icon: Claude,
  },
  {
    id: "grok",
    name: "Grok",
    icon: Grok,
  },
  {
    id: "xai",
    name: "XAI",
    icon: Xai,
  },
  {
    id: "google",
    name: "Google",
    icon: Google,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    icon: Anthropic,
  },
  {
    id: "ollama",
    name: "Ollama",
    icon: Ollama,
  },
  {
    id: "meta",
    name: "Meta",
    icon: Meta,
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: Preplexity,
  },
] as Provider[];

/**
 * Premium model IDs - these count against premium quota
 * All other models count against fast quota
 */
export const PREMIUM_MODELS = [
  // OpenAI
  "gpt-4o",
  "gpt-4o-2024-11-20",
  "gpt-4-turbo",
  "gpt-4",
  "o1",
  "o1-mini",
  "o1-preview",
  "o3-mini",
  // Anthropic
  "claude-sonnet-4-20250514",
  "claude-3-5-sonnet-20241022",
  "claude-3-5-sonnet-latest",
  "claude-3-opus-20240229",
  "claude-3-opus-latest",
  // Google
  "gemini-2.0-pro-exp",
  "gemini-1.5-pro",
  "gemini-1.5-pro-latest",
  "gemini-2.5-pro-preview-05-06",
  // xAI
  "grok-2",
  "grok-2-latest",
  "grok-3",
  // Perplexity
  "sonar-pro",
  "sonar-reasoning-pro",
];

export const SUGGESTED_PROVIDERS_IDS: string[] = PROVIDERS.map(
  (provider) => provider.id
);
