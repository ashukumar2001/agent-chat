/**
 * Usage tracking service
 *
 * Handles tracking and checking usage limits for users
 */

import { db } from "../db/db";
import { usage, subscriptions } from "../db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  PLANS,
  isPremiumModel,
  isModelAllowedForPlan,
  getPlanByProductId,
  getPeriodBoundaries,
  type PlanConfig,
} from "./plans";

export interface UsageRecord {
  id: string;
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  fastModelRequests: number;
  premiumModelRequests: number;
  inputTokens: number;
  outputTokens: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: {
    fastModelRequests: number;
    premiumModelRequests: number;
    limit: {
      fastModelRequests: number;
      premiumModelRequests: number;
    };
  };
  plan: PlanConfig;
}

export interface UsageStats {
  fastModelRequests: number;
  premiumModelRequests: number;
  inputTokens: number;
  outputTokens: number;
  limits: {
    fastModelRequests: number;
    premiumModelRequests: number;
  };
  periodStart: Date;
  periodEnd: Date;
  planId: string;
  planName: string;
}

/**
 * Get the user's current plan based on their subscription
 */
export const getUserPlan = async (userId: string): Promise<PlanConfig> => {
  // Get the most recent subscription
  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!userSubscription.length) {
    return PLANS.free;
  }

  const sub = userSubscription[0];
  const isActive = sub.status === "active";
  const isExpired =
    sub.nextBillingDate && new Date(sub.nextBillingDate) < new Date();

  if (!isActive || isExpired) {
    return PLANS.free;
  }

  return getPlanByProductId(sub.productId);
};

/**
 * Get or create usage record for the current period
 */
export const getOrCreateUsageRecord = async (
  userId: string,
  plan: PlanConfig,
): Promise<UsageRecord> => {
  const { start, end } = getPeriodBoundaries(plan);

  // Try to find existing record for this period
  const existingRecords = await db
    .select()
    .from(usage)
    .where(
      and(
        eq(usage.userId, userId),
        gte(usage.periodStart, start),
        lte(usage.periodEnd, end),
      ),
    )
    .limit(1);

  if (existingRecords.length > 0) {
    const record = existingRecords[0];
    return {
      id: record.id,
      userId: record.userId,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
      fastModelRequests: record.fastModelRequests,
      premiumModelRequests: record.premiumModelRequests,
      inputTokens: record.inputTokens,
      outputTokens: record.outputTokens,
    };
  }

  // Create new record for this period
  const newRecord = {
    id: nanoid(),
    userId,
    periodStart: start,
    periodEnd: end,
    fastModelRequests: 0,
    premiumModelRequests: 0,
    inputTokens: 0,
    outputTokens: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.insert(usage).values(newRecord);

  return newRecord;
};

/**
 * Check if a user can make a request with the given model
 */
export const checkUsageLimit = async (
  userId: string,
  modelId: string,
  hasOwnApiKey: boolean = false,
): Promise<UsageCheckResult> => {
  const plan = await getUserPlan(userId);

  // If user has their own API key, allow unlimited usage
  if (hasOwnApiKey) {
    return {
      allowed: true,
      plan,
    };
  }

  // Check if model is allowed for this plan
  if (!isModelAllowedForPlan(modelId, plan)) {
    return {
      allowed: false,
      reason: `Model "${modelId}" is not available on the ${plan.name} plan. Please upgrade to Pro for access to all models.`,
      plan,
    };
  }

  const usageRecord = await getOrCreateUsageRecord(userId, plan);
  const isPremium = isPremiumModel(modelId);

  const currentUsage = {
    fastModelRequests: usageRecord.fastModelRequests,
    premiumModelRequests: usageRecord.premiumModelRequests,
    limit: {
      fastModelRequests: plan.limits.fastModelRequests,
      premiumModelRequests: plan.limits.premiumModelRequests,
    },
  };

  if (isPremium) {
    // Check premium model limit
    if (usageRecord.premiumModelRequests >= plan.limits.premiumModelRequests) {
      const periodLabel =
        plan.limits.periodType === "day" ? "today" : "this month";
      return {
        allowed: false,
        reason: `You've reached your premium model limit of ${plan.limits.premiumModelRequests} requests ${periodLabel}. Upgrade to Pro for more premium model access, or use your own API keys for unlimited usage.`,
        currentUsage,
        plan,
      };
    }
  } else {
    // Check fast model limit
    if (usageRecord.fastModelRequests >= plan.limits.fastModelRequests) {
      const periodLabel =
        plan.limits.periodType === "day" ? "today" : "this month";
      return {
        allowed: false,
        reason: `You've reached your message limit of ${plan.limits.fastModelRequests} requests ${periodLabel}. Upgrade to Pro for more messages, or use your own API keys for unlimited usage.`,
        currentUsage,
        plan,
      };
    }
  }

  return {
    allowed: true,
    currentUsage,
    plan,
  };
};

/**
 * Add token counts for a completed model call (no request-quota change).
 */
export const incrementTokenUsage = async (
  userId: string,
  inputTokens: number = 0,
  outputTokens: number = 0,
): Promise<void> => {
  const plan = await getUserPlan(userId);
  const usageRecord = await getOrCreateUsageRecord(userId, plan);

  await db
    .update(usage)
    .set({
      inputTokens: usageRecord.inputTokens + inputTokens,
      outputTokens: usageRecord.outputTokens + outputTokens,
      updatedAt: new Date(),
    })
    .where(eq(usage.id, usageRecord.id));
};

/**
 * Increment fast vs premium request quota by one (no token change).
 */
export const incrementRequestQuota = async (
  userId: string,
  modelId: string,
): Promise<void> => {
  const plan = await getUserPlan(userId);
  const usageRecord = await getOrCreateUsageRecord(userId, plan);
  const isPremium = isPremiumModel(modelId);

  await db
    .update(usage)
    .set({
      fastModelRequests: isPremium
        ? usageRecord.fastModelRequests
        : usageRecord.fastModelRequests + 1,
      premiumModelRequests: isPremium
        ? usageRecord.premiumModelRequests + 1
        : usageRecord.premiumModelRequests,
      updatedAt: new Date(),
    })
    .where(eq(usage.id, usageRecord.id));
};

/**
 * Increment usage after a successful request (one billable request + tokens).
 */
export const incrementUsage = async (
  userId: string,
  modelId: string,
  inputTokens: number = 0,
  outputTokens: number = 0,
): Promise<void> => {
  await incrementRequestQuota(userId, modelId);
  await incrementTokenUsage(userId, inputTokens, outputTokens);
};

/**
 * Get usage stats for a user
 */
export const getUsageStats = async (userId: string): Promise<UsageStats> => {
  const plan = await getUserPlan(userId);
  const usageRecord = await getOrCreateUsageRecord(userId, plan);

  return {
    fastModelRequests: usageRecord.fastModelRequests,
    premiumModelRequests: usageRecord.premiumModelRequests,
    inputTokens: usageRecord.inputTokens,
    outputTokens: usageRecord.outputTokens,
    limits: {
      fastModelRequests: plan.limits.fastModelRequests,
      premiumModelRequests: plan.limits.premiumModelRequests,
    },
    periodStart: usageRecord.periodStart,
    periodEnd: usageRecord.periodEnd,
    planId: plan.id,
    planName: plan.name,
  };
};
