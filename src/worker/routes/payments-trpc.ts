import { protectedProcedure, router } from "../trpc";
import { db } from "../db/db";
import { subscriptions, customers } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const payments = router({
  subscription: protectedProcedure.query(async ({ ctx }) => {
    // Get the most recent subscription, prioritizing active ones
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.session.user.id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!userSubscription.length) {
      return {
        hasSubscription: false,
        subscription: null,
      };
    }

    const sub = userSubscription[0];
    const isActive = sub.status === "active";
    const isExpired =
      sub.nextBillingDate && new Date(sub.nextBillingDate) < new Date();

    return {
      hasSubscription: isActive && !isExpired,
      subscription: {
        id: sub.id,
        status: sub.status,
        productId: sub.productId,
        previousBillingDate: sub.previousBillingDate,
        nextBillingDate: sub.nextBillingDate,
        cancelledAt: sub.cancelledAt,
      },
    };
  }),

  customer: protectedProcedure.query(async ({ ctx }) => {
    const userCustomer = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, ctx.session.user.id))
      .limit(1);

    if (!userCustomer.length) {
      return { customerId: null };
    }

    return { customerId: userCustomer[0].id };
  }),
});
