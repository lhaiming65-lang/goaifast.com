import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Headphones, MessageSquarePlus, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { commerce, commerceError, statusLabel } from "@/lib/commerce";
import { useAuth } from "@/contexts/AuthContext";
type Message = { id: string; body: string; is_admin: boolean; created_at: string };
type Ticket = { id: string; subject: string; kind: string; status: string; order_id?: string; created_at: string; messages: Message[] };

export default function Support() {
  const { user } = useAuth();
  const userId = user?.id;
  const currentUserId = useRef(userId);
  currentUserId.current = userId;
  const loadSequence = useRef(0);
  const mutationSequence = useRef(0);
  const submitting = useRef(false);
  const [storedTickets, setTickets] = useState<Ticket[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string>();
  const tickets = loadedUserId === userId ? storedTickets : [];
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("question");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const load = useCallback(async () => {
    if (!userId) return;
    const sequence = ++loadSequence.current;
    setLoading(true); setError("");
    try {
      const data = await commerce<{ tickets: Ticket[] }>("support");
      if (sequence === loadSequence.current && currentUserId.current === userId) {
        setTickets(data.tickets); setLoadedUserId(userId);
      }
    } catch (e) {
      if (sequence === loadSequence.current && currentUserId.current === userId) setError(commerceError(e));
    } finally {
      if (sequence === loadSequence.current && currentUserId.current === userId) setLoading(false);
    }
  }, [userId]);
  useEffect(() => {
    setTickets([]); setLoadedUserId(undefined); setSelected(null); setSubject(""); setMessage(""); setReply("");
    setBusy(false); submitting.current = false; mutationSequence.current++;
    void load();
    const requests = loadSequence; const mutations = mutationSequence;
    return () => { requests.current++; mutations.current++; };
  }, [load]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || !subject.trim() || message.trim().length < 3) return;
    submitting.current = true; setBusy(true);
    const sequence = ++mutationSequence.current;
    try {
      const { ticket } = await commerce<{ ticket: Ticket }>("support_create", { kind, subject: subject.trim(), message: message.trim() });
      if (sequence !== mutationSequence.current || currentUserId.current !== userId) return;
      setSelected(ticket.id); setSubject(""); setMessage(""); await load(); toast.success("问题已提交，可在此跟进处理进度");
    } catch (e) {
      if (sequence === mutationSequence.current && currentUserId.current === userId) toast.error(commerceError(e));
    } finally {
      if (sequence === mutationSequence.current) { submitting.current = false; setBusy(false); }
    }
  };
  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting.current || !selected || !reply.trim()) return;
    submitting.current = true; setBusy(true);
    const sequence = ++mutationSequence.current;
    try {
      await commerce("support_reply", { ticket_id: selected, message: reply.trim() });
      if (sequence !== mutationSequence.current || currentUserId.current !== userId) return;
      setReply(""); await load(); toast.success("回复已发送");
    } catch (e) {
      if (sequence === mutationSequence.current && currentUserId.current === userId) toast.error(commerceError(e));
    } finally {
      if (sequence === mutationSequence.current) { submitting.current = false; setBusy(false); }
    }
  };
  const ticket = tickets.find(t => t.id === selected);
  return <div className="min-h-screen bg-secondary/40 dark:bg-gray-950"><header className="border-b bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"><Link to="/profile" className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />账户中心</Link><Link to="/orders" className="text-sm font-medium text-primary">我的订单</Link></div></header>
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-9"><div className="flex items-center justify-between"><div><div className="mb-2 flex items-center gap-2 text-primary"><Headphones className="h-5 w-5" /><span className="text-xs font-semibold tracking-widest">CUSTOMER CARE</span></div><h1 className="text-3xl font-bold">帮助与投诉</h1><p className="mt-2 text-sm text-muted-foreground">提交问题、查看客服回复，跟进每一次处理。</p></div><Button variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />刷新</Button></div>
    {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]"><aside className="space-y-5"><section className="rounded-2xl border bg-card p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold"><MessageSquarePlus className="h-4 w-4" />提交新问题</h2><p className="mb-4 text-xs leading-6 text-muted-foreground">商品故障、换货或订单退款，请前往<Link to="/orders" className="text-primary underline">对应订单</Link>申请，便于核对交付和售后期限。</p><form onSubmit={submit} className="space-y-4"><label className="block space-y-2 text-sm"><span>问题类型</span><select value={kind} onChange={e => setKind(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-2"><option value="question">账户或购买咨询</option><option value="complaint">投诉与意见</option></select></label><label className="block space-y-2 text-sm"><span>主题</span><Input required maxLength={200} value={subject} onChange={e => setSubject(e.target.value)} placeholder="简要描述您的问题" /></label><label className="block space-y-2 text-sm"><span>详细说明</span><Textarea required minLength={3} maxLength={5000} rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="请提供发生时间、操作步骤和问题表现" /></label><Button type="submit" disabled={busy || !!error || !subject.trim() || message.trim().length < 3} className="w-full">{busy ? "正在提交…" : "提交问题"}</Button></form></section></aside>
    <section className="min-w-0 rounded-2xl border bg-card p-5"><h2 className="mb-4 font-semibold">我的服务记录</h2>{loading && !tickets.length ? <p className="py-12 text-center text-sm text-muted-foreground">正在加载…</p> : tickets.length === 0 ? <div className="py-16 text-center"><Headphones className="mx-auto mb-3 h-9 w-9 text-slate-300" /><p className="text-sm text-muted-foreground">还没有服务记录，遇到问题可在左侧提交。</p></div> : <div className="space-y-3">{tickets.map(item => <button key={item.id} onClick={() => { setSelected(item.id); setReply(""); }} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left ${selected === item.id ? "border-primary bg-primary/5" : "hover:bg-secondary/40"}`}><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.subject}</p><p className="mt-1 text-xs text-muted-foreground">{statusLabel(item.kind)} · {new Date(item.created_at).toLocaleString("zh-CN")}</p></div><span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs">{statusLabel(item.status)}</span></button>)}</div>}
      {ticket && <div className="mt-6 border-t pt-5"><h3 className="font-semibold">{ticket.subject}</h3>{ticket.order_id && <Link to={`/order/${ticket.order_id}`} className="mt-2 inline-block text-xs text-primary">查看关联订单 →</Link>}<div className="my-5 space-y-4">{ticket.messages.map(item => <div key={item.id} className={`rounded-xl p-4 ${item.is_admin ? "bg-primary/5" : "bg-secondary/40"}`}><p className="mb-2 text-xs text-muted-foreground">{item.is_admin ? "客服" : "我"} · {new Date(item.created_at).toLocaleString("zh-CN")}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{item.body}</p></div>)}</div><form onSubmit={send} className="space-y-3"><Textarea aria-label="追加说明" required minLength={1} maxLength={5000} value={reply} onChange={e => setReply(e.target.value)} placeholder="追加说明或回复客服…" /><Button type="submit" disabled={busy}><Send className="mr-2 h-4 w-4" />发送回复</Button></form></div>}
    </section></div></main></div>;
}
