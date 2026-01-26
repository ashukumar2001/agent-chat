import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export interface UsageStats {
  usage: {
    fastModelRequests: number;
    premiumModelRequests: number;
    inputTokens: number;
    outputTokens: number;
  };
  limits: {
    fastModelRequests: number;
    premiumModelRequests: number;
  };
  period: {
    start: string;
    end: string;
  };
  plan: {
    id: string;
    name: string;
  };
}

export interface PlanInfo {
  plan: {
    id: string;
    name: string;
    limits: {
      fastModelRequests: number;
      premiumModelRequests: number;
      periodType: "day" | "month";
      allowedModels: string[] | null;
      historyRetentionDays: number;
    };
  };
  freeTierModels: string[];
  premiumModels: string[];
  allPlans: {
    id: string;
    name: string;
    limits: {
      fastModelRequests: number;
      premiumModelRequests: number;
      periodType: "day" | "month";
      allowedModels: string[] | null;
      historyRetentionDays: number;
    };
  }[];
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
  plan: {
    id: string;
    name: string;
  };
}

const fetchUsageStats = async (): Promise<UsageStats> => {
  const response = await fetch("/api/usage");
  if (!response.ok) {
    throw new Error("Failed to fetch usage stats");
  }
  return response.json();
};

const fetchPlanInfo = async (): Promise<PlanInfo> => {
  const response = await fetch("/api/usage/plan");
  if (!response.ok) {
    throw new Error("Failed to fetch plan info");
  }
  return response.json();
};

const checkModelUsage = async (modelId: string): Promise<UsageCheckResult> => {
  const response = await fetch(
    `/api/usage/check/${encodeURIComponent(modelId)}`,
  );
  if (!response.ok) {
    throw new Error("Failed to check model usage");
  }
  return response.json();
};

export const USAGE_STATS_QUERY_KEY = ["usage-stats"];

export const useUsageStats = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: USAGE_STATS_QUERY_KEY,
    queryFn: fetchUsageStats,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
};

export const usePlanInfo = () => {
  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  const { data, isLoading, error } = useQuery({
    queryKey: ["plan-info"],
    queryFn: fetchPlanInfo,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    enabled: isLoggedIn, // Only fetch when user is logged in
  });

  return {
    planInfo: data,
    isLoading: isLoggedIn ? isLoading : false,
    error,
  };
};

export const useModelUsageCheck = (modelId: string | null, enabled = true) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["usage-check", modelId],
    queryFn: () => checkModelUsage(modelId!),
    enabled: enabled && !!modelId,
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
  });

  return {
    usageCheck: data,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Calculate percentage of usage for a given metric
 */
export const calculateUsagePercentage = (
  used: number,
  limit: number,
): number => {
  if (limit === 0) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
};

/**
 * Get color class based on usage percentage
 */
export const getUsageColorClass = (percentage: number): string => {
  if (percentage >= 90) return "text-destructive";
  if (percentage >= 75) return "text-warning";
  return "text-primary";
};

/**
 * Get progress bar color class based on usage percentage
 */
export const getProgressColorClass = (percentage: number): string => {
  if (percentage >= 90) return "bg-destructive";
  if (percentage >= 75) return "bg-amber-500";
  return "bg-primary";
};
