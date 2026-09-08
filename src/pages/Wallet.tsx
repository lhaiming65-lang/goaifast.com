import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  commerce,
  money,
  statusLabel,
  stripeCancel,
  stripeCheckout,
  stripeRefund,
} from "@/lib/commerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Payment {
  id: string;
  kind: string;
  status: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  expires_at: string;
  provider_session_id?: string | null;
  checkout_claimed_at?: string | null;
}
interface Refund {
  id: string;
  payment_id: string;
  order_id: string | null;
  amount_cents: number;
  status: string;
  reason: string;
  created_at: string;
  idempotency_key?: string | null;
}
interface Ledger {
  id: string;
  delta_cents: number;
  balance_after_cents: number;
  kind: string;
  description: string;
  order_id: string | null;
  created_at: string;
}
interface Snapshot {
  wallet: { balance_cents: number; currency: string };
  ledger: Ledger[];
  payments: Payment[];
  refunds: Refund[];
}
const time = (value: string) =>
  new Date(value).toLocaleString("zh-CN", { hour12: false });
const message = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请稍后重试";
const refundLabel = (status: string) =>
  status === "pending"
    ? "退款处理中"
    : status === "succeeded"
      ? "退款成功"
      : status === "failed"
        ? "退款失败"
        : statusLabel(status);

