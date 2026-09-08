import { supabase } from "@/integrations/supabase/client";

export function commerceError(error: unknown): string {
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error ?? "请求失败");
  if (/commerce_api|PGRST202|schema cache|does not exist/i.test(message)) {
    return "交易服务尚未初始化。请管理员应用数据库迁移并部署支付服务后重试。";
  }
  if (/Failed to fetch|NetworkError|Failed to send a request/i.test(message)) return "暂时无法连接服务，请检查网络后重试。";
  return message;
}

/** All money and state changes are authorized and calculated inside the database. */
export async function commerce<T = Record<string, unknown>>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const rpc = supabase.rpc.bind(supabase) as unknown as (name: string, params: Record<string, unknown>) => Promise<{ data: T; error: unknown }>;
  const { data, error } = await rpc("commerce_api", { p_action: action, p_payload: payload });
  if (error) throw new Error(commerceError(error));
  return data;
}

async function edge<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let detail = commerceError(error);
    if (error.context instanceof Response) {
      const response = await error.context.json().catch(() => null);
      if (response?.error) detail = response.error;
    }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export const stripeCheckout = (paymentId: string) => edge<{ url: string }>("stripe-checkout", { payment_id: paymentId });
export const stripeRefund = (refundId: string) => edge<{ status: string }>("stripe-refund", { refund_id: refundId });
export const stripeCancel = (paymentId: string) => edge<{ status: string }>("stripe-checkout", { payment_id: paymentId, action: "cancel" });
export const reconcilePayments = () => edge<{ checked: number; settled: number; expired: number; refunds: number; needs_review: string[] }>("commerce-reconcile", {});
export const money = (cents: number) => new Intl.NumberFormat("zh-CN", { style: "currency", currency: "USD" }).format(Number(cents || 0) / 100);

const labels: Record<string, string> = {
  pending_payment: "待支付", pending: "待支付", paid: "已支付", processing: "处理中", fulfilling: "待发货", delivered: "已发货", completed: "已完成",
  cancelled: "已取消", expired: "已过期", refund_pending: "退款处理中", refund_due: "待退还款项", refunded: "已退款",
  partially_refunded: "部分退款", succeeded: "已完成", failed: "失败", available: "可发货", reserved: "已预留", assigned: "已发货",
  delivered_inventory: "已发货", disabled: "已停用", defective: "故障停用", replaced: "已更换", open: "待处理", in_progress: "处理中", waiting_customer: "待顾客回复", resolved: "已解决", closed: "已关闭",
  rejected: "已拒绝", approved: "已批准", automatic: "自动发货", manual: "人工发货", active: "上架", inactive: "下架",
  replacement: "换货", refund: "退款", complaint: "投诉", question: "咨询", topup: "钱包充值", order: "订单付款", stripe: "Stripe", wallet: "钱包余额",
};
export const statusLabel = (status: string) => labels[status] ?? status;
