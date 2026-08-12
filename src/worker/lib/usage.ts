/**
 * Usage tracking service
 *
 * Handles tracking and checking usage limits for users
 */

import { env } from "cloudflare:workers";
import { db } from "../db/db";
import { usage, subscriptions } from "../db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  PLANS,
  isPremiumModel,
  isModelAllowedForPlan,
  getPlanByProductId,
  getPeriodBoundaries,
  type PlanConfig,
  type SubscriptionPeriod,
} from "./plans";

/**
 * Request quota is only billed in production so local `bun run dev`
 * and the deployed development env can iterate without burning limits.
 */
export const isUsageEnforced = (): boolean =>
  env.CLOUDFLARE_ENV === "production";

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
 * Fetch the user's active (non-expired) subscription, if any.
 */
const getActiveSubscription = async (userId: string) => {
  const userSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(10);

  const now = new Date();
  return (
    userSubscriptions.find((sub) => {
      if (sub.status !== "active") return false;
      if (sub.nextBillingDate && new Date(sub.nextBillingDate) < now) {
        return false;
      }
      return true;
    }) ?? null
  );
};

/**
 * Get the user's current plan based on their subscription.
 * Prioritizes an active subscription over newer non-active rows (e.g. a
 * pending or cancelled checkout that would otherwise shadow it).
 */
export const getUserPlan = async (userId: string): Promise<PlanConfig> => {
  const activeSubscription = await getActiveSubscription(userId);
  if (!activeSubscription) {
    return PLANS.free;
  }
  return getPlanByProductId(activeSubscription.productId);
};

/**
 * Get or create usage record(s) for the current period, aggregating counts
 * across any records that fall in the window. Inserts are conflict-safe so
 * concurrent callers cannot produce duplicate rows for the same period.
 */
export const getOrCreateUsageRecord = async (
  userId: string,
  plan: PlanConfig,
  subscription?: SubscriptionPeriod | null,
): Promise<UsageRecord> => {
  const { start, end } = getPeriodBoundaries(plan, subscription);

  // Find all records covering this period
  const existingRecords = await db
    .select()
    .from(usage)
    .where(
      and(
        eq(usage.userId, userId),
        gte(usage.periodStart, start),
        lte(usage.periodEnd, end),
      ),
    );

  if (existingRecords.length === 0) {
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

    await db.insert(usage).values(newRecord).onConflictDoNothing();
    return newRecord;
  }

  const first = existingRecords[0];
  return {
    id: first.id,
    userId,
    periodStart: first.periodStart,
    periodEnd: first.periodEnd,
    fastModelRequests: existingRecords.reduce(
      (sum, r) => sum + r.fastModelRequests,
      0,
    ),
    premiumModelRequests: existingRecords.reduce(
      (sum, r) => sum + r.premiumModelRequests,
      0,
    ),
    inputTokens: existingRecords.reduce((sum, r) => sum + r.inputTokens, 0),
    outputTokens: existingRecords.reduce((sum, r) => sum + r.outputTokens, 0),
  };
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

  // Own API keys, and any non-production env, skip quota and model gates
  if (hasOwnApiKey || !isUsageEnforced()) {
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

  const usageRecord = await getOrCreateUsageRecord(
    userId,
    plan,
    await getActiveSubscription(userId),
  );
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
 * Uses atomic SQL increments over the whole period window, so concurrent
 * requests can't lose updates (or be missed when records were duplicated).
 */
export const incrementTokenUsage = async (
  userId: string,
  inputTokens: number = 0,
  outputTokens: number = 0,
): Promise<void> => {
  if (!isUsageEnforced()) {
    return;
  }

  const plan = await getUserPlan(userId);
  const subscription = await getActiveSubscription(userId);
  await getOrCreateUsageRecord(userId, plan, subscription);

  const { start, end } = getPeriodBoundaries(plan, subscription);
  await db
    .update(usage)
    .set({
      inputTokens: sql`${usage.inputTokens} + ${inputTokens}`,
      outputTokens: sql`${usage.outputTokens} + ${outputTokens}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(usage.userId, userId),
        gte(usage.periodStart, start),
        lte(usage.periodEnd, end),
      ),
    );
};

/**
 * Increment fast vs premium request quota by one (no token change).
 */
export const incrementRequestQuota = async (
  userId: string,
  modelId: string,
): Promise<void> => {
  if (!isUsageEnforced()) {
    return;
  }

  const plan = await getUserPlan(userId);
  const subscription = await getActiveSubscription(userId);
  await getOrCreateUsageRecord(userId, plan, subscription);

  const { start, end } = getPeriodBoundaries(plan, subscription);
  const isPremium = isPremiumModel(modelId);

  await db
    .update(usage)
    .set({
      ...(isPremium
        ? { premiumModelRequests: sql`${usage.premiumModelRequests} + 1` }
        : { fastModelRequests: sql`${usage.fastModelRequests} + 1` }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(usage.userId, userId),
        gte(usage.periodStart, start),
        lte(usage.periodEnd, end),
      ),
    );
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
  const subscription = await getActiveSubscription(userId);
  const usageRecord = await getOrCreateUsageRecord(userId, plan, subscription);

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
