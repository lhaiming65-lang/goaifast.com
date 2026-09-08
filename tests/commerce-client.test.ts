import assert from "node:assert/strict";
import { commerce, commerceError, money } from "../src/lib/commerce.ts";

Deno.test("browser commerce wrapper preserves actual Supabase SDK receiver and sends only action/payload", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = ((_url, init) => {
    assert.match(String(_url), /\/rest\/v1\/rpc\/commerce_api$/);
    assert.equal(init?.method, "POST");
    assert.deepEqual(JSON.parse(String(init?.body)), { p_action: "topup", p_payload: { amount_cents: 100, idempotency_key: "fixture-request" } });
    return Promise.resolve(new Response(JSON.stringify({ payment: { id: "pending-fixture", status: "pending" } }), { headers: { "Content-Type": "application/json" } }));
  }) as typeof fetch;
  try {
    const result = await commerce<{ payment: { status: string } }>("topup", { amount_cents: 100, idempotency_key: "fixture-request" });
    assert.equal(result.payment.status, "pending");
  } finally { globalThis.fetch = saved; }
});
Deno.test("missing migration produces actionable initialization message without fake data", async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify({ code: "PGRST202", message: "Could not find commerce_api in schema cache" }), { status: 404, headers: { "Content-Type": "application/json" } }))) as typeof fetch;
  try { await assert.rejects(() => commerce("catalog"), /尚未初始化/); } finally { globalThis.fetch = saved; }
  assert.match(commerceError(new Error("Failed to fetch")), /检查网络/);
  assert.equal(money(1234), "US$12.34");
});
