import { bodyOf, failure, identity, json, preflight, uuid } from "../_shared/http.ts";
import { stripeClient, type Stripe } from "../_shared/stripe.ts";

export async function handleRequest(request: Request): Promise<Response> {
  const early = preflight(request); if (early) return early;
  try {
    const { db, user } = await identity(request);
    const { refund_id } = await bodyOf(request);
    const { data: refund, error } = await db.from("commerce_refunds").select("*").eq("id", uuid(refund_id)).single();
    if (error || !refund) throw new Error("退款记录不存在");
    const { data: payment } = await db.from("commerce_payments").select("*").eq("id", refund.payment_id).single();
    if (!payment) throw new Error("原支付记录不存在");
    const { data: admin } = await db.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!admin && (payment.user_id !== user.id || payment.order_id)) throw new Error("无权操作该退款");
    if (refund.status === "succeeded" || refund.status === "failed") return json(request, { status: refund.status });
    if (payment.provider !== "stripe" || !payment.provider_ref?.startsWith("pi_")) throw new Error("缺少 Stripe 原支付凭据");
    const stripe = stripeClient();
    // Network uncertainty remains pending. Retrying this exact refund reuses its
    // provider idempotency key; only a definitive provider result releases a hold.
    let recovered: Stripe.Refund | undefined;
    if (!refund.provider_ref && Date.now() - new Date(refund.created_at).getTime() > 20 * 3600_000) {
      // Stripe may remove an idempotency key after 24 hours. Recover by durable
      // metadata before ever recreating an old request whose response was lost.
      let cursor: string | undefined; let exhausted = false;
      for (let page = 0; page < 10; page++) {
        const batch = await stripe.refunds.list({ payment_intent: payment.provider_ref, limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
        const matches = batch.data.filter(item => item.metadata?.refund_id === refund.id);
        if (matches.length > 1 || (recovered && matches.length)) throw new Error("发现多个渠道退款记录，请管理员人工核对，勿重复退款。");
        if (matches[0]) recovered = matches[0];
        if (!batch.has_more) { exhausted = true; break; }
        cursor = batch.data.at(-1)?.id;
      }
      if (!exhausted) throw new Error("退款历史较多，尚未完成渠道核对，请管理员处理后再试。");
    }
    const result = recovered ?? (refund.provider_ref
      ? await stripe.refunds.retrieve(refund.provider_ref)
      : await stripe.refunds.create({
        payment_intent: payment.provider_ref, amount: Number(refund.amount_cents),
        metadata: { refund_id: refund.id, payment_id: payment.id },
      }, { idempotencyKey: `goaifast-refund-${refund.id}` }));
    const originalIntent = typeof result.payment_intent === "string" ? result.payment_intent : result.payment_intent?.id;
    if (result.amount !== Number(refund.amount_cents) || result.currency.toLowerCase() !== payment.currency.toLowerCase() || originalIntent !== payment.provider_ref || result.metadata?.refund_id !== refund.id) throw new Error("退款金额、币种或原支付凭据不匹配");
    const { error: saveError } = await db.from("commerce_refunds").update({ provider_ref: result.id }).eq("id", refund.id);
    if (saveError) throw new Error("退款已提交，同步暂时失败，请重试同一笔退款。");
    if (["succeeded", "failed", "canceled"].includes(result.status ?? "")) {
      const { error: completeError } = await db.rpc("commerce_complete_refund", { p_refund_id: refund.id, p_provider_ref: result.id, p_succeeded: result.status === "succeeded", p_failure_reason: result.failure_reason ?? null });
      if (completeError) throw new Error(completeError.message);
    }
    return json(request, { status: result.status ?? "pending" });
  } catch (error) { return failure(request, error); }
}

if (import.meta.main) Deno.serve(handleRequest);
