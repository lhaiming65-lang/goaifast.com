import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  UserPlus, Share2, Wallet, Globe, Smile, Headphones, TrendingUp,
  Link2, BarChart3, CreditCard, UserCog, Check, X, ChevronRight, Youtube, Instagram, Video, Users,
} from "lucide-react";

const BRAND = "GoAifast";

type Copy = {
  heroKicker: string; heroTitle: string; heroSub: string;
  countries: string; monthly: string; cta: string;
  startTitle: string; startSub: string;
  steps: { title: string; desc: string }[];
  whyTitle: string; whySub: string;
  advantages: { title: string; desc: string }[];
  joinTitle: string;
  benefits: { title: string; desc: string }[];
  bindTitle: string; bindIntro: string; bindBad: string[]; bindGood: string[];
  matchTitle: string; matchSub: string; matchTypes: string[];
  partnersTitle: string;
  reviews: { name: string; from: string; text: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
  finalTitle: string; finalSub: string;
};

const EN: Copy = {
  heroKicker: "Start earning today",
  heroTitle: `Become a ${BRAND} Affiliate Partner`,
  heroSub: `Share ${BRAND} with your audience and earn recurring commission on every order — forever.`,
  countries: "200+ supported countries & regions",
  monthly: "Earn up to 10,000+ USD every month",
  cta: "Become a partner",
  startTitle: "How to get started",
  startSub: "Just 3 simple steps to start earning",
  steps: [
    { title: "Sign up", desc: "It takes less than a minute to join our affiliate network." },
    { title: "Share your link", desc: `We give you a unique affiliate link and promo code. Share it to promote ${BRAND}!` },
    { title: "Earn commission", desc: "Every new customer you refer earns you commission on their purchase." },
  ],
  whyTitle: "Why choose us — our advantages",
  whySub: "Our service, our sincerity, our market",
  advantages: [
    { title: "Global audience", desc: "We serve users in over 200 countries, so there is always a perfect match for your audience." },
    { title: "High satisfaction", desc: "A 4.9/5 average rating from our community. A great platform means happier fans." },
    { title: "Worry-free service", desc: "24/7 customer service with 95% of issues solved within one minute." },
  ],
  joinTitle: `Why join the ${BRAND} affiliate program?`,
  benefits: [
    { title: "High commission, huge market", desc: "Industry-leading rewards — up to 18.00% commission, plus recurring commission on renewals. Custom payouts are available based on performance and traffic value." },
    { title: "Track your success", desc: "A full dashboard with deep insight into your campaigns and handy tools to analyse your earnings." },
    { title: "Ultra-low payout threshold", desc: "The minimum payout is only $100. Every success starts with a warm-up phase and we love to see you grow." },
    { title: "Personal partner manager", desc: "A dedicated partner manager helps you with sales and integration tips so you succeed faster." },
  ],
  bindTitle: "Long-lasting referral relationships",
  bindIntro: "Most affiliate programs rely on cookies alone and pay only on time-limited orders. We store the binding permanently in our database, which means:",
  bindBad: ["No lost binding when users clear their cache", "No lost binding when users switch browsers", "No missing orders"],
  bindGood: ["Every effort is properly recorded", "You earn on every renewal and new order from your referrals"],
  matchTitle: "Is the affiliate program a match for you?",
  matchSub: "You are welcome to join if you have any of the following:",
  matchTypes: ["YouTube channel", "TikTok account", "Instagram / Facebook page", "Blog, forum or deal site", "Telegram / Discord community", "Student or office community"],
  partnersTitle: "Growing together with 3,000+ partners",
  reviews: [
    { name: "JinBlog", from: "[YouTube · IT channel]", text: `Working with ${BRAND} has been a great experience. Compared with other services it has a large user base, a reliable platform and rich statistics for affiliates.` },
    { name: "Pierpaolo M.", from: "[YouTube · IT channel]", text: `I have worked with ${BRAND} for a long time. It is a very reliable website that I use myself and benefit from. I hope more people will trust the affiliate program.` },
    { name: "Mystery Influencer", from: "[Somewhere on the internet]", text: `${BRAND} is a fantastic platform. I recommend it to every one of my followers — it saves them money and brings me a solid income every month.` },
  ],
  faqTitle: "Frequently asked questions",
  faqs: [
    { q: "How much commission can I earn?", a: "Up to 18% of every completed order, including renewals from customers you referred." },
    { q: "When do I get paid?", a: "Payouts are processed monthly via PayPal, USDT or bank transfer once your balance reaches $100." },
    { q: "Do I need a large following?", a: "No. Anyone with an audience — big or small — can join. We review each application within 2 business days." },
    { q: "How is my referral tracked?", a: "Through your unique link and promo code, plus a permanent binding stored in our database." },
  ],
  finalTitle: "Ready to start earning?",
  finalSub: "Join today and turn your audience into recurring income.",
};

const ZH: Copy = {
  heroKicker: "立即赚钱",
  heroTitle: `成为 ${BRAND} 联盟计划伙伴`,
  heroSub: `把 ${BRAND} 分享给你的粉丝，每一笔订单都能获得长期佣金。`,
  countries: "200+ 支持国家和地区",
  monthly: "每月最高可赚取 10,000+ USD",
  cta: "成为会员",
  startTitle: "如何开始",
  startSub: "只需 3 个简单步骤即可开始赚钱",
  steps: [
    { title: "报名", desc: "只需一分钟即可成为我们联盟网络的一员。" },
    { title: "分享您的链接", desc: `我们将为您提供唯一的联盟链接和推广码，分享它来推广 ${BRAND}！` },
    { title: "赚取佣金", desc: "您推荐的每位新客户成功购买后，您都可以获得佣金！" },
  ],
  whyTitle: "为什么选择我们 — 我们的优势",
  whySub: "我们的服务，我们的诚意，我们的市场",
  advantages: [
    { title: "全球观众", desc: "我们为来自 200 多个国家的用户提供服务，确保与您的受众完美匹配。" },
    { title: "高满意度", desc: "社区平均评分保持在 4.9/5，优秀的平台意味着更多满意的粉丝。" },
    { title: "无忧服务", desc: "提供 24/7 客户服务，95% 的问题在一分钟内得到解决。" },
  ],
  joinTitle: `为什么要加入 ${BRAND} 联盟计划？`,
  benefits: [
    { title: "佣金高，市场潜力大", desc: "我们提供行业领先的绩效奖励——最高 18.00% 佣金，并提供续费的定期佣金。还可根据绩效和流量价值提供定制方案。" },
    { title: "追踪您的成功", desc: "提供完整的推广仪表板，帮助您深入了解推广活动，并用便捷工具分析收入。" },
    { title: "超低支付门槛", desc: "最低支付门槛仅为 100 美元，每一次成功都始于初始热身阶段，我们乐于见证您的成长。" },
    { title: "个人合作经理", desc: "获得专属合作伙伴经理的帮助，为您提供销售与整合技巧，助您更快取得成功。" },
  ],
  bindTitle: "持久的推荐关系",
  bindIntro: "市场上大多数联盟计划仅依赖 cookies 绑定关系，并按限时订单结算佣金。我们不仅使用 cookies，还将绑定关系永久存储在数据库中，以确保：",
  bindBad: ["不会因用户清除缓存而丢失绑定", "不会因更换浏览器而丢失绑定", "拒绝任何遗漏的订单"],
  bindGood: ["确保每项努力都得到妥善记录", "您绑定的推荐人每笔续订和新订单都能赚取佣金"],
  matchTitle: "联盟计划和你匹配吗？",
  matchSub: "如果您拥有以下任何一项，欢迎加入我们：",
  matchTypes: ["YouTube 频道", "TikTok 账号", "Instagram / Facebook 主页", "博客、论坛或优惠网站", "Telegram / Discord 社群", "学生或职场社群"],
  partnersTitle: "和 3,000+ 位合作伙伴一起成长",
  reviews: [
    { name: "JinBlog 진블로그", from: "[Youtube · IT 频道]", text: `通过与 ${BRAND} 的合作，我们获得了良好的体验和收益。与其他服务相比，它拥有大量用户、可靠的平台以及丰富的联盟统计数据。` },
    { name: "Pierpaolo M.", from: "[Youtube · IT 频道]", text: `我与 ${BRAND} 合作了很长时间，这是一个非常可靠的网站，我亲身体验并从中受益匪浅，希望更多人能信任并从联盟计划中受益。` },
    { name: "神秘影响者", from: "[互联网上的某个地方]", text: `${BRAND} 是一个很棒的平台。我会向我的每一个关注者推荐它，它帮助他们省钱，同时每月给我带来非常可观的收入！` },
  ],
  faqTitle: "常见问题",
  faqs: [
    { q: "我能赚多少佣金？", a: "每笔完成订单最高 18%，包含您推荐用户的续费订单。" },
    { q: "什么时候结算？", a: "余额满 100 美元后，每月通过 PayPal、USDT 或银行转账结算。" },
    { q: "需要很多粉丝吗？", a: "不需要。无论受众大小都可以申请，我们会在 2 个工作日内完成审核。" },
    { q: "推荐关系如何追踪？", a: "通过您的专属链接与推广码，并在我们的数据库中永久绑定。" },
  ],
  finalTitle: "准备好开始赚钱了吗？",
  finalSub: "立即加入，把你的受众变成持续收入。",
};

const stepIcons = [UserPlus, Share2, Wallet];
const advIcons = [Globe, Smile, Headphones];
const benefitIcons = [TrendingUp, BarChart3, CreditCard, UserCog];
const matchIcons = [Youtube, Video, Instagram, Link2, Users, Users];

export default function Affiliate() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || "en";
  const c = lang.startsWith("zh") ? ZH : EN;
  const home = lang.startsWith("zh") ? "首页" : "Home";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_0%,white,transparent_40%)]" />
          <div className="relative container mx-auto px-6 max-w-6xl py-14 md:py-20">
            <nav className="flex items-center gap-2 text-sm text-white/70 mb-6">
              <Link to="/" className="hover:text-white">{home}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">{c.heroTitle}</span>
            </nav>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-semibold mb-5">
              {c.heroKicker}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-3xl leading-tight">
              {c.heroTitle}
            </h1>
            <p className="mt-4 text-white/85 text-base md:text-lg max-w-2xl">{c.heroSub}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 font-semibold">{c.countries}</div>
              <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 font-semibold">{c.monthly}</div>
            </div>
            <Link
              to="/affiliate/apply"
              className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-indigo-700 font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {c.cta} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* How to start */}
        <section className="container mx-auto px-6 max-w-6xl py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center">{c.startTitle}</h2>
          <p className="text-center text-slate-500 mt-2">{c.startSub}</p>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {c.steps.map((s, i) => {
              const Icon = stepIcons[i];
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="text-xs font-bold text-indigo-500 mb-1">0{i + 1}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-slate-600 text-[15px] leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Advantages */}
        <section className="bg-white border-y border-slate-100">
          <div className="container mx-auto px-6 max-w-6xl py-14 md:py-20">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center">{c.whyTitle}</h2>
            <p className="text-center text-slate-500 mt-2">{c.whySub}</p>
            <div className="grid md:grid-cols-3 gap-6 mt-10">
              {c.advantages.map((a, i) => {
                const Icon = advIcons[i];
                return (
                  <div key={i} className="rounded-2xl bg-slate-50 border border-slate-100 p-8">
                    <Icon className="w-10 h-10 text-indigo-600 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{a.title}</h3>
                    <p className="text-slate-600 text-[15px] leading-relaxed">{a.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why join */}
        <section className="container mx-auto px-6 max-w-6xl py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-10">{c.joinTitle}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {c.benefits.map((b, i) => {
              const Icon = benefitIcons[i];
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{b.title}</h3>
                  <p className="text-slate-600 text-[15px] leading-[1.8]">{b.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Binding */}
          <div className="mt-6 bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-3xl p-8 md:p-10">
            <h3 className="text-xl md:text-2xl font-bold mb-3">{c.bindTitle}</h3>
            <p className="text-white/75 text-[15px] leading-[1.85] max-w-3xl">{c.bindIntro}</p>
            <div className="grid md:grid-cols-2 gap-3 mt-6">
              {c.bindBad.map((t) => (
                <div key={t} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <X className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-[15px] text-white/90">{t}</span>
                </div>
              ))}
              {c.bindGood.map((t) => (
                <div key={t} className="flex items-start gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[15px] text-white/90">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Match */}
        <section className="bg-white border-y border-slate-100">
          <div className="container mx-auto px-6 max-w-6xl py-14 md:py-20">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center">{c.matchTitle}</h2>
            <p className="text-center text-slate-500 mt-2">{c.matchSub}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
              {c.matchTypes.map((m, i) => {
                const Icon = matchIcons[i % matchIcons.length];
                return (
                  <div key={m} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
                    <Icon className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 text-[15px]">{m}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="container mx-auto px-6 max-w-6xl py-14 md:py-20">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-10">{c.partnersTitle}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {c.reviews.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-[15px]">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.from}</div>
                  </div>
                </div>
                <p className="text-slate-600 text-[15px] leading-[1.8]">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white border-t border-slate-100">
          <div className="container mx-auto px-6 max-w-4xl py-14 md:py-20">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-10">{c.faqTitle}</h2>
            <div className="space-y-4">
              {c.faqs.map((f) => (
                <div key={f.q} className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                  <h3 className="font-bold text-slate-900 mb-2">{f.q}</h3>
                  <p className="text-slate-600 text-[15px] leading-[1.8]">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 max-w-4xl py-14 md:py-16 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold">{c.finalTitle}</h2>
            <p className="mt-3 text-white/85">{c.finalSub}</p>
            <Link
              to="/affiliate/apply"
              className="mt-7 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-indigo-700 font-bold shadow-lg hover:scale-105 transition-transform"
            >
              {c.cta} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
