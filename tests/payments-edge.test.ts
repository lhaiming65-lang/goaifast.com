import assert from "node:assert/strict";
import { handleRequest as webhook } from "../supabase/functions/stripe-webhook/index.ts";
import { handleRequest as checkout } from "../supabase/functions/stripe-checkout/index.ts";
import { handleRequest as refund } from "../supabase/functions/stripe-refund/index.ts";
import { handleRequest as reconcile } from "../supabase/functions/commerce-reconcile/index.ts";
import { verifyPaymentAmount } from "../supabase/functions/_shared/stripe.ts";
import { headers, uuid, failure } from "../supabase/functions/_shared/http.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const paymentId = "22222222-2222-4222-8222-222222222222";
const refundId = "33333333-3333-4333-8333-333333333333";
const secret = "whsec_test_fixture_not_a_real_credential";
for (const [key, value] of Object.entries({ SUPABASE_URL: "https://supabase.invalid", SUPABASE_SERVICE_ROLE_KEY: "fixture-service-key", STRIPE_SECRET_KEY: "sk_test_fixture", STRIPE_WEBHOOK_SECRET: secret, APP_URL: "http://127.0.0.1:8080", ALLOWED_ORIGINS: "http://127.0.0.1:8080" })) Deno.env.set(key, value);
const payment = { id: paymentId, user_id: userId, order_id: null, provider: "stripe", amount_cents: 2500, currency: "USD", status: "pending", provider_ref: "pi_fixture", provider_session_id: "cs_fixture", expires_at: new Date(Date.now() + 3600_000).toISOString() };
const session = { id: "cs_fixture", object: "checkout.session", metadata: { payment_id: paymentId }, amount_total: 2500, currency: "usd", payment_status: "paid", status: "complete", payment_intent: "pi_fixture" };
const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
async function signed(data: unknown, timestamp = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(data);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${raw}`)))].map(b => b.toString(16).padStart(2, "0")).join("");
  return new Request("http://local/stripe-webhook", { method: "POST", headers: { "stripe-signature": `t=${timestamp},v1=${signature}` }, body: raw });
}
async function fixture(run: () => Promise<void>, mock: (url: URL, init?: RequestInit) => Response | Promise<Response>) {
  const saved = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(mock(new URL(input instanceof Request ? input.url : String(input)), init))) as typeof fetch;
  try { await run(); } finally { globalThis.fetch = saved; }
}
const event = (type: string, object: unknown) => ({ id: "evt_fixture", type, data: { object }, livemode: false });
const authed = (body: unknown) => new Request("http://local/endpoint", { method: "POST", headers: { authorization: "Bearer user-fixture" }, body: JSON.stringify(body) });

Deno.test("amount/currency checks reject underpayment and missing amounts", () => {
  verifyPaymentAmount({ amount_total: 2500, currency: "usd" }, payment);
  assert.throws(() => verifyPaymentAmount({ amount_total: 1, currency: "usd" }, payment));
  assert.throws(() => verifyPaymentAmount({ amount_total: 2500, currency: "eur" }, payment));
  assert.throws(() => verifyPaymentAmount({ amount_total: null, currency: "usd" }, payment));
  assert.throws(() => uuid("../../orders"));
});
Deno.test("CORS never grants an unconfigured origin", () => {
  assert.equal(headers(new Request("http://local", { headers: { origin: "https://evil.invalid" } }))["Access-Control-Allow-Origin"], undefined);
  assert.equal(headers(new Request("http://local", { headers: { origin: "http://127.0.0.1:8080" } }))["Access-Control-Allow-Origin"], "http://127.0.0.1:8080");
});
Deno.test("provider errors never leak API keys", async () => {
  const error = Object.assign(new Error("Invalid API Key provided: sk_test_sensitive_fixture"), { type: "StripeAuthenticationError" });
  const response = failure(new Request("http://local"), error);
  assert.doesNotMatch(await response.text(), /sensitive_fixture|sk_test/);
});
Deno.test("missing, forged and stale signatures never reach database", async () => {
  await fixture(async () => {
    assert.equal((await webhook(new Request("http://local", { method: "POST", body: "{}" }))).status, 400);
    assert.equal((await webhook(new Request("http://local", { method: "POST", headers: { "stripe-signature": "t=1,v1=bad" }, body: "{}" }))).status, 400);
    assert.equal((await webhook(await signed(event("checkout.session.completed", session), 1))).status, 400);
  }, () => { throw new Error("No network expected"); });
});
Deno.test("valid paid webhook settles with server amount; replay remains safe via same DB operation", async () => {
  let settlements = 0;
  await fixture(async () => {
    for (let i = 0; i < 2; i++) assert.equal((await webhook(await signed(event("checkout.session.completed", session)))).status, 200);
    assert.equal(settlements, 2); // RPC integration suite proves these calls credit once.
  }, (url, init) => {
    if (url.pathname === "/rest/v1/commerce_payments") return respond(init?.method === "PATCH" ? null : payment);
    if (url.pathname.endsWith("/commerce_settle_payment")) { const args = JSON.parse(String(init?.body)); assert.equal(args.p_amount_cents, 2500); assert.equal(args.p_provider_ref, "pi_fixture"); settlements++; return respond({ payment: { status: "succeeded" } }); }
    if (url.pathname.endsWith("/commerce_webhook_events")) return respond(null);
    throw new Error(`Unexpected fixture URL ${url.pathname}`);
  });
});
Deno.test("wrong amount or wrong session does not settle and returns retryable failure", async () => {
  await fixture(async () => {
    assert.equal((await webhook(await signed(event("checkout.session.completed", { ...session, amount_total: 1 })))).status, 500);
    assert.equal((await webhook(await signed(event("checkout.session.completed", { ...session, id: "cs_wrong" })))).status, 500);
  }, url => { if (url.pathname.endsWith("/commerce_payments")) return respond(payment); throw new Error("Settlement must not be called"); });
});
Deno.test("unpaid Checkout completion does not deliver; expired event releases via guarded RPC", async () => {
  let expired = 0;
  await fixture(async () => {
    assert.equal((await webhook(await signed(event("checkout.session.completed", { ...session, payment_status: "unpaid" })))).status, 200);
    assert.equal((await webhook(await signed(event("checkout.session.expired", { ...session, payment_status: "unpaid", status: "expired" })))).status, 200);
    assert.equal(expired, 1);
  }, (url, init) => {
    if (url.pathname.endsWith("/commerce_payments")) return respond(init?.method === "PATCH" ? null : payment);
    if (url.pathname.endsWith("/commerce_expire_payment")) { expired++; assert.equal(JSON.parse(String(init?.body)).p_provider_session_id, "cs_fixture"); return respond({}); }
    if (url.pathname.endsWith("/commerce_webhook_events")) return respond(null);
    throw new Error("Settlement must not be called");
  });
});
Deno.test("database failure returns 500 so Stripe will retry", async () => {
  await fixture(async () => { assert.equal((await webhook(await signed(event("checkout.session.completed", session)))).status, 500); }, (url, init) => {
    if (url.pathname.endsWith("/commerce_payments")) return respond(init?.method === "PATCH" ? null : payment);
    return respond({ message: "database unavailable" }, 503);
  });
});
Deno.test("anonymous checkout never claims payment", async () => {
  await fixture(async () => { assert.equal((await checkout(new Request("http://local", { method: "POST", body: JSON.stringify({ payment_id: paymentId }) }))).status, 401); }, () => { throw new Error("No network expected"); });
});
Deno.test("missing Stripe configuration never locks a reservation", async () => {
  Deno.env.delete("STRIPE_SECRET_KEY");
  try {
    await fixture(async () => { assert.equal((await checkout(authed({ payment_id: paymentId }))).status, 400); }, url => {
      if (url.pathname === "/auth/v1/user") return respond({ id: userId, email: "customer@example.test" });
      throw new Error("Claim must not be called");
    });
  } finally { Deno.env.set("STRIPE_SECRET_KEY", "sk_test_fixture"); }
});
Deno.test("customer cannot refund another customer's payment", async () => {
  await fixture(async () => { const response = await refund(authed({ refund_id: refundId })); assert.equal(response.status, 400); assert.match((await response.json()).error, /无权/); }, url => {
    if (url.pathname === "/auth/v1/user") return respond({ id: userId });
    if (url.pathname.endsWith("/commerce_refunds")) return respond({ id: refundId, payment_id: paymentId, status: "pending", amount_cents: 100 });
    if (url.pathname.endsWith("/commerce_payments")) return respond({ ...payment, user_id: "another-user" });
    if (url.pathname.endsWith("/user_roles")) return respond(null);
    throw new Error("Stripe must not be called");
  });
});
Deno.test("out of order refund notification uses current provider state", async () => {
  let completed = false;
  await fixture(async () => { assert.equal((await webhook(await signed(event("refund.failed", { id: "re_fixture", metadata: { refund_id: refundId } })))).status, 200); assert.equal(completed, true); }, (url, init) => {
    if (url.hostname === "api.stripe.com") return respond({ id: "re_fixture", status: "succeeded", amount: 2500, currency: "usd", payment_intent: "pi_fixture", metadata: { refund_id: refundId } });
    if (url.pathname.endsWith("/commerce_refunds")) return respond({ id: refundId, payment_id: paymentId, amount_cents: 2500 });
    if (url.pathname.endsWith("/commerce_payments")) return respond(payment);
    if (url.pathname.endsWith("/commerce_complete_refund")) { assert.equal(JSON.parse(String(init?.body)).p_succeeded, true); completed = true; return respond({}); }
    if (url.pathname.endsWith("/commerce_webhook_events")) return respond(null);
    throw new Error(`Unexpected ${url.pathname}`);
  });
});
Deno.test("old refund with lost local reference recovers provider metadata without creating another refund", async () => {
  let creates = 0; let completed = false;
  await fixture(async () => {
    assert.equal((await refund(authed({ refund_id: refundId }))).status, 200);
    assert.equal(creates, 0); assert.equal(completed, true);
  }, (url, init) => {
    if (url.pathname === "/auth/v1/user") return respond({ id: userId });
    if (url.pathname.endsWith("/commerce_refunds")) return respond(init?.method === "PATCH" ? null : { id: refundId, payment_id: paymentId, status: "pending", amount_cents: 500, created_at: "2020-01-01T00:00:00Z", provider_ref: null });
    if (url.pathname.endsWith("/commerce_payments")) return respond(payment);
    if (url.pathname.endsWith("/user_roles")) return respond(null);
    if (url.hostname === "api.stripe.com") {
      if (init?.method === "POST") { creates++; throw new Error("Must not recreate old refund"); }
      assert.equal(url.searchParams.get("payment_intent"), "pi_fixture");
      return respond({ object: "list", has_more: false, data: [{ id: "re_recovered", status: "succeeded", amount: 500, currency: "usd", payment_intent: "pi_fixture", metadata: { refund_id: refundId } }] });
    }
    if (url.pathname.endsWith("/commerce_complete_refund")) { completed = true; assert.equal(JSON.parse(String(init?.body)).p_provider_ref, "re_recovered"); return respond({}); }
    throw new Error(`Unexpected ${url.pathname}`);
  });
});
Deno.test("reconciliation is administrator-only", async () => {
  await fixture(async () => {
    const response = await reconcile(authed({}));
    assert.equal(response.status, 400); assert.match((await response.json()).error, /管理员/);
  }, url => {
    if (url.pathname === "/auth/v1/user") return respond({ id: userId });
    if (url.pathname.endsWith("/user_roles")) return respond(null);
    throw new Error("Non-admin must not read payments");
  });
});
Deno.test("old claimed orphan is released only after exhaustive provider absence check", async () => {
  let searched = false; let expired = false;
  await fixture(async () => {
    const response = await reconcile(authed({})); assert.equal(response.status, 200);
    assert.equal((await response.json()).expired, 1); assert.equal(expired, true);
  }, (url, init) => {
    if (url.pathname === "/auth/v1/user") return respond({ id: userId });
    if (url.pathname.endsWith("/user_roles")) return respond({ id: "admin-role" });
    if (url.pathname.endsWith("/commerce_payments")) return respond(init?.method === "PATCH" ? null : [{ ...payment, provider_session_id: null, created_at: "2020-01-01T00:00:00Z", checkout_claimed_at: "2020-01-01T00:01:00Z", expires_at: "2020-01-01T01:00:00Z" }]);
    if (url.hostname === "api.stripe.com") { searched = true; return respond({ object: "list", data: [], has_more: false }); }
    if (url.pathname.endsWith("/commerce_expire_payment")) { assert.equal(searched, true); assert.equal(JSON.parse(String(init?.body)).p_verified_orphan, true); expired = true; return respond({}); }
    if (url.pathname.endsWith("/commerce_refunds")) return respond([]);
    throw new Error(`Unexpected ${url.pathname}`);
  });
});
