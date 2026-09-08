import { json, requiredEnv, serviceClient } from "../_shared/http.ts";
import { stripeClient, stripeCrypto, verifyPaymentAmount, type Stripe } from "../_shared/stripe.ts";

export async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json(request, { error: "Missing signature" }, 400);
  let event: Stripe.Event;
  try {
    const raw = await request.text();
    if (raw.length > 1048576) return json(request, { error: "Payload too large" }, 413);
    event = await stripeClient().webhooks.constructEventAsync(raw, signature, requiredEnv("STRIPE_WEBHOOK_SECRET"), undefined, stripeCrypto());
  } catch { return json(request, { error: "Invalid webhook signature or configuration" }, 400); }
  try {
    const db = serviceClient();
    if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired", "checkout.session.async_payment_failed"].includes(event.type)) {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;
      if (!paymentId) return json(request, { received: true, ignored: true });
      const { data: payment, error } = await db.from("commerce_payments").select("*").eq("id", paymentId).single();
      if (error || !payment) throw new Error("Payment not found");
      if (payment.provider !== "stripe" || (payment.provider_session_id && payment.provider_session_id !== session.id)) throw new Error("Payment session mismatch");
      verifyPaymentAmount(session, payment);
      // Persist identity even if the creation request died before writing it.
      const { error: recordError } = await db.from("commerce_payments").update({ provider_session_id: session.id }).eq("id", payment.id);
      if (recordError) throw recordError;
      if (session.payment_status === "paid") {
        const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
        if (!ref) throw new Error("Payment intent missing");
        const { error: settleError } = await db.rpc("commerce_settle_payment", { p_payment_id: payment.id, p_provider_ref: ref, p_amount_cents: session.amount_total, p_currency: session.currency });
        if (settleError) throw settleError;
      } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        const { error: expireError } = await db.rpc("commerce_expire_payment", { p_payment_id: payment.id, p_provider_session_id: session.id });
        if (expireError) throw expireError;
      }
    } else if (["refund.created", "refund.updated", "refund.failed"].includes(event.type)) {
      const incoming = event.data.object as Stripe.Refund;
      const refundId = incoming.metadata?.refund_id;
      if (!refundId) return json(request, { received: true, ignored: true });
      // Events can arrive out of order; use the current provider state.
      const refund = await stripeClient().refunds.retrieve(incoming.id);
      const { data: expected } = await db.from("commerce_refunds").select("*").eq("id", refundId).single();
      if (!expected) throw new Error("Refund not found");
      const { data: payment } = await db.from("commerce_payments").select("*").eq("id", expected.payment_id).single();
      const intent = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
      if (!payment || refund.metadata?.refund_id !== expected.id || intent !== payment.provider_ref || refund.amount !== Number(expected.amount_cents) || refund.currency.toLowerCase() !== payment.currency.toLowerCase()) throw new Error("Refund mismatch");
      if (["succeeded", "failed", "canceled"].includes(refund.status ?? "")) {
        const { error } = await db.rpc("commerce_complete_refund", { p_refund_id: expected.id, p_provider_ref: refund.id, p_succeeded: refund.status === "succeeded", p_failure_reason: refund.failure_reason ?? null });
        if (error) throw error;
      }
    }
    const { error: auditError } = await db.from("commerce_webhook_events").upsert({ provider_event_id: event.id, event_type: event.type }, { onConflict: "provider_event_id", ignoreDuplicates: true });
    if (auditError) throw auditError;
    return json(request, { received: true });
  } catch {
    // Non-2xx makes Stripe retry. No credentials or delivered secrets enter logs.
    return json(request, { error: "Event processing failed; retry required", event_id: event.id }, 500);
  }
}

if (import.meta.main) Deno.serve(handleRequest);