export default function Wallet() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const returned = params.get("payment");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [amount, setAmount] = useState("50");
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [pendingRefundId, setPendingRefundId] = useState<string | null>(null);
  const refundKey = useRef("");
  const [refundError, setRefundError] = useState("");
  const attempt = useRef<{ cents: number; key: string } | null>(null);
  const loadSequence = useRef(0);
  const userId = user?.id;

  const refresh = useCallback(async () => {
    const sequence = ++loadSequence.current;
    try {
      const data = await commerce<Snapshot>("wallet");
      if (sequence === loadSequence.current) {
        setSnapshot(data);
        setError("");
      }
    } catch (err) {
      if (sequence === loadSequence.current) setError(message(err));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    setSnapshot(null);
    setLoading(true);
    attempt.current = null;
    void refresh();
    const sequence = loadSequence;
    return () => {
      sequence.current++;
    };
  }, [refresh, userId]);
  useEffect(() => {
    if (returned !== "returned") return;
    let count = 0;
    const timer = window.setInterval(() => {
      void refresh();
      if (++count >= 6) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [returned, refresh]);

  const run = async (key: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    try {
      await action();
    } catch (err) {
      toast.error(message(err));
    } finally {
      setBusy("");
      await refresh();
    }
  };
  const pay = async (paymentId: string) => {
    const { url } = await stripeCheckout(paymentId);
    if (!url) throw new Error("支付页面暂不可用，请刷新后继续支付");
    window.location.assign(url);
  };
  const topup = (event: FormEvent) => {
    event.preventDefault();
    void run("topup", async () => {
      const normalized = amount.trim();
      if (!/^\d{1,5}(\.\d{1,2})?$/.test(normalized))
        throw new Error("请输入有效金额，最多保留两位小数");
      const cents = Math.round(Number(normalized) * 100);
      if (cents < 100 || cents > 1_000_000)
        throw new Error("单次充值范围为 1–10,000 USD");
      if (!attempt.current || attempt.current.cents !== cents)
        attempt.current = { cents, key: crypto.randomUUID() };
      const { payment } = await commerce<{ payment: Payment }>("topup", {
        amount_cents: cents,
        idempotency_key: attempt.current.key,
      });
      // Once recorded, the history row can resume this same payment after a network error.
      attempt.current = null;
      await refresh();
      await pay(payment.id);
    });
  };
  const cancelPayment = (payment: Payment) =>
    void run(payment.id, async () => {
      if (!payment.checkout_claimed_at && !payment.provider_session_id)
        await commerce("cancel_payment", { payment_id: payment.id });
      else await stripeCancel(payment.id);
      toast.success("已核对并更新充值状态");
    });
  const submitRefund = async (event: FormEvent) => {
    event.preventDefault();
    if (!refundPayment || busy) return;
    if (reason.trim().length < 3) {
      setRefundError("请填写至少 3 个字的退款原因");
      return;
    }
    setBusy("refund");
    setRefundError("");
    let created = false;
    try {
      // A timed-out create response may still have committed. Recover its ID
      // from the refreshed snapshot before validating against the now-held balance.
      let refundId =
        pendingRefundId ||
        snapshot?.refunds.find(
          (refund) => refund.idempotency_key === refundKey.current,
        )?.id;
      if (!refundId) {
        if (!/^\d{1,5}(\.\d{1,2})?$/.test(refundAmount.trim()))
          throw new Error("请输入有效退款金额，最多保留两位小数");
        const cents = Math.round(Number(refundAmount) * 100);
        if (cents < 1 || cents > refundableCents(refundPayment))
          throw new Error("退款金额需大于零，且不能超过可退金额和钱包可用余额");
        const { refund } = await commerce<{ refund: Refund }>("topup_refund", {
          payment_id: refundPayment.id,
          reason: reason.trim(),
          amount_cents: cents,
          idempotency_key: refundKey.current,
        });
        refundId = refund.id;
        setPendingRefundId(refundId);
      }
      created = true;
      await refresh();
      const result = await stripeRefund(refundId);
      if (result.status === "failed" || result.status === "canceled")
        toast.error("退款未完成，资金处理结果请查看退款记录");
      else
        toast.success(
          result.status === "succeeded"
            ? "退款成功，到账时间以发卡行为准"
            : "退款已提交，可在退款记录中跟进",
        );
      setRefundPayment(null);
      setReason("");
    } catch (err) {
      setRefundError(
        (created ? "退款申请已保存，款项已冻结。" : "") +
          message(err) +
          (created ? " 可关闭此窗口，在退款记录中重试同一笔退款。" : ""),
      );
    } finally {
      setBusy("");
      await refresh();
    }
  };
  const retryRefund = (refund: Refund) =>
    void run(refund.id, async () => {
      const result = await stripeRefund(refund.id);
      if (["failed", "canceled"].includes(result.status))
        toast.error("退款失败，请检查退款记录或联系客户支持");
      else
        toast.success(
          result.status === "succeeded"
            ? "退款已完成"
            : "退款已提交，正在处理中",
        );
    });
  const topupRefunds =
    snapshot?.refunds.filter((refund) => !refund.order_id) ?? [];
  const refundedCents = (payment: Payment) =>
    topupRefunds
      .filter(
        (refund) =>
          refund.payment_id === payment.id && refund.status === "succeeded",
      )
      .reduce((sum, refund) => sum + Number(refund.amount_cents), 0);
  const refundableCents = (payment: Payment) =>
    Math.max(
      0,
      Math.min(
        Number(payment.amount_cents) - refundedCents(payment),
        payment.status === "refund_due"
          ? Number(payment.amount_cents)
          : Number(snapshot?.wallet.balance_cents ?? 0),
      ),
    );
  const pendingTopup = snapshot?.payments.find(
    (payment) => payment.status === "pending",
  );

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            账户中心
          </Link>
          <Link to="/" className="font-semibold">
            GoAifast
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:py-12">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">我的钱包</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              充值、购物、退款，每笔资金都可追踪。
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !!busy}
            onClick={() => void run("refresh", refresh)}
          >
            <RefreshCw
              className={
                "mr-2 h-4 w-4 " + (busy === "refresh" ? "animate-spin" : "")
              }
            />
            刷新
          </Button>
        </div>
        {returned === "returned" && (
          <p
            role="status"
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
          >
            已从支付页面返回，正在核对支付结果。余额和记录以服务端确认为准；如尚未更新，可在充值记录中点击“继续支付
            / 核对”。
          </p>
        )}
        {returned === "cancelled" && (
          <p role="status" className="rounded-xl border bg-card p-4 text-sm">
            你已离开支付页面。未支付的充值仍可继续或取消，钱包仅在支付确认后入账。
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
            <button className="ml-3 underline" onClick={() => void refresh()}>
              重试
            </button>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-5">
          <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white md:col-span-2 md:p-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/65">可用余额 · USD</p>
              <WalletIcon className="h-6 w-6 text-indigo-200" />
            </div>
            <p className="my-8 text-4xl font-semibold tracking-tight">
              {snapshot
                ? money(snapshot.wallet.balance_cents)
                : loading
                  ? "读取中…"
                  : "—"}
            </p>
            <p className="text-xs leading-relaxed text-white/65">
              可用于商城订单支付。充值退款处理中会冻结对应金额，冻结款项不计入可用余额。
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-100"
            >
              去选购商品 <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>
          <section className="rounded-2xl border bg-card p-6 md:col-span-3 md:p-8">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CreditCard className="h-5 w-5 text-primary" />
              充值到钱包
            </h2>
            <form onSubmit={topup} className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                {[10, 50, 100, 200].map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={amount === String(value) ? "default" : "outline"}
                    disabled={!!busy}
                    onClick={() => setAmount(String(value))}
                  >
                    ${value}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="topup-amount">充值金额（USD）</Label>
                <Input
                  id="topup-amount"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="1.00–10,000.00"
                  required
                  maxLength={8}
                  disabled={!!busy}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!!busy || !snapshot || !!error}
              >
                {busy === "topup" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                前往 Stripe 安全支付
              </Button>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                银行卡信息在 Stripe 页面填写。支付成功并确认后，余额自动更新。
              </p>
            </form>
            {pendingTopup && (
              <p className="mt-4 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
                你有待支付的充值，可在下方继续支付或取消，避免重复创建。
              </p>
            )}
          </section>
        </div>
        <section className="rounded-2xl border bg-card p-4 sm:p-6">
          <Tabs defaultValue="payments">
            <TabsList className="mb-5 grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="payments">充值记录</TabsTrigger>
              <TabsTrigger value="ledger">资金明细</TabsTrigger>
              <TabsTrigger value="refunds">退款记录</TabsTrigger>
            </TabsList>
            <TabsContent value="payments" className="space-y-3">
              {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  正在读取充值记录…
                </p>
              ) : !snapshot ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  连接服务后显示充值记录
                </p>
              ) : snapshot.payments.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  还没有充值记录。完成首笔支付后会显示在这里。
                </p>
              ) : (
                snapshot.payments.map((payment) => {
                  const canRefund =
                    ["succeeded", "refund_due"].includes(payment.status) &&
                    !topupRefunds.some(
                      (refund) =>
                        refund.payment_id === payment.id &&
                        refund.status === "pending",
                    ) &&
                    refundedCents(payment) < Number(payment.amount_cents);
                  return (
                    <article
                      key={payment.id}
                      className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-semibold">
                          {money(payment.amount_cents)}{" "}
                          <span className="ml-2 rounded-full bg-secondary px-2 py-1 text-xs font-normal">
                            {statusLabel(payment.status)}
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {time(payment.created_at)}
                        </p>
                        <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                          {payment.id}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {payment.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!!busy}
                              onClick={() =>
                                void run(payment.id, () => pay(payment.id))
                              }
                            >
                              继续支付 / 核对
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!!busy}
                              onClick={() => cancelPayment(payment)}
                            >
                              取消充值
                            </Button>
                          </>
                        )}
                        {canRefund && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!!busy || refundableCents(payment) < 1}
                            onClick={() => {
                              setRefundPayment(payment);
                              setRefundAmount(
                                (refundableCents(payment) / 100).toFixed(2),
                              );
                              setReason("");
                              setRefundError("");
                              setPendingRefundId(null);
                              refundKey.current = crypto.randomUUID();
                            }}
                          >
                            申请原路退款
                          </Button>
                        )}
                        {canRefund && refundableCents(payment) < 1 && (
                          <span className="max-w-44 self-center text-xs text-muted-foreground">
                            暂无可退余额
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </TabsContent>
            <TabsContent value="ledger" className="space-y-3">
              {!snapshot?.ledger.length ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {snapshot ? "暂无资金变动" : "资金明细尚未加载"}
                </p>
              ) : (
                snapshot.ledger.map((row) => (
                  <article
                    key={row.id}
                    className="flex items-center gap-3 rounded-xl border p-4"
                  >
                    <div
                      className={
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                        (row.delta_cents > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-secondary text-muted-foreground")
                      }
                    >
                      {row.delta_cents > 0 ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{row.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {time(row.created_at)}
                        {row.order_id && (
                          <>
                            {" "}
                            ·{" "}
                            <Link
                              className="text-primary"
                              to={"/order/" + row.order_id}
                            >
                              查看订单
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          "font-medium " +
                          (row.delta_cents > 0 ? "text-emerald-600" : "")
                        }
                      >
                        {row.delta_cents > 0 ? "+" : ""}
                        {money(row.delta_cents)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        余额 {money(row.balance_after_cents)}
                      </p>
                    </div>
                  </article>
                ))
              )}
            </TabsContent>
            <TabsContent value="refunds" className="space-y-3">
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                充值支持全部或部分原路退款，金额不能超过该笔充值的未退款金额和钱包可用余额。退款到账时间以银行或支付机构处理为准。
              </p>
              {topupRefunds.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {snapshot ? "暂无充值退款" : "退款记录尚未加载"}
                </p>
              ) : (
                topupRefunds.map((refund) => (
                  <article
                    key={refund.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {money(refund.amount_cents)}{" "}
                        <span className="ml-2 text-xs text-muted-foreground">
                          {refundLabel(refund.status)}
                        </span>
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {refund.reason}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {time(refund.created_at)}
                      </p>
                    </div>
                    {refund.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!busy}
                        onClick={() => retryRefund(refund)}
                      >
                        同步 / 重试退款
                      </Button>
                    )}
                    {refund.status === "failed" && (
                      <Link to="/support" className="text-sm text-primary">
                        联系支持
                      </Link>
                    )}
                  </article>
                ))
              )}
            </TabsContent>
          </Tabs>
        </section>
        <p className="text-center text-sm text-muted-foreground">
          对资金记录有疑问？
          <Link className="ml-1 text-primary hover:underline" to="/support">
            提交咨询或投诉
          </Link>
        </p>
      </main>
      <Dialog
        open={!!refundPayment}
        onOpenChange={(open) => {
          if (!open && !busy) setRefundPayment(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>退回这笔充值</DialogTitle>
            <DialogDescription>
              可将这笔充值的全部或部分金额退回原支付方式。提交后对应余额被冻结；支付机构确认失败时自动释放。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRefund} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">退款金额（USD）</Label>
              <Input
                id="refund-amount"
                inputMode="decimal"
                value={refundAmount}
                onChange={(event) => setRefundAmount(event.target.value)}
                required
                disabled={!!busy || !!pendingRefundId}
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">
                {pendingRefundId
                  ? "退款申请已保存，继续操作将重试同一笔退款。"
                  : "最多可退 " +
                    money(refundPayment ? refundableCents(refundPayment) : 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">退款原因</Label>
              <Textarea
                id="refund-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={!!busy || !!pendingRefundId}
                required
                minLength={3}
                maxLength={1000}
                placeholder="请说明需要退回充值的原因"
              />
            </div>
            {refundError && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
              >
                {refundError}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={!!busy}
                onClick={() => setRefundPayment(null)}
              >
                暂不退款
              </Button>
              <Button
                type="submit"
                disabled={!!busy || reason.trim().length < 3}
              >
                {busy === "refund" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {pendingRefundId ? "重试退款" : "确认申请退款"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
