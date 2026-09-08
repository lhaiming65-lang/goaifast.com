import { createClient } from "npm:@supabase/supabase-js@2.110.0";
import {
  bodyOf,
  failure,
  identity,
  json,
  preflight,
  requiredEnv,
} from "../_shared/http.ts";

export async function handleRequest(request: Request): Promise<Response> {
  const early = preflight(request);
  if (early) return early;
  try {
    const { db, user } = await identity(request);
    const body = await bodyOf(request);
    if (body.confirmation !== "删除我的账号")
      throw new Error("请确认永久删除账号");
    if (
      typeof body.password !== "string" ||
      !body.password ||
      body.password.length > 72
    )
      throw new Error("请输入当前密码以验证身份");
    if (!user.email)
      throw new Error("此账户未绑定邮箱，请联系客户支持处理账号删除");

    // A bearer session alone does not authorize irreversible account closure.
    // Use an isolated, non-persistent client. Never log password, session or request body.
    const verifier = createClient(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_ANON_KEY"),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
    try {
      const { data: verified, error: verifyError } =
        await verifier.auth.signInWithPassword({
          email: user.email,
          password: body.password,
        });
      if (verifyError || verified.user?.id !== user.id)
        throw new Error(
          "当前密码验证失败。第三方登录账户请先通过邮件设置密码。",
        );
      // The service-only transaction locks all commerce mutations for this user,
      // checks outstanding obligations, anonymizes contact fields and marks closed.
      // Financial records use a retained pseudonymous UUID, not ON DELETE CASCADE.
      const { error: prepareError } = await db.rpc(
        "commerce_prepare_account_deletion",
        { p_user_id: user.id },
      );
      if (prepareError) {
        if (/does not exist|schema cache|PGRST202/i.test(prepareError.message))
          throw new Error("账号删除服务尚未初始化，请联系管理员部署数据库迁移");
        throw new Error(prepareError.message);
      }
      // Retrying after an auth deletion failure is safe: preparation is idempotent
      // and the closed-account gate already prevents any new transactions.
      const { error: deleteError } = await db.auth.admin.deleteUser(
        user.id,
        false,
      );
      if (deleteError)
        throw new Error(
          "账号交易权限已关闭，身份删除暂未完成。请重试；如持续失败，请联系客户支持。",
        );
      return json(request, { deleted: true });
    } finally {
      await verifier.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
  } catch (error) {
    return failure(request, error);
  }
}

if (import.meta.main) Deno.serve(handleRequest);
