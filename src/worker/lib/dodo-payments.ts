import DodoPayments from "dodopayments";
import { env } from "cloudflare:workers";
/**
 * Get Dodo Payments client instance
 * Uses environment variable for API key
 */
export const getDodoClient = () => {
  const bearerToken = env.DODO_PAYMENTS_API_KEY;

  if (!bearerToken) {
    throw new Error("DODO_PAYMENTS_API_KEY environment variable is not set");
  }

  return new DodoPayments({
    bearerToken,
    environment:
      env.CLOUDFLARE_ENV === "production" ? "live_mode" : "test_mode",
  });
};

/**
 * Dodo Payments configuration
 */
export const getDodoConfig = () => ({
  bearerToken: env.DODO_PAYMENTS_API_KEY!,
  webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY!,
  environment:
    process.env.CLOUDFLARE_ENV === "production"
      ? ("live_mode" as const)
      : ("test_mode" as const),
});
