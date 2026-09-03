import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight, Youtube, Video, Instagram, Link2, Users, Send,
  CheckCircle2, Loader2, Megaphone, Globe2, MessageSquare,
} from "lucide-react";

const BRAND = "GoAifast";

type Copy = {
  heroKicker: string; heroTitle: string; heroSub: string;
  needLogin: string; loginBtn: string;
  formTitle: string; formSub: string;
  name: string; namePh: string;
  email: string; emailPh: string;
  country: string; countryPh: string;
  channelType: string;
  channelUrl: string; channelUrlPh: string;
  audience: string; audiencePh: string;
  plan: string; planPh: string;
  payout: string;
  contact: string; contactPh: string;
  note: string; notePh: string;
  submit: string; submitting: string;
  agree: string; terms: string; and: string; privacy: string;
  successTitle: string; successSub: string; successBtn: string;
  fail: string;
};

const CHANNELS = [
  { key: "youtube", zh: "YouTube 频道", en: "YouTube channel", Icon: Youtube },
  { key: "tiktok", zh: "TikTok 账号", en: "TikTok account", Icon: Video },
  { key: "instagram", zh: "Instagram / Facebook", en: "Instagram / Facebook", Icon: Instagram },
  { key: "blog", zh: "博客 / 论坛 / 优惠站", en: "Blog / forum / deal site", Icon: Link2 },
  { key: "community", zh: "Telegram / Discord 社群", en: "Telegram / Discord community", Icon: Users },
  { key: "other", zh: "其他渠道", en: "Other channel", Icon: Megaphone },
];

const PAYOUTS = [
  { key: "paypal", label: "PayPal" },
  { key: "usdt", label: "USDT (TRC20)" },
  { key: "bank", zh: "银行转账", en: "Bank transfer" },
];

const EN: Copy = {
  heroKicker: "Affiliate application",
  heroTitle: `Apply to become a ${BRAND} member partner`,
  heroSub: "Tell us about your channel. We review every application within 2 business days.",
  needLogin: "Please sign in first to submit your application.",
  loginBtn: "Log in / Sign up",
  formTitle: "Application form",
  formSub: "Fields marked * are required.",
  name: "Your name *", namePh: "e.g. Alex Chen",
  email: "Email *", emailPh: "you@example.com",
  country: "Country / Region", countryPh: "e.g. United States",
  channelType: "Your main promotion channel *",
  channelUrl: "Channel link", channelUrlPh: "https://youtube.com/@yourchannel",
  audience: "Audience size", audiencePh: "e.g. 5,000 subscribers",
  plan: "How will you promote us?",
  planPh: "Videos, reviews, community posts, discount articles...",
  payout: "Preferred payout method",
  contact: "Other contact (Telegram / WhatsApp)", contactPh: "@yourname",
  note: "Anything else", notePh: "Optional notes for our partner team",
  submit: "Submit application", submitting: "Submitting...",
  agree: "By submitting, you agree to our", terms: "Terms & Conditions", and: "and", privacy: "Privacy Policy",
  successTitle: "Application submitted!",
  successSub: "Thank you for applying. Our partner team will review your application and contact you within 2 business days.",
  successBtn: "Back to affiliate program",
  fail: "Submission failed. Please try again later.",
};

