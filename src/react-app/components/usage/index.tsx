import { memo, useCallback } from "react";
import { Sparkles, Zap, TrendingUp, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useUsageStats,
  calculateUsagePercentage,
  getProgressColorClass,
} from "@/hooks/use-usage";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
  periodLabel?: string;
}

const UsageBar = memo(function UsageBar({
  label,
  used,
  limit,
  icon,
  periodLabel,
}: UsageBarProps) {
  const percentage = calculateUsagePercentage(used, limit);
  const progressColor = getProgressColorClass(percentage);
  const remaining = Math.max(0, limit - used);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground">
                {used.toLocaleString()} / {limit.toLocaleString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {remaining.toLocaleString()} remaining {periodLabel}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn("h-full transition-all duration-300", progressColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
});

interface UsageCardProps {
  compact?: boolean;
  className?: string;
}

export const UsageCard = memo(function UsageCard({
  compact = false,
  className,
}: UsageCardProps) {
  const { stats, isLoading, error } = useUsageStats();
  const { openModal } = useModal();

  const handleUpgrade = useCallback(() => {
    openModal("pricing");
  }, [openModal]);

  if (error) {
    return null; // Silently fail - don't show errors in UI
  }

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className={compact ? "pb-2" : undefined}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const periodStart = new Date(stats.period.start);
  const periodEnd = new Date(stats.period.end);
  const isPro = stats.plan.id === "pro";
  const periodLabel = isPro ? "this month" : "today";

  // Format period display
  const periodDisplay = isPro
    ? `${periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : `Resets at ${periodEnd.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

  const fastPercentage = calculateUsagePercentage(
    stats.usage.fastModelRequests,
    stats.limits.fastModelRequests
  );
  const premiumPercentage = calculateUsagePercentage(
    stats.usage.premiumModelRequests,
    stats.limits.premiumModelRequests
  );
  const isFastNearLimit = fastPercentage >= 75;
  const isPremiumNearLimit = premiumPercentage >= 75;
  const isNearLimit = isFastNearLimit || isPremiumNearLimit;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-colors",
                isNearLimit
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1",
                  isFastNearLimit && "text-destructive"
                )}
              >
                <Zap className="h-3 w-3" />
                <span>
                  {stats.usage.fastModelRequests}/
                  {stats.limits.fastModelRequests}
                </span>
              </div>
              {stats.limits.premiumModelRequests > 0 && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <div
                    className={cn(
                      "flex items-center gap-1",
                      isPremiumNearLimit && "text-destructive"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>
                      {stats.usage.premiumModelRequests}/
                      {stats.limits.premiumModelRequests}
                    </span>
                  </div>
                </>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{stats.plan.name} Plan</p>
              <p className="text-xs text-muted/60">
                Fast: {stats.usage.fastModelRequests} of{" "}
                {stats.limits.fastModelRequests} used {periodLabel}
              </p>
              {stats.limits.premiumModelRequests > 0 && (
                <p className="text-xs text-muted/60">
                  Premium: {stats.usage.premiumModelRequests} of{" "}
                  {stats.limits.premiumModelRequests} used {periodLabel}
                </p>
              )}
              <p className="text-xs text-muted/60 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {periodDisplay}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Usage
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {periodDisplay}
            </CardDescription>
          </div>
          <Badge
            variant={isPro ? "default" : "secondary"}
            className={cn(
              "px-3",
              isPro && "bg-linear-to-r from-primary to-primary/80"
            )}
          >
            {stats.plan.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <UsageBar
          label={isPro ? "Fast Models" : "Messages"}
          used={stats.usage.fastModelRequests}
          limit={stats.limits.fastModelRequests}
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
          periodLabel={periodLabel}
        />

        {isPro && stats.limits.premiumModelRequests > 0 && (
          <UsageBar
            label="Premium Models"
            used={stats.usage.premiumModelRequests}
            limit={stats.limits.premiumModelRequests}
            icon={<Sparkles className="h-4 w-4 text-muted-foreground" />}
            periodLabel={periodLabel}
          />
        )}

        {!isPro && isNearLimit && (
          <Button
            onClick={handleUpgrade}
            className="w-full gap-2"
            variant="default"
          >
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

/**
 * Inline usage indicator for headers/sidebars
 */
export const UsageIndicator = memo(function UsageIndicator() {
  return <UsageCard compact />;
});

export default UsageCard;
