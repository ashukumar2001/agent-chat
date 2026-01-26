import { claudeModels } from "./data/claude";
import { geminiModels } from "./data/gemini";
// import { deepseekModels } from "./data/deepseek";
import { ModelConfig } from "./types";
// import { perplexityModels } from "./data/perplexity";
import { openaiModels } from "./data/openai";
// import { grokModels } from "./data/grok";
// import { mistralModels } from "./data/mistral";
import { openrouterModels } from "./data/openrouter";
// import { llamaModels } from "./data/llama";

export const MODELS: ModelConfig[] = [
  ...geminiModels,
  ...claudeModels,
  // ...deepseekModels,
  // ...perplexityModels,
  ...openaiModels,
  // ...grokModels,
  // ...mistralModels,
  ...openrouterModels,
  // ...llamaModels,
];
