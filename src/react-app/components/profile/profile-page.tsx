import { useSession } from "@/hooks/useSession";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, User, LogOut, Zap, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { useModal } from "@/hooks/use-modal";
import {
  useUsageStats,
  calculateUsagePercentage,
  getProgressColorClass,
} from "@/hooks/use-usage";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { UpgradeButton } from "@/components/pricing";

export const ProfilePage = () => {
  const { user, isPending } = useSession();
  const { stats, isLoading: isLoadingUsage } = useUsageStats();
  const { subscription, isLoading: isLoadingSubscription } = useSubscription();
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/" });
  };

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isPending || isLoadingUsage || isLoadingSubscription) {
    return (
      <div className="container mx-auto max-w-2xl py-4">
        <div className="space-y-8">
          <div className="flex items-center gap-4 pb-6 border-b">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl px-6 py-12">
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 rounded-full bg-muted/50 mb-6">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Not signed in</h2>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
            You need to be signed in to view your profile.
          </p>
          <Button
            onClick={() => {
              closeModal();
              openModal("login");
            }}
            className="gap-2"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-4">
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="flex items-start justify-between gap-6 pb-8 border-b">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={user.image || undefined} alt={user.name} />
              <AvatarFallback className="text-base font-semibold">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold truncate">{user.name}</h1>
                {stats && (
                  <Badge
                    variant={stats.plan.id === "pro" ? "default" : "secondary"}
                    className={cn(
                      "text-xs px-2 py-0.5",
                      stats.plan.id === "pro" &&
                        "bg-linear-to-r from-primary to-primary/80 text-primary-foreground"
                    )}
                  >
                    {stats.plan.name}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Usage Statistics */}
        {stats && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Usage</h2>
              <span className="text-sm text-muted-foreground">
                {new Date(stats.period.start).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                -{" "}
                {new Date(stats.period.end).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="space-y-6">
              {/* Fast Model Requests */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {stats.plan.id === "pro" ? "Fast Requests" : "Messages"}
                    </span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {stats.usage.fastModelRequests.toLocaleString()} /{" "}
                    {stats.limits.fastModelRequests.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      getProgressColorClass(
                        calculateUsagePercentage(
                          stats.usage.fastModelRequests,
                          stats.limits.fastModelRequests
                        )
                      )
                    )}
                    style={{
                      width: `${calculateUsagePercentage(
                        stats.usage.fastModelRequests,
                        stats.limits.fastModelRequests
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Premium Model Requests */}
              {stats.plan.id === "pro" &&
                stats.limits.premiumModelRequests > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Premium Requests
                        </span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {stats.usage.premiumModelRequests.toLocaleString()} /{" "}
                        {stats.limits.premiumModelRequests.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                      <div
                        className={cn(
                          "h-full transition-all duration-300 rounded-full",
                          getProgressColorClass(
                            calculateUsagePercentage(
                              stats.usage.premiumModelRequests,
                              stats.limits.premiumModelRequests
                            )
                          )
                        )}
                        style={{
                          width: `${calculateUsagePercentage(
                            stats.usage.premiumModelRequests,
                            stats.limits.premiumModelRequests
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              {/* Upgrade Button */}
              <div className="pt-2">
                <UpgradeButton className="w-full sm:w-auto bg-linear-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
