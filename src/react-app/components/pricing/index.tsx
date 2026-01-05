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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSession";

// Product IDs from Dodo Payments dashboard
// Replace these with your actual product IDs
const PRODUCTS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceLabel: "$0",
    period: "forever",
    description: "Try AI chat at no cost",
    features: [
      "5 messages per day",
      "DeepSeek & Gemini Flash only",
      "24-hour message history",
      "Basic web search",
    ],
    icon: Zap,
    highlight: false,
  },
  pro: {
    // Use test product ID for development, live for production
    id: import.meta.env.VITE_DODO_PRO_PRODUCT_ID || "pdt_0NVZisCmPSb7gDRkzIgKE",
    name: "Pro",
    price: 3,
    priceLabel: "$3",
    period: "month",
    description: "Great value for daily use",
    features: [
      "1,200 fast model messages/month",
      "50 premium model messages/month",
      "GPT-4o, Claude Sonnet, Gemini Pro",
      "30-day message history",
      "Web search & file uploads",
      "Unlimited with your own API keys",
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
        "relative flex flex-col transition-all duration-300",
        product.highlight &&
          "border-primary shadow-lg shadow-primary/10 scale-[1.02]",
        "hover:shadow-xl hover:-translate-y-1"
      )}
    >
      {product.highlight && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
          Most Popular
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <div
          className={cn(
            "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full",
            product.highlight
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">{product.name}</CardTitle>
        <CardDescription className="min-h-[40px]">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6 text-center">
          <span className="text-4xl font-bold tracking-tight">
            {product.priceLabel}
          </span>
          <span className="text-muted-foreground">/{product.period}</span>
        </div>

        <ul className="space-y-3">
          {product.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
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

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PricingModal = memo(function PricingModal({
  open,
  onOpenChange,
}: PricingModalProps) {
  const { user } = useSession();
  const { subscription, hasSubscription, refetch } = useSubscription();
  const { customerId } = useCustomer();
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
          console.log("Checkout event:", event);
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
        // Create checkout session via our backend
        const response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
            customer: {
              email: user.email,
              name: user.name || "",
            },
            billing: {
              city: "",
              country: "US",
              state: "",
              street: "",
              zipcode: "",
            },
            metadata: {
              userId: user.id,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create checkout session");
        }

        const data = (await response.json()) as { checkout_url: string };

        // Open Dodo Payments overlay checkout
        DodoPayments.Checkout.open({
          checkoutUrl: data.checkout_url,
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

  const handleManageSubscription = useCallback(() => {
    if (customerId) {
      window.open(`/api/payments/portal?customerId=${customerId}`, "_blank");
    }
  }, [customerId]);

  const currentPlanId = hasSubscription ? subscription?.productId : "free";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-3xl font-bold">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-lg">
            Unlock the full potential of AI-powered conversations
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-3 py-4">
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

        {hasSubscription && customerId && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={handleManageSubscription}
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
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
  const [showPricing, setShowPricing] = useState(false);
  const { hasSubscription } = useSubscription();

  if (hasSubscription) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        className={cn("gap-2", className)}
        onClick={() => setShowPricing(true)}
      >
        <Sparkles className="h-4 w-4" />
        Upgrade
      </Button>
      <PricingModal open={showPricing} onOpenChange={setShowPricing} />
    </>
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
