import { createClient } from "npm:@supabase/supabase-js@2.110.0";

export function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`服务尚未配置 ${name}，请联系管理员。`);
  return value;
}

export const serviceClient = () => createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
export function appUrl(): string {
  const url = new URL(requiredEnv("APP_URL"));
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) throw new Error("APP_URL 必须使用 HTTPS");
  return url.href.replace(/\/$/, "");
}
export function headers(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("APP_URL") ?? "").split(",").map(v => v.trim().replace(/\/$/, ""));
  return {
    "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin",
    ...(allowed.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
export const json = (request: Request, value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: headers(request) });
export function preflight(request: Request): Response | null {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(request) });
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  return null;
}
export async function identity(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw new Error("请先登录");
  const db = serviceClient();
  const { data, error } = await db.auth.getUser(authorization.slice(7));
  if (error || !data.user) throw new Error("登录已过期，请重新登录");
  return { db, user: data.user };
}
export async function bodyOf(request: Request): Promise<Record<string, unknown>> {
  const raw = await request.text();
  if (raw.length > 8192) throw new Error("请求过大");
  return JSON.parse(raw);
}
export function uuid(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new Error("请求标识无效");
  return value;
}
export function failure(request: Request, error: unknown): Response {
  // Never return SDK request objects, credentials or provider response bodies.
  const providerType = typeof error === "object" && error && "type" in error ? String(error.type) : "";
  const raw = error instanceof Error ? error.message : "操作失败，请稍后重试";
  const message = providerType.startsWith("Stripe")
    ? "支付渠道暂时无法处理该请求，请稍后重试或联系管理员核对配置与交易状态。"
    : raw.replace(/(?:sk|rk|whsec|sb_secret)_(?:live_|test_)?[A-Za-z0-9_.*-]+/g, "[已隐藏密钥]");
  return json(request, { error: message }, /登录/.test(message) ? 401 : 400);
}