const ZH: Copy = {
  heroKicker: "会员申请",
  heroTitle: `申请成为 ${BRAND} 会员合作伙伴`,
  heroSub: "告诉我们你的推广渠道，我们会在 2 个工作日内完成审核。",
  needLogin: "请先登录后再提交申请。",
  loginBtn: "登录 / 注册",
  formTitle: "申请表单",
  formSub: "带 * 为必填项。",
  name: "您的姓名 *", namePh: "例如：张三",
  email: "邮箱 *", emailPh: "you@example.com",
  country: "国家 / 地区", countryPh: "例如：中国",
  channelType: "主要推广渠道 *",
  channelUrl: "渠道链接", channelUrlPh: "https://youtube.com/@yourchannel",
  audience: "粉丝 / 受众规模", audiencePh: "例如：5,000 订阅",
  plan: "您打算如何推广我们？",
  planPh: "视频测评、社群分享、优惠文章……",
  payout: "首选结算方式",
  contact: "其他联系方式（Telegram / WhatsApp）", contactPh: "@yourname",
  note: "其他说明", notePh: "想对合作团队说的话（选填）",
  submit: "提交申请", submitting: "提交中...",
  agree: "提交即表示您同意我们的", terms: "服务条款", and: "和", privacy: "隐私政策",
  successTitle: "申请已提交！",
  successSub: "感谢您的申请，我们的合作团队将在 2 个工作日内审核并与您联系。",
  successBtn: "返回联盟计划",
  fail: "提交失败，请稍后重试。",
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition";
const labelCls = "block text-sm font-semibold text-slate-700 mb-1.5";

export default function AffiliateApply() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const c = lang.startsWith("zh") ? ZH : EN;
  const home = lang.startsWith("zh") ? "首页" : "Home";
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", country: "", channel_type: "", channel_url: "",
    audience_size: "", promotion_plan: "", payout_method: "paypal", contact: "", note: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
      setAuthChecked(true);
    });
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit = form.name.trim() && form.email.trim() && form.channel_type;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("affiliate_applications").insert({
      user_id: userId,
      name: form.name.trim(),
      email: form.email.trim(),
      country: form.country.trim() || null,
      channel_type: form.channel_type,
      channel_url: form.channel_url.trim() || null,
      audience_size: form.audience_size.trim() || null,
      promotion_plan: form.promotion_plan.trim() || null,
      payout_method: form.payout_method,
      contact: form.contact.trim() || null,
      note: form.note.trim() || null,
    });
    setSubmitting(false);
    if (err) setError(c.fail);
    else setDone(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_0%,white,transparent_40%)]" />
          <div className="relative container mx-auto px-6 max-w-4xl py-12 md:py-16">
            <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
              <Link to="/" className="hover:text-white">{home}</Link>
              <ChevronRight className="w-4 h-4" />
              <Link to="/page/affiliate" className="hover:text-white">Affiliate</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Apply</span>
            </nav>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-semibold mb-5">
              {c.heroKicker}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{c.heroTitle}</h1>
            <p className="mt-3 text-white/85 text-base md:text-lg max-w-2xl">{c.heroSub}</p>
          </div>
        </section>

        {/* Body */}
        <section className="container mx-auto px-6 max-w-3xl py-10 md:py-14">
          {!authChecked ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
          ) : !userId ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
              <Globe2 className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <p className="text-slate-700 font-semibold text-lg mb-6">{c.needLogin}</p>
              <button
                onClick={() => navigate("/auth", { state: { from: "/affiliate/apply" } })}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
              >
                {c.loginBtn} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : done ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-10 text-center">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{c.successTitle}</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-7">{c.successSub}</p>
              <Link
                to="/page/affiliate"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
              >
                {c.successBtn} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 md:p-10">
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{c.formTitle}</h2>
              <p className="text-sm text-slate-500 mt-1 mb-7">{c.formSub}</p>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>{c.name}</label>
                  <input className={inputCls} value={form.name} onChange={set("name")} placeholder={c.namePh} required />
                </div>
                <div>
                  <label className={labelCls}>{c.email}</label>
                  <input type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder={c.emailPh} required />
                </div>
                <div>
                  <label className={labelCls}>{c.country}</label>
                  <input className={inputCls} value={form.country} onChange={set("country")} placeholder={c.countryPh} />
                </div>
                <div>
                  <label className={labelCls}>{c.audience}</label>
                  <input className={inputCls} value={form.audience_size} onChange={set("audience_size")} placeholder={c.audiencePh} />
                </div>
              </div>

              <div className="mt-6">
                <label className={labelCls}>{c.channelType}</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CHANNELS.map(({ key, zh, en, Icon }) => {
                    const active = form.channel_type === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setForm((f) => ({ ...f, channel_type: key }))}
                        className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-[14px] font-semibold transition ${
                          active
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/30"
                            : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                        {lang.startsWith("zh") ? zh : en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-6">
                <div>
                  <label className={labelCls}>{c.channelUrl}</label>
                  <input className={inputCls} value={form.channel_url} onChange={set("channel_url")} placeholder={c.channelUrlPh} />
                </div>
                <div>
                  <label className={labelCls}>{c.payout}</label>
                  <div className="flex gap-2">
                    {PAYOUTS.map((p) => {
                      const active = form.payout_method === p.key;
                      return (
                        <button
                          type="button"
                          key={p.key}
                          onClick={() => setForm((f) => ({ ...f, payout_method: p.key }))}
                          className={`flex-1 rounded-xl border px-3 py-3 text-[13px] font-semibold transition ${
                            active
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/30"
                              : "border-slate-200 text-slate-600 hover:border-indigo-300"
                          }`}
                        >
                          {"label" in p ? p.label : lang.startsWith("zh") ? p.zh : p.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className={labelCls}>{c.plan}</label>
                <textarea rows={4} className={inputCls} value={form.promotion_plan} onChange={set("promotion_plan")} placeholder={c.planPh} />
              </div>

              <div className="grid md:grid-cols-2 gap-5 mt-6">
                <div>
                  <label className={labelCls}>{c.contact}</label>
                  <input className={inputCls} value={form.contact} onChange={set("contact")} placeholder={c.contactPh} />
                </div>
                <div>
                  <label className={labelCls}>{c.note}</label>
                  <input className={inputCls} value={form.note} onChange={set("note")} placeholder={c.notePh} />
                </div>
              </div>

              {error && <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 text-white font-bold text-base shadow-lg hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? c.submitting : c.submit}
              </button>

              <p className="mt-4 text-xs text-slate-500 text-center leading-relaxed">
                {c.agree}{" "}
                <Link to="/page/terms" className="text-indigo-600 hover:underline">{c.terms}</Link> {c.and}{" "}
                <Link to="/page/privacy" className="text-indigo-600 hover:underline">{c.privacy}</Link>
                <MessageSquare className="inline w-3.5 h-3.5 ml-1 text-slate-400" />
              </p>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
