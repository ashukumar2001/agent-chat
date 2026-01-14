import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc-client";

export interface Subscription {
  id: string;
  status: "active" | "cancelled" | "paused" | "pending" | "expired" | "failed";
  productId: string;
  previousBillingDate: string | null;
  nextBillingDate: string | null;
  cancelledAt: string | null;
}

export interface SubscriptionState {
  hasSubscription: boolean;
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useSubscription = (): SubscriptionState => {
  const { data, isLoading, error, refetch } = useQuery(
    trpc.payments.subscription.queryOptions()
  );

  return {
    hasSubscription: data?.hasSubscription ?? false,
    subscription: data?.subscription ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch: async () => {
      await refetch();
    },
  };
};

export interface CustomerState {
  customerId: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useCustomer = (): CustomerState => {
  const { data, isLoading, error } = useQuery(
    trpc.payments.customer.queryOptions()
  );

  return {
    customerId: data?.customerId ?? null,
    isLoading,
    error: error?.message ?? null,
  };
};
