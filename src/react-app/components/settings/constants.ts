import { Settings, Key } from "lucide-react";
import OpenRouterIcon from "@/components/icons/openrouter";
import OpenAIIcon from "@/components/icons/openai";
import MistralIcon from "@/components/icons/mistral";
import GoogleIcon from "@/components/icons/google";
import PerplexityIcon from "@/components/icons/perplexity";
import XaiIcon from "@/components/icons/xai";
import ClaudeIcon from "@/components/icons/claude";
import { Provider, SettingsSectionItem } from "./types";

export const PROVIDERS: Provider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: OpenRouterIcon,
    placeholder: "sk-or-v1-...",
    getKeyUrl: "https://openrouter.ai/settings/keys",
    defaultKey: "sk-or-v1-............",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAIIcon,
    placeholder: "sk-...",
    getKeyUrl: "https://platform.openai.com/api-keys",
    defaultKey: "sk-............",
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: MistralIcon,
    placeholder: "...",
    getKeyUrl: "https://console.mistral.ai/api-keys/",
    defaultKey: "............",
  },
  {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
    placeholder: "AIza...",
    getKeyUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    defaultKey: "AIza............",
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: PerplexityIcon,
    placeholder: "pplx-...",
    getKeyUrl: "https://docs.perplexity.ai/guides/getting-started",
    defaultKey: "pplx-............",
  },
  {
    id: "xai",
    name: "XAI",
    icon: XaiIcon,
    placeholder: "xai-...",
    getKeyUrl: "https://console.x.ai/",
    defaultKey: "xai-............",
  },
  {
    id: "anthropic",
    name: "Claude",
    icon: ClaudeIcon,
    placeholder: "sk-ant-...",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    defaultKey: "sk-ant-............",
  },
];

export const SETTINGS_SECTIONS: SettingsSectionItem[] = [
  {
    id: "general",
    label: "General",
    icon: Settings,
  },
  {
    id: "api-keys",
    label: "API Keys",
    icon: Key,
  },
  // {
  //     id: "models",
  //     label: "Models",
  //     icon: Cpu,
  // },
  // {
  //     id: "connections",
  //     label: "Connections",
  //     icon: Zap,
  // },
];
