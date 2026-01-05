import { Hono } from "hono";
import { Checkout, CustomerPortal, Webhooks } from "@dodopayments/hono";
import { getDodoConfig } from "../lib/dodo-payments";
import { db } from "../db/db";
import { customers, subscriptions, payments, usage } from "../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "../lib/auth";
import { PLANS, getPeriodBoundaries, getPlanByProductId } from "../lib/plans";
import { nanoid } from "nanoid";

const paymentsApp = new Hono<{ Bindings: Env }>();

// Checkout endpoint - creates a checkout session
// Usage: POST /api/payments/checkout with body { product_id, customer, billing, metadata }
paymentsApp.post("/checkout", async (c, next) => {
  const config = getDodoConfig();
  console.log("Checkout config:", {
    environment: config.environment,
    hasApiKey: !!config.bearerToken,
    returnUrl: `${process.env.BETTER_AUTH_URL}/chat`,
  });

  // Log request body for debugging (remove in production)
  const body = await c.req.json();
  console.log("Checkout request body:", JSON.stringify(body, null, 2));

  // Reconstruct request with the body
  const newRequest = new Request(c.req.url, {
    method: "POST",
    headers: c.req.raw.headers,
    body: JSON.stringify(body),
  });

  // Create a new context with the cloned request
  c.req.raw = newRequest;

  try {
    const checkoutHandler = Checkout({
      ...config,
      returnUrl: `${process.env.BETTER_AUTH_URL}/chat`,
      type: "dynamic",
    });

    return await checkoutHandler(c);
  } catch (error) {
    console.error("Error when creating checkout:", error);
    return c.json(
      {
        error: "Checkout failed",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        hint: "Check if the product ID exists in your DodoPayments dashboard and matches the environment mode (test/live)",
      },
      400
    );
  }
});

// Customer Portal - redirects to customer's billing portal
// Usage: GET /api/payments/portal?customerId=cust_xxx
paymentsApp.get(
  "/portal",
  CustomerPortal({
    ...getDodoConfig(),
  })
);

// Webhook handler for payment events
paymentsApp.post(
  "/webhooks",
  Webhooks({
    webhookKey: getDodoConfig().webhookKey,

    // Handle successful payment
    onPaymentSucceeded: async (payload) => {
      console.log("Payment succeeded:", payload.data.payment_id);

      const paymentData = payload.data;

      // Store payment record
      await db
        .insert(payments)
        .values({
          id: paymentData.payment_id,
          userId: paymentData.metadata?.userId as string,
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

      await db
        .insert(payments)
        .values({
          id: paymentData.payment_id,
          userId: paymentData.metadata?.userId as string,
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

      // Upsert customer
      await db
        .insert(customers)
        .values({
          id: subData.customer.customer_id,
          userId: subData.metadata?.userId as string,
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
          userId: subData.metadata?.userId as string,
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
      const userId = subData.metadata?.userId as string;
      if (userId) {
        const plan = getPlanByProductId(subData.product_id);
        const { start, end } = getPeriodBoundaries(plan);

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

// Get current user's subscription status
paymentsApp.get("/subscription", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  if (!userSubscription.length) {
    return c.json({
      hasSubscription: false,
      subscription: null,
    });
  }

  const sub = userSubscription[0];
  const isActive = sub.status === "active";
  const isExpired =
    sub.nextBillingDate && new Date(sub.nextBillingDate) < new Date();

  return c.json({
    hasSubscription: isActive && !isExpired,
    subscription: {
      id: sub.id,
      status: sub.status,
      productId: sub.productId,
      previousBillingDate: sub.previousBillingDate,
      nextBillingDate: sub.nextBillingDate,
      cancelledAt: sub.cancelledAt,
    },
  });
});

// Get user's customer ID for portal access
paymentsApp.get("/customer", async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userCustomer = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, session.user.id))
    .limit(1);

  if (!userCustomer.length) {
    return c.json({ customerId: null });
  }

  return c.json({ customerId: userCustomer[0].id });
});

export default paymentsApp;
