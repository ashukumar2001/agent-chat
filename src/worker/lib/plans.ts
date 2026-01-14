import { env } from "cloudflare:workers";
import { FREE_TIER_MODELS, PREMIUM_MODELS } from "./models-by-plan";
export type PlanId = "free" | "pro";

export interface PlanLimits {
  /** Maximum fast model requests per period */
  fastModelRequests: number;
  /** Maximum premium model requests per period */
  premiumModelRequests: number;
  /** Period type for resetting limits */
  periodType: "day" | "month";
  /** Allowed model IDs (null means all models allowed) */
  allowedModels: string[] | null;
  /** Message history retention in days */
  historyRetentionDays: number;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  limits: PlanLimits;
  /** Product ID from Dodo Payments (null for free tier) */
  productId: string | null;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    limits: {
      fastModelRequests: 10,
      premiumModelRequests: 0, // No premium models
      periodType: "day",
      allowedModels: FREE_TIER_MODELS,
      historyRetentionDays: 1, // 24-hour history
    },
    productId: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    limits: {
      fastModelRequests: Number(env.PRO_PLAN_FAST_MODEL_REQUESTS || 0), // fast model messages/month
      premiumModelRequests: Number(env.PRO_PLAN_PREMIUM_MODEL_REQUESTS || 0), // premium model messages/month
      periodType: "month",
      allowedModels: null, // All models allowed
      historyRetentionDays: 30, // 30-day history
    },
    // This should match the product ID from Dodo Payments
    productId:
      process.env.VITE_DODO_PRO_PRODUCT_ID || "pdt_0NVZisCmPSb7gDRkzIgKE",
  },
};

/**
 * Check if a model is a premium model
 */
export const isPremiumModel = (modelId: string): boolean => {
  return PREMIUM_MODELS.includes(modelId);
};

/**
 * Check if a model is allowed for a plan
 */
export const isModelAllowedForPlan = (
  modelId: string,
  plan: PlanConfig
): boolean => {
  // If allowedModels is null, all models are allowed
  if (plan.limits.allowedModels === null) {
    return true;
  }
  return plan.limits.allowedModels.includes(modelId);
};

/**
 * Get plan by product ID
 */
export const getPlanByProductId = (productId: string | null): PlanConfig => {
  if (!productId) {
    return PLANS.free;
  }
  const plan = Object.values(PLANS).find((p) => p.productId === productId);
  return plan || PLANS.free;
};

/**
 * Get period boundaries for a plan
 */
export const getPeriodBoundaries = (
  plan: PlanConfig
): { start: Date; end: Date } => {
  const now = new Date();

  if (plan.limits.periodType === "day") {
    // Daily period: midnight to midnight
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  } else {
    // Monthly period: 1st of month to 1st of next month
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }
};
