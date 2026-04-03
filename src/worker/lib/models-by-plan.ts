/**
 * Free tier allowed models - only these models can be used on free tier
 */
export const FREE_TIER_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gpt-5-nano",
  "gpt-4o-mini",
];

/**
 * Premium model IDs - these count against premium quota
 * All other models count against fast quota
 */
export const PREMIUM_MODELS = [
  "claude-opus-4-5-20251101",
  "claude-opus-4-1-20250805",
  "claude-sonnet-4-5-20250929",
  "gpt-5.2",
  "gpt-5",
  "gpt-5.2-pro",
  "gpt-4.1",
  "o3",
  "o4-mini",
  "gemini-2.5-pro",
  "gemini-3.1-pro-preview",
];
