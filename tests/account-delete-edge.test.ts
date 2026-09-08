import assert from "node:assert/strict";
import { handleRequest } from "../supabase/functions/account-delete/index.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const user = { id: userId, email: "customer@example.test" };
const password = "fixture-password-not-a-real-secret";
for (const [key, value] of Object.entries({
  SUPABASE_URL: "https://supabase.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "fixture-service-key",
  SUPABASE_ANON_KEY: "fixture-anon-key",
  APP_URL: "http://127.0.0.1:8080",
  ALLOWED_ORIGINS: "http://127.0.0.1:8080",
}))
  Deno.env.set(key, value);
const respond = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const request = (body: Record<string, unknown> = {}, token = "user-fixture") =>
  new Request("http://local/account-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify({ confirmation: "删除我的账号", password, ...body }),
  });

interface Options {
  expired?: boolean;
  wrongPassword?: boolean;
  wrongUser?: boolean;
  prepareError?: string;
  deleteError?: boolean;
}
async function fixture(
  options: Options,
  run: (calls: string[]) => Promise<void>,
) {
  const saved = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    assert.equal(
      url.hostname,
      "supabase.invalid",
      "Tests must never reach a real service",
    );
    if (url.pathname === "/auth/v1/user") {
      calls.push("identity");
      return Promise.resolve(
        options.expired
          ? respond({ code: "bad_jwt", msg: "expired" }, 401)
          : respond(user),
      );
    }
    if (url.pathname === "/auth/v1/token") {
      calls.push("reauthentication");
      assert.equal(url.searchParams.get("grant_type"), "password");
      const credentials = JSON.parse(String(init?.body));
      assert.equal(credentials.email, user.email);
      assert.equal(credentials.password, password);
      return Promise.resolve(
        options.wrongPassword
          ? respond(
              { code: "invalid_credentials", msg: "Invalid credentials" },
              400,
            )
          : respond({
              user: options.wrongUser ? { ...user, id: "other-user" } : user,
              access_token: "verification-session",
              refresh_token: "verification-refresh",
              expires_in: 3600,
              token_type: "bearer",
            }),
      );
    }
    if (url.pathname === "/rest/v1/rpc/commerce_prepare_account_deletion") {
      calls.push("prepare");
      assert.equal(JSON.parse(String(init?.body)).p_user_id, userId);
      return Promise.resolve(
        options.prepareError
          ? respond({ code: "P0001", message: options.prepareError }, 400)
          : respond({ ready: true }),
      );
    }
    if (url.pathname === "/auth/v1/admin/users/" + userId) {
      calls.push("delete");
      assert.equal(init?.method, "DELETE");
      assert.equal(JSON.parse(String(init?.body)).should_soft_delete, false);
      return Promise.resolve(
        options.deleteError
          ? respond(
              {
                code: "unexpected_failure",
                msg: "fixture-service-key provider error",
              },
              500,
            )
          : respond({ user }),
      );
    }
    if (url.pathname === "/auth/v1/logout") {
      calls.push("revoke-verification");
      return Promise.resolve(respond({}));
    }
    throw new Error("Unexpected fixture endpoint: " + url.pathname);
  }) as typeof fetch;
  try {
    await run(calls);
  } finally {
    globalThis.fetch = saved;
  }
}

Deno.test(
  "account deletion rejects missing and expired sessions before password or database mutations",
  async () => {
    await fixture({}, async (calls) => {
      assert.equal((await handleRequest(request({}, ""))).status, 401);
      assert.deepEqual(calls, []);
    });
    await fixture({ expired: true }, async (calls) => {
      assert.equal((await handleRequest(request())).status, 401);
      assert.deepEqual(calls, ["identity"]);
    });
  },
);
Deno.test(
  "account deletion requires exact confirmation and password server-side",
  async () => {
    for (const body of [
      { confirmation: "yes" },
      { password: "" },
      { password: "x".repeat(73) },
    ]) {
      await fixture({}, async (calls) => {
        assert.equal((await handleRequest(request(body))).status, 400);
        assert.deepEqual(calls, ["identity"]);
      });
    }
  },
);
Deno.test(
  "wrong password and mismatched reauthentication identity cannot delete or prepare account",
  async () => {
    for (const options of [{ wrongPassword: true }, { wrongUser: true }]) {
      await fixture(options, async (calls) => {
        const response = await handleRequest(request());
        assert.notEqual(response.status, 200);
        assert.equal(calls.includes("prepare"), false);
        assert.equal(calls.includes("delete"), false);
      });
    }
  },
);
Deno.test(
  "unsettled account errors preserve auth identity and revoke temporary verification session",
  async () => {
    await fixture({ prepareError: "请先退回钱包余额" }, async (calls) => {
      const response = await handleRequest(request());
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error, "请先退回钱包余额");
      assert.deepEqual(calls, [
        "identity",
        "reauthentication",
        "prepare",
        "revoke-verification",
      ]);
    });
  },
);
Deno.test(
  "missing financial migration never attempts auth deletion",
  async () => {
    await fixture(
      {
        prepareError:
          "function commerce_prepare_account_deletion does not exist",
      },
      async (calls) => {
        const response = await handleRequest(request());
        assert.equal(response.status, 400);
        assert.match((await response.json()).error, /尚未初始化/);
        assert.equal(calls.includes("delete"), false);
      },
    );
  },
);
Deno.test(
  "financial closure precedes hard deletion and success returns only completion",
  async () => {
    await fixture({}, async (calls) => {
      const response = await handleRequest(request());
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { deleted: true });
      assert.deepEqual(calls, [
        "identity",
        "reauthentication",
        "prepare",
        "delete",
        "revoke-verification",
      ]);
      assert.equal(response.headers.get("Cache-Control"), "no-store");
    });
  },
);
Deno.test(
  "auth deletion failure reports closed account for retry without leaking provider credentials",
  async () => {
    await fixture({ deleteError: true }, async (calls) => {
      const response = await handleRequest(request());
      assert.equal(response.status, 400);
      const raw = await response.text();
      assert.match(raw, /已关闭.*未完成/);
      for (const secret of [
        password,
        "fixture-service-key",
        "verification-session",
        "verification-refresh",
      ])
        assert.equal(raw.includes(secret), false);
      assert.deepEqual(calls, [
        "identity",
        "reauthentication",
        "prepare",
        "delete",
        "revoke-verification",
      ]);
    });
  },
);
