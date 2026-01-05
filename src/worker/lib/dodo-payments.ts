import DodoPayments from "dodopayments";

/**
 * Get Dodo Payments client instance
 * Uses environment variable for API key
 */
export const getDodoClient = () => {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

  if (!bearerToken) {
    throw new Error("DODO_PAYMENTS_API_KEY environment variable is not set");
  }

  return new DodoPayments({
    bearerToken,
    environment:
      process.env.CLOUDFLARE_ENV === "prod" ? "live_mode" : "test_mode",
  });
};

/**
 * Dodo Payments configuration
 */
export const getDodoConfig = () => ({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  environment:
    process.env.CLOUDFLARE_ENV === "prod"
      ? ("live_mode" as const)
      : ("test_mode" as const),
});
