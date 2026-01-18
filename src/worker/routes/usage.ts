import { Hono } from "hono";
import { auth } from "../lib/auth";
import { getUsageStats, getUserPlan, checkUsageLimit } from "../lib/usage";
import { PLANS } from "../lib/plans";
import { FREE_TIER_MODELS, PREMIUM_MODELS } from "../lib/models-by-plan";

const usageApp = new Hono<{ Bindings: Env }>();

/**
 * Get current user's usage stats
 */
usageApp.get("/", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const stats = await getUsageStats(session.user.id);
    return c.json({
      usage: {
        fastModelRequests: stats.fastModelRequests,
        premiumModelRequests: stats.premiumModelRequests,
        inputTokens: stats.inputTokens,
        outputTokens: stats.outputTokens,
      },
      limits: stats.limits,
      period: {
        start: stats.periodStart.toISOString(),
        end: stats.periodEnd.toISOString(),
      },
      plan: {
        id: stats.planId,
        name: stats.planName,
      },
    });
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return c.json({ error: "Failed to fetch usage stats" }, 500);
  }
});

/**
 * Get current user's plan details
 */
usageApp.get("/plan", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const plan = await getUserPlan(session.user.id);
    return c.json({
      plan: {
        id: plan.id,
        name: plan.name,
        limits: plan.limits,
      },
      freeTierModels: FREE_TIER_MODELS,
      premiumModels: PREMIUM_MODELS,
      allPlans: Object.values(PLANS).map((p) => ({
        id: p.id,
        name: p.name,
        limits: p.limits,
      })),
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return c.json({ error: "Failed to fetch plan" }, 500);
  }
});

/**
 * Check if a specific model can be used
 */
usageApp.get("/check/:modelId", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const modelId = c.req.param("modelId");

  try {
    const result = await checkUsageLimit(session.user.id, modelId);
    return c.json({
      allowed: result.allowed,
      reason: result.reason,
      currentUsage: result.currentUsage,
      plan: {
        id: result.plan.id,
        name: result.plan.name,
      },
    });
  } catch (error) {
    console.error("Error checking usage:", error);
    return c.json({ error: "Failed to check usage" }, 500);
  }
});

export default usageApp;
