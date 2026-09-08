import { appUrl, bodyOf, failure, identity, json, preflight, uuid } from "../_shared/http.ts";
import { stripeClient, verifyPaymentAmount, type Stripe } from "../_shared/stripe.ts";

export async function handleRequest(request: Request): Promise<Response> {
  const early = preflight(request); if (early) return early;
  try {
    const { db, user } = await identity(request);
    const payload = await bodyOf(request);
    const paymentId = uuid(payload.payment_id);
    const stripe = stripeClient();
    const base = appUrl();
    const { data: payment, error } = await db.rpc("commerce_claim_payment", { p_payment_id: paymentId, p_user_id: user.id });
    if (error) throw new Error(error.message);
    if (!payment || payment.provider !== "stripe") throw new Error("该交易不能使用 Stripe 支付");
    const target = payment.order_id ? `/order/${payment.order_id}` : "/wallet";
    let session: Stripe.Checkout.Session;
    if (payment.provider_session_id) {
      session = await stripe.checkout.sessions.retrieve(payment.provider_session_id);
    } else {
      const expiresAt = Math.floor(new Date(payment.expires_at).getTime() / 1000);
      if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) + 1800) {
        // No provider session was recorded. Let operations reconcile claimed payments;
        // releasing stock here could race a concurrent Checkout creation.
        throw new Error("支付预留已接近到期，请稍后取消订单或联系管理员核对。");
      }
      session = await stripe.checkout.sessions.create({
        mode: "payment", payment_method_types: ["card"],
        client_reference_id: payment.id,
        metadata: { payment_id: payment.id },
        payment_intent_data: { metadata: { payment_id: payment.id } },
        line_items: [{ quantity: 1, price_data: { currency: payment.currency.toLowerCase(), unit_amount: Number(payment.amount_cents), product_data: { name: payment.order_id ? "GoAifast 数字商品订单" : "GoAifast 钱包充值" } } }],
        success_url: `${base}${target}?payment=returned`, cancel_url: `${base}${target}?payment=cancelled`,
        expires_at: expiresAt,
      }, { idempotencyKey: `goaifast-checkout-${payment.id}` });
      const { error: saveError } = await db.from("commerce_payments").update({ provider_session_id: session.id, checkout_url: session.url }).eq("id", payment.id);
      if (saveError) throw new Error("支付页面已创建，记录同步失败，请重试同一笔交易。");
    }
    if (session.metadata?.payment_id !== payment.id) throw new Error("支付记录不匹配");
    verifyPaymentAmount(session, payment);
    if (session.payment_status === "paid") {
      const ref = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      if (!ref) throw new Error("支付凭据缺失");
      const { error: settleError } = await db.rpc("commerce_settle_payment", { p_payment_id: payment.id, p_provider_ref: ref, p_amount_cents: session.amount_total, p_currency: session.currency });
      if (settleError) throw new Error(settleError.message);
      return json(request, { url: `${base}${target}`, status: "succeeded" });
    }
    if (payload.action === "cancel" || session.status === "expired") {
      if (session.status === "open") session = await stripe.checkout.sessions.expire(session.id);
      if (session.status !== "expired") throw new Error("支付正在处理中，暂时不能取消。");
      const { error: expireError } = await db.rpc("commerce_expire_payment", { p_payment_id: payment.id, p_provider_session_id: session.id });
      if (expireError) throw new Error(expireError.message);
      return json(request, { status: "cancelled" });
    }
    if (!session.url || session.status !== "open") throw new Error("支付页面不可用，请刷新订单状态。");
    return json(request, { url: session.url, status: "pending" });
  } catch (error) { return failure(request, error); }
}

if (import.meta.main) Deno.serve(handleRequest);
