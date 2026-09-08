import Stripe from "npm:stripe@22.6.1";
import { requiredEnv } from "./http.ts";

export const stripeClient = () => new Stripe(requiredEnv("STRIPE_SECRET_KEY"), { httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 2 });
export const stripeCrypto = () => Stripe.createSubtleCryptoProvider();
export type { Stripe };

export function verifyPaymentAmount(actual: { amount_total: number | null; currency: string | null }, expected: { amount_cents: number; currency: string }) {
  if (actual.amount_total !== Number(expected.amount_cents) || actual.currency?.toLowerCase() !== expected.currency.toLowerCase()) throw new Error("支付金额或币种不匹配");
}
