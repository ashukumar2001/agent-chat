import { Hono } from "hono";
import { Webhooks } from "@dodopayments/hono";
import { db } from "../db/db";
import { customers, subscriptions, payments, usage } from "../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getDodoConfig } from "../lib/dodo-payments";
import { getPeriodBoundaries, getPlanByProductId } from "../lib/plans";
import { nanoid } from "nanoid";

const paymentsApp = new Hono<{ Bindings: Env }>();

/**
 * Resolve the app userId for a Dodo event. Prefer the mapping established in
 * the `customers` table (keyed by Dodo customer id); fall back to the
 * checkout metadata only if no customer is known yet. Never throws on a
 * missing id so a malformed event can't fail the webhook.
 */
const resolveUserId = async (
  customerId: string,
  metadataUserId: string | undefined,
): Promise<string | null> => {
  if (customerId) {
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);
    if (customer.length) return customer[0].userId;
  }
  return metadataUserId && metadataUserId.trim() ? metadataUserId : null;
};

// /api/payments/webhooks
// Webhook handler for payment events
paymentsApp.post(
  "/webhooks",
  Webhooks({
    webhookKey: getDodoConfig().webhookKey,

    // Handle successful payment
    onPaymentSucceeded: async (payload) => {
      console.log("Payment succeeded:", payload.data.payment_id);

      const paymentData = payload.data;
      const userId = await resolveUserId(
        paymentData.customer.customer_id,
        paymentData.metadata?.userId as string | undefined,
      );
      if (!userId) {
        console.warn("Payment succeeded: no userId resolved, skipping");
        return;
      }

      // Store payment record
      await db
        .insert(payments)
        .values({
          id: paymentData.payment_id,
          userId,
          customerId: paymentData.customer.customer_id,
          productId: paymentData.product_cart?.[0]?.product_id ?? "",
          amount: paymentData.total_amount,
          currency: paymentData.currency,
          status: "succeeded",
          createdAt: paymentData.created_at,
        })
        .onConflictDoUpdate({
          target: payments.id,
          set: {
            status: "succeeded",
          },
        });
    },

    // Handle failed payment
    onPaymentFailed: async (payload) => {
      console.log("Payment failed:", payload.data.payment_id);

      const paymentData = payload.data;
      const userId = await resolveUserId(
        paymentData.customer.customer_id,
        paymentData.metadata?.userId as string | undefined,
      );
      if (!userId) {
        console.warn("Payment failed: no userId resolved, skipping");
        return;
      }

      await db
        .insert(payments)
        .values({
          id: paymentData.payment_id,
          userId,
          customerId: paymentData.customer.customer_id,
          productId: paymentData.product_cart?.[0]?.product_id ?? "",
          amount: paymentData.total_amount,
          currency: paymentData.currency,
          status: "failed",
          createdAt: paymentData.created_at,
        })
        .onConflictDoUpdate({
          target: payments.id,
          set: {
            status: "failed",
          },
        });
    },

    // Handle subscription activated
    onSubscriptionActive: async (payload) => {
      console.log("Subscription active:", payload.data.subscription_id);

      const subData = payload.data;
      const userId = await resolveUserId(
        subData.customer.customer_id,
        subData.metadata?.userId as string | undefined,
      );
      if (!userId) {
        console.warn("Subscription active: no userId resolved, skipping");
        return;
      }

      // Upsert customer
      await db
        .insert(customers)
        .values({
          id: subData.customer.customer_id,
          userId,
          email: subData.customer.email,
          name: subData.customer.name,
          createdAt: new Date(),
        })
        .onConflictDoNothing();

      // Upsert subscription
      await db
        .insert(subscriptions)
        .values({
          id: subData.subscription_id,
          userId,
          customerId: subData.customer.customer_id,
          productId: subData.product_id,
          status: "active",
          previousBillingDate: subData.previous_billing_date,
          nextBillingDate: subData.next_billing_date,
          createdAt: subData.created_at,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: subscriptions.id,
          set: {
            status: "active",
            previousBillingDate: subData.previous_billing_date,
            nextBillingDate: subData.next_billing_date,
            updatedAt: new Date(),
          },
        });
    },

    // Handle subscription renewed
    onSubscriptionRenewed: async (payload) => {
      console.log("Subscription renewed:", payload.data.subscription_id);

      const subData = payload.data;

      // Update subscription status
      await db
        .update(subscriptions)
        .set({
          status: "active",
          previousBillingDate: subData.previous_billing_date,
          nextBillingDate: subData.next_billing_date,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subData.subscription_id));

      // Create a new usage record for the new billing period
      // This effectively resets usage for the new period
      const userId = await resolveUserId(
        subData.customer.customer_id,
        subData.metadata?.userId as string | undefined,
      );
      if (userId) {
        const plan = getPlanByProductId(subData.product_id);
        // Align the usage window with the actual billing cycle, not the
        // calendar month, so the renewal resets exactly once per cycle.
        const { start, end } = getPeriodBoundaries(plan, {
          previousBillingDate: subData.previous_billing_date,
          nextBillingDate: subData.next_billing_date,
        });

        // Check if a usage record already exists for this period
        const existingUsage = await db
          .select()
          .from(usage)
          .where(
            and(
              eq(usage.userId, userId),
              gte(usage.periodStart, start),
              lte(usage.periodEnd, end)
            )
          )
          .limit(1);

        // Only create new record if one doesn't exist
        if (existingUsage.length === 0) {
          await db.insert(usage).values({
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
          });
        }
      }
    },

    // Handle subscription cancelled
    onSubscriptionCancelled: async (payload) => {
      console.log("Subscription cancelled:", payload.data.subscription_id);

      const subData = payload.data;

      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: subData.cancelled_at ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subData.subscription_id));
    },

    // Handle subscription paused
    onSubscriptionPaused: async (payload) => {
      console.log("Subscription paused:", payload.data.subscription_id);

      const subData = payload.data;

      await db
        .update(subscriptions)
        .set({
          status: "paused",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subData.subscription_id));
    },

    // Handle subscription expired
    onSubscriptionExpired: async (payload) => {
      console.log("Subscription expired:", payload.data.subscription_id);

      const subData = payload.data;

      await db
        .update(subscriptions)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subData.subscription_id));
    },

    // Handle subscription failed
    onSubscriptionFailed: async (payload) => {
      console.log("Subscription failed:", payload.data.subscription_id);

      const subData = payload.data;

      await db
        .update(subscriptions)
        .set({
          status: "failed",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subData.subscription_id));
    },

    // Handle refund succeeded
    onRefundSucceeded: async (payload) => {
      console.log("Refund succeeded:", payload.data.refund_id);

      const refundData = payload.data;

      await db
        .update(payments)
        .set({
          status: "refunded",
        })
        .where(eq(payments.id, refundData.payment_id));
    },
  })
);

export default paymentsApp;
