import { memo, useCallback, useEffect, useState } from "react";
import { DodoPayments } from "dodopayments-checkout";
import { Check, Sparkles, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription, useCustomer } from "@/hooks/use-subscription";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";
import { authClient } from "@/lib/auth-client";

// Product IDs
// Replace these with your actual product IDs
const PRODUCTS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "forever",
    description: "Try AI chat at no cost",
    features: ["10 messages per day", "Access to fast models"],
    icon: Zap,
    highlight: false,
  },
  pro: {
    // Use test product ID for development, live for production
    id: import.meta.env.VITE_DODO_PRO_PRODUCT_ID,
    name: "Pro",
    price: 3,
    priceLabel: "$3",
    period: "month",
    description: "Great value for daily use",
    features: [
      `1000 fast model messages/month`,
      "50 premium model messages/month",
      "Bring your own API keys",
      "Web search capabilities",
    ],
    icon: Sparkles,
    highlight: true,
  },
} as const;
type ProductKey = keyof typeof PRODUCTS;

interface PricingCardProps {
  product: (typeof PRODUCTS)[ProductKey];
  isCurrentPlan: boolean;
  onSubscribe: (productId: string) => void;
  isLoading: boolean;
}

const PricingCard = memo(function PricingCard({
  product,
  isCurrentPlan,
  onSubscribe,
  isLoading,
}: PricingCardProps) {
  const Icon = product.icon;

  return (
    <Card
      className={cn(
        "relative flex flex-col border-2 transition-colors",
        product.highlight
          ? "border-primary/20 bg-primary/5"
          : "border-border/50 bg-card",
        "hover:border-primary/40"
      )}
    >
      {product.highlight && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2">
          <span className="bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader className="text-center pb-6 pt-8">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-xl font-semibold tracking-tight">
            {product.name}
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground min-h-10">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-8">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-5xl font-light tracking-tight">
              {product.priceLabel}
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              /{product.period}
            </span>
          </div>
        </div>

        <ul className="space-y-4">
          {product.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-8">
        <Button
          className="w-full"
          variant={product.highlight ? "default" : "outline"}
          size="lg"
          disabled={isCurrentPlan || isLoading || product.id === "free"}
          onClick={() => onSubscribe(product.id)}
        >
          {isCurrentPlan ? (
            "Current Plan"
          ) : product.id === "free" ? (
            "Free Forever"
          ) : isLoading ? (
            "Loading..."
          ) : (
            <>
              Get {product.name}
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
});

export const PricingModal = memo(function PricingModal() {
  const { user } = useSession();
  const { subscription, hasSubscription, refetch } = useSubscription();
  // const { customerId } = useCustomer();
  const { isPricingOpen, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Dodo Payments checkout
  useEffect(() => {
    if (!isInitialized) {
      DodoPayments.Initialize({
        mode:
          import.meta.env.VITE_DODO_MODE === "live" || import.meta.env.PROD
            ? "live"
            : "test",
        displayType: "overlay",
        onEvent: (event) => {
          const eventType = (event as { type?: string }).type;

          if (eventType === "checkout.closed") {
            setIsLoading(false);
            // Refetch subscription after checkout closes
            setTimeout(() => refetch(), 1000);
          }

          if (eventType === "checkout.error") {
            toast.error("Payment error", {
              description: "Something went wrong. Please try again.",
            });
            setIsLoading(false);
          }

          if (eventType === "checkout.redirect") {
            // Payment successful, will redirect
            toast.success("Payment successful!", {
              description: "Your subscription is now active.",
            });
          }
        },
      });
      setIsInitialized(true);
    }
  }, [isInitialized, refetch]);

  const handleSubscribe = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error("Please sign in", {
          description: "You need to be signed in to subscribe.",
        });
        return;
      }

      setIsLoading(true);

      try {
        await authClient.dodopayments.checkoutSession({
          product_cart: [
            {
              product_id: productId,
              quantity: 1,
            },
          ],
          metadata: {
            userId: user.id,
          },
        });
      } catch (error) {
        console.error("Checkout error:", error);
        toast.error("Checkout failed", {
          description: "Unable to start checkout. Please try again.",
        });
        setIsLoading(false);
      }
    },
    [user]
  );

  const currentPlanId = hasSubscription ? subscription?.productId : "free";

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeModal();
      }
    },
    [closeModal]
  );

  return (
    <Dialog open={isPricingOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="text-center px-6 pt-8 pb-8">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Unlock the full potential of AI-powered conversations
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 md:grid-cols-2 px-6 pb-8">
          {Object.values(PRODUCTS).map((product) => (
            <PricingCard
              key={product.id}
              product={product}
              isCurrentPlan={currentPlanId === product.id}
              onSubscribe={handleSubscribe}
              isLoading={isLoading}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
});

// Simple upgrade button to trigger the pricing modal
interface UpgradeButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
}

export const UpgradeButton = memo(function UpgradeButton({
  className,
  variant = "default",
}: UpgradeButtonProps) {
  const { openModal } = useModal();
  const { hasSubscription } = useSubscription();
  const { customerId } = useCustomer();
  const handleManageSubscription = useCallback(async () => {
    if (customerId) {
      await authClient.dodopayments.customer.portal();
    }
  }, [customerId]);
  const handleClick = useCallback(() => {
    openModal("pricing");
  }, [openModal]);

  return (
    <Button
      variant={variant}
      className={cn("gap-2", className)}
      onClick={hasSubscription ? handleManageSubscription : handleClick}
    >
      {hasSubscription ? (
        "Manage Plan"
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Upgrade
        </>
      )}
    </Button>
  );
});

// Subscription status badge
export const SubscriptionBadge = memo(function SubscriptionBadge() {
  const { hasSubscription, subscription, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  if (!hasSubscription) {
    return (
      <Badge variant="secondary" className="text-xs">
        Free
      </Badge>
    );
  }

  const product = Object.values(PRODUCTS).find(
    (p) => p.id === subscription?.productId
  );

  return (
    <Badge
      variant="default"
      className="text-xs bg-linear-to-r from-primary to-primary/80"
    >
      {product?.name || "Pro"}
    </Badge>
  );
});
