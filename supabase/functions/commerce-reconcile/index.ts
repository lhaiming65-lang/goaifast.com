import { failure, identity, json, preflight } from "../_shared/http.ts";
import { stripeClient, verifyPaymentAmount } from "../_shared/stripe.ts";

/** Admin recovery for missed webhooks, abandoned stock reservations and refunds.
 * No browser can declare a payment paid: every external state is read from Stripe.
 */
export async function handleRequest(request: Request): Promise<Response> {
  const early = preflight(request); if (early) return early;
  try {
    const { db, user } = await identity(request);
    const { data: admin } = await db.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!admin) throw new Error("需要管理员权限");
    const stripe = stripeClient();
    const report = { checked: 0, settled: 0, expired: 0, refunds: 0, needs_review: [] as string[] };
    const { data: pending, error } = await db.from("commerce_payments").select("*").eq("status", "pending").order("last_reconciled_at", { nullsFirst: true }).order("created_at").limit(50);
    if (error) throw new Error(error.message);
    for (const payment of pending ?? []) {
      report.checked++;
      try {
        let sessionId = payment.provider_session_id as string | null;
        if (!sessionId && payment.checkout_claimed_at) {
          // An interrupted creation can leave a provider session without its DB id.
          // Wait past the reservation and maximum function lifetime, then search
          // all sessions in the bounded creation window before releasing anything.
          if (Date.now() < new Date(payment.expires_at).getTime() + 600_000) continue;
          let exhausted = false; let cursor: string | undefined;
          for (let page = 0; page < 10; page++) {
            const batch = await stripe.checkout.sessions.list({ limit: 100, created: { gte: Math.floor(new Date(payment.created_at).getTime() / 1000) - 10, lte: Math.floor(new Date(payment.expires_at).getTime() / 1000) + 600 }, ...(cursor ? { starting_after: cursor } : {}) });
            const match = batch.data.find(s => s.metadata?.payment_id === payment.id);
            if (match) { sessionId = match.id; break; }
            if (!batch.has_more) { exhausted = true; break; }
            cursor = batch.data.at(-1)?.id;
          }
          if (!sessionId && !exhausted) { report.needs_review.push(payment.id); continue; }
        }
        if (!sessionId) {
          if (new Date(payment.expires_at).getTime() > Date.now()) continue;
          const { error: expireError } = await db.rpc("commerce_expire_payment", { p_payment_id: payment.id, p_provider_session_id: null, p_verified_orphan: Boolean(payment.checkout_claimed_at) });
          if (expireError) throw expireError;
          report.expired++; continue;
        }
        let session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.metadata?.payment_id !== payment.id) throw new Error("Session mismatch");
        verifyPaymentAmount(session, payment);
        const { error: saveError } = await db.from("commerce_payments").update({ provider_session_id: session.id }).eq("id", payment.id);
        if (saveError) throw saveError;
        if (session.payment_status === "paid") {
          const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
          const { error: settleError } = await db.rpc("commerce_settle_payment", { p_payment_id: payment.id, p_provider_ref: ref, p_amount_cents: session.amount_total, p_currency: session.currency });
          if (settleError) throw settleError;
          report.settled++;
        } else {
          if (session.status === "open" && new Date(payment.expires_at).getTime() <= Date.now()) session = await stripe.checkout.sessions.expire(session.id);
          if (session.status === "expired") {
            const { error: expireError } = await db.rpc("commerce_expire_payment", { p_payment_id: payment.id, p_provider_session_id: session.id });
            if (expireError) throw expireError;
            report.expired++;
          }
        }
      } catch { report.needs_review.push(payment.id); }
      finally {
        // Rotate through all pending records even if the oldest are unresolved.
        const { error: checkedError } = await db.from("commerce_payments").update({ last_reconciled_at: new Date().toISOString() }).eq("id", payment.id);
        if (checkedError && !report.needs_review.includes(payment.id)) report.needs_review.push(payment.id);
      }
    }
    const { data: refunds, error: refundsError } = await db.from("commerce_refunds").select("*").eq("status", "pending").not("provider_ref", "is", null).limit(50);
    if (refundsError) throw refundsError;
    for (const refund of refunds ?? []) {
      try {
        const current = await stripe.refunds.retrieve(refund.provider_ref);
        const { data: originalPayment } = await db.from("commerce_payments").select("provider_ref").eq("id", refund.payment_id).single();
        const intent = typeof current.payment_intent === "string" ? current.payment_intent : current.payment_intent?.id;
        if (!originalPayment || intent !== originalPayment.provider_ref || current.amount !== Number(refund.amount_cents) || current.currency.toUpperCase() !== refund.currency || current.metadata?.refund_id !== refund.id) throw new Error("Refund mismatch");
        if (["succeeded", "failed", "canceled"].includes(current.status ?? "")) {
          const { error } = await db.rpc("commerce_complete_refund", { p_refund_id: refund.id, p_provider_ref: current.id, p_succeeded: current.status === "succeeded", p_failure_reason: current.failure_reason ?? null });
          if (error) throw error;
          report.refunds++;
        }
      } catch { report.needs_review.push(refund.id); }
    }
    return json(request, report);
  } catch (error) { return failure(request, error); }
}
if (import.meta.main) Deno.serve(handleRequest);
