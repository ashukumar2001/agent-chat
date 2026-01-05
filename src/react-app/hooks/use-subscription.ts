import { useState, useEffect, useCallback } from "react";

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
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/payments/subscription");

      if (!response.ok) {
        if (response.status === 401) {
          setHasSubscription(false);
          setSubscription(null);
          return;
        }
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      setHasSubscription(data.hasSubscription);
      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasSubscription(false);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    hasSubscription,
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
  };
};

export interface CustomerState {
  customerId: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useCustomer = (): CustomerState => {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/payments/customer");

        if (!response.ok) {
          if (response.status === 401) {
            setCustomerId(null);
            return;
          }
          throw new Error("Failed to fetch customer");
        }

        const data = await response.json();
        setCustomerId(data.customerId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setCustomerId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, []);

  return { customerId, isLoading, error };
};

