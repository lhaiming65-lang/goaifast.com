// Content for static/legal pages. Adapted from GoAifast-style templates for GoAifast.
// Content is authored in EN and ZH; other languages fall back to EN.

export type Section = { heading?: string; paragraphs: string[]; list?: string[] };
export type PageContent = {
  title: string;
  updated?: string;
  intro?: string;
  sections: Section[];
};

export type PageSlug =
  | "about-us"
  | "contact-us"
  | "help-center"
  | "affiliate"
  | "blog"
  | "brand-assets"
  | "suggest-subscription"
  | "refer-earn"
  | "sell-to-us"
  | "terms"
  | "privacy"
  | "copyright"
  | "refund"
  | "aml"
  | "gdpr";

type Locales = { en: PageContent; zh: PageContent };

const BRAND = "GoAifast";
const CONTACT = "support@goaifast.com";
const UPDATED = "July 3, 2026";

export const legalPages: Record<PageSlug, Locales> = {
  "about-us": {
    en: {
      title: "About Us",
      intro: `${BRAND} is a digital subscription marketplace that helps users access premium streaming, music, gaming, and productivity services at a fraction of the retail price through legitimate group-buy plans.`,
      sections: [
        { heading: "Our Mission", paragraphs: [
          `We believe premium digital services should be affordable for everyone. ${BRAND} negotiates family and multi-seat plans directly with providers and shares the savings with our community.`,
        ]},
        { heading: "What We Do", paragraphs: [
          "We aggregate demand from thousands of users worldwide, purchase multi-user subscriptions in bulk, and deliver dedicated seats to each customer instantly and securely.",
        ]},
        { heading: "Why Choose Us", paragraphs: [
          "Instant account delivery, 24/7 customer support, replacement guarantees for the full subscription period, and a growing catalog of 100+ services.",
        ]},
      ],
    },
    zh: {
      title: "关于我们",
      intro: `${BRAND} 是一家数字订阅市场,通过合法的合租拼团模式,帮助用户以极低价格享受高级流媒体、音乐、游戏和办公服务。`,
      sections: [
        { heading: "我们的使命", paragraphs: [
          `我们相信优质数字服务应当人人可及。${BRAND} 与服务商直接洽谈家庭版与多席位套餐,并将节省的费用回馈给社区用户。`,
        ]},
        { heading: "我们做什么", paragraphs: [
          "我们汇聚来自全球的数千用户需求,批量采购多用户订阅,并向每位客户即时安全地分发独立席位。",
        ]},
        { heading: "为什么选择我们", paragraphs: [
          "账号即时发货、7×24 客服支持、订阅期内全程质保补号,以及超过 100 款持续增加的服务目录。",
        ]},
      ],
    },
  },

  "contact-us": {
    en: {
      title: "Contact Us",
      intro: "We're here to help 24/7. Choose the channel that works best for you.",
      sections: [
        { heading: "Customer Support", paragraphs: [
          `Email: ${CONTACT}`,
          "Response time: within 12 hours, usually much faster.",
        ]},
        { heading: "Business & Partnerships", paragraphs: [
          `Email: partners@goaifast.com`,
          "For bulk orders, resellers, and B2B integrations.",
        ]},
        { heading: "Press", paragraphs: [
          "For media inquiries, please contact press@goaifast.com.",
        ]},
      ],
    },
    zh: {
      title: "联系我们",
      intro: "我们提供 7×24 全天候服务,请选择最适合您的联系方式。",
      sections: [
        { heading: "客户支持", paragraphs: [
          `邮箱:${CONTACT}`,
          "响应时间:12 小时内,通常更快。",
        ]},
        { heading: "商务与合作", paragraphs: [
          `邮箱:partners@goaifast.com`,
          "适用于批量订购、经销商合作及 B2B 集成。",
        ]},
        { heading: "媒体联络", paragraphs: [
          "如需媒体采访,请发邮件至 press@goaifast.com。",
        ]},
      ],
    },
  },

  "help-center": {
    en: {
      title: "Help Center",
      intro: "Find answers to the most common questions about ordering, delivery, and account issues.",
      sections: [
        { heading: "How does the order work?", paragraphs: [
          "After payment, your account credentials are delivered instantly to your email and to the Orders page in your account.",
        ]},
        { heading: "What if my account stops working?", paragraphs: [
          "Contact us any time within your subscription period and we will replace the account free of charge, usually within 12 hours.",
        ]},
        { heading: "Can I change my password?", paragraphs: [
          "For most services the password is fixed to keep the group plan stable. If password change is supported, it will be indicated on the product page.",
        ]},
        { heading: "How do I get a refund?", paragraphs: [
          "See our Refund Policy for eligibility. Contact support with your order ID to start a refund request.",
        ]},
      ],
    },
    zh: {
      title: "帮助中心",
      intro: "在这里可以找到关于下单、发货和账号问题的常见解答。",
      sections: [
        { heading: "订单流程是怎样的?", paragraphs: [
          "付款成功后,账号信息将立即发送至您的邮箱,并同步显示在个人中心的订单页面。",
        ]},
        { heading: "账号无法使用怎么办?", paragraphs: [
          "在订阅期内随时联系我们,通常 12 小时内免费补号。",
        ]},
        { heading: "可以修改密码吗?", paragraphs: [
          "为保证合租稳定性,大多数服务不支持自行修改密码。如支持,会在商品详情页注明。",
        ]},
        { heading: "如何申请退款?", paragraphs: [
          "请查看《退款政策》确认资格,并联系客服提供订单号办理。",
        ]},
      ],
    },
  },

  affiliate: {
    en: {
      title: "Affiliate Program",
      intro: `Earn commissions by promoting ${BRAND} to your audience.`,
      sections: [
        { heading: "How it works", paragraphs: [
          "Sign up as an affiliate, get your unique tracking link, and earn up to 15% commission on every completed order made through your link.",
        ]},
        { heading: "Who can join", paragraphs: [
          "Content creators, bloggers, YouTubers, deal-site operators, and communities focused on entertainment, tech, or savings.",
        ]},
        { heading: "Payouts", paragraphs: [
          "Monthly payouts via PayPal, USDT, or bank transfer once you reach the $50 minimum threshold.",
        ]},
      ],
    },
    zh: {
      title: "推广联盟",
      intro: `通过向您的受众推荐 ${BRAND},您可以赚取佣金。`,
      sections: [
        { heading: "运作方式", paragraphs: [
          "注册成为推广伙伴,获取专属追踪链接,每笔通过您链接完成的订单最高可获 15% 佣金。",
        ]},
        { heading: "谁可以加入", paragraphs: [
          "内容创作者、博主、YouTube 主、优惠网站运营者,以及娱乐/科技/省钱类社区。",
        ]},
        { heading: "结算方式", paragraphs: [
          "满 50 美元起,每月通过 PayPal、USDT 或银行转账结算。",
        ]},
      ],
    },
  },

  blog: {
    en: {
      title: "Blog",
      intro: "News, guides, and deep-dives on digital subscriptions and streaming.",
      sections: [
        { paragraphs: [
          "Our blog is being prepared. Come back soon for hand-picked articles on how to save on streaming, gaming, and productivity software.",
        ]},
      ],
    },
    zh: {
      title: "博客",
      intro: "关于数字订阅与流媒体的新闻、指南和深度文章。",
      sections: [{ paragraphs: ["博客正在筹备中,敬请期待精选的流媒体、游戏与办公软件省钱攻略。"] }],
    },
  },

  "brand-assets": {
    en: {
      title: "Brand Assets",
      intro: `Download official ${BRAND} logos, colors, and usage guidelines for press and partner use.`,
      sections: [
        { heading: "Logo", paragraphs: ["High-resolution PNG and SVG versions are available upon request via press@goaifast.com."] },
        { heading: "Colors", paragraphs: ["Primary: #2563eb (Blue) and #6366f1 (Indigo). Backgrounds: #0f172a (Deep Navy)."] },
        { heading: "Usage", paragraphs: [
          "Do not stretch, recolor, or add effects to the logo. Maintain clear space equal to the height of the wordmark on all sides.",
        ]},
      ],
    },
    zh: {
      title: "品牌资源",
      intro: `下载 ${BRAND} 官方 Logo、配色与使用规范,供媒体与合作伙伴使用。`,
      sections: [
        { heading: "Logo", paragraphs: ["如需高清 PNG / SVG 版本,请发送邮件至 press@goaifast.com。"] },
        { heading: "配色", paragraphs: ["主色:#2563eb (蓝) 与 #6366f1 (靛)。背景:#0f172a (深藏青)。"] },
        { heading: "使用规范", paragraphs: [
          "请勿拉伸、变色或添加特效。Logo 四周应保留至少与标识高度相同的留白。",
        ]},
      ],
    },
  },

  "suggest-subscription": {
    en: {
      title: "Suggest a Subscription",
      intro: "Missing a service you love? Tell us and we may add it to our catalog.",
      sections: [
        { paragraphs: [
          `Send the service name, its official website, and how you would use it to ${CONTACT} with the subject line "Suggest a Subscription".`,
          "We review every suggestion and prioritize services with the highest community demand.",
        ]},
      ],
    },
    zh: {
      title: "订阅建议",
      intro: "有想要的服务还没上线?告诉我们,我们可能会将其加入产品目录。",
      sections: [
        { paragraphs: [
          `发送邮件至 ${CONTACT},主题为"订阅建议",并注明服务名称、官网地址以及使用场景。`,
          "我们会审核每一条建议,并优先上架社区需求最高的服务。",
        ]},
      ],
    },
  },

  "refer-earn": {
    en: {
      title: "Refer and Earn",
      intro: `Invite friends to ${BRAND} and earn credit for every successful referral.`,
      sections: [
        { heading: "How it works", paragraphs: [
          "Share your personal invite link from your account page. When a friend completes their first order, you both receive $3 in wallet credit.",
        ]},
        { heading: "Rules", paragraphs: [
          "Referral credit is non-withdrawable and can be used toward any purchase. Self-referrals and fraudulent invites will void the reward.",
        ]},
      ],
    },
    zh: {
      title: "推荐赚钱",
      intro: `邀请好友加入 ${BRAND},每成功推荐一位好友即可获得奖励。`,
      sections: [
        { heading: "运作方式", paragraphs: [
          "在个人中心分享您的专属邀请链接。当好友完成首单后,您和好友均可获得 3 美元钱包余额。",
        ]},
        { heading: "规则", paragraphs: [
          "奖励余额不可提现,可用于任意商品购买。自我推荐或欺诈性邀请将取消奖励资格。",
        ]},
      ],
    },
  },

  "sell-to-us": {
    en: {
      title: "Sell to Us",
      intro: "Own unused premium subscription seats or wholesale keys? We buy in bulk.",
      sections: [
        { paragraphs: [
          "Email partners@goaifast.com with the service, number of seats, region, and asking price. Our procurement team will respond within two business days.",
          "We only purchase legitimately obtained inventory. Proof of purchase is required.",
        ]},
      ],
    },
    zh: {
      title: "出售给我们",
      intro: "手上有闲置的高级订阅席位或批发密钥?我们进行批量收购。",
      sections: [
        { paragraphs: [
          "请发送邮件至 partners@goaifast.com,注明服务、席位数量、地区及报价,我们的采购团队将在 2 个工作日内回复。",
          "仅收购来源合法的库存,需提供购买凭证。",
        ]},
      ],
    },
  },

  terms: {
    en: {
      title: `${BRAND} Terms & Conditions`,
      updated: UPDATED,
      intro: `Welcome to ${BRAND}. By accessing or using our website and services, you agree to be bound by the following Terms & Conditions.`,
      sections: [
        { heading: "1. Service Description", paragraphs: [
          `${BRAND} provides shared and dedicated seats on legitimately purchased premium digital subscriptions. All services are delivered digitally after payment.`,
        ]},
        { heading: "2. Eligibility", paragraphs: [
          "You must be at least 18 years old, or the age of majority in your jurisdiction, to purchase from us.",
        ]},
        { heading: "3. Account & Order", paragraphs: [
          "You are responsible for keeping your login credentials safe. Sharing your seat with users outside your household may result in immediate suspension without refund.",
        ]},
        { heading: "4. Payment", paragraphs: [
          "All prices are displayed in your selected currency and include applicable taxes unless stated otherwise. Payment is charged in full at checkout.",
        ]},
        { heading: "5. Delivery", paragraphs: [
          "Orders are typically delivered instantly. If delivery is delayed by more than 24 hours, contact support for a full refund.",
        ]},
        { heading: "6. Warranty & Replacement", paragraphs: [
          "We guarantee your seat for the full subscription period. If an account stops working, we will replace it free of charge.",
        ]},
        { heading: "7. Prohibited Use", paragraphs: [
          "Do not resell, redistribute, modify credentials, or use our services for any illegal activity.",
        ]},
        { heading: "8. Limitation of Liability", paragraphs: [
          `${BRAND} is not liable for third-party service outages, content availability changes, or any indirect damages arising from use of our services.`,
        ]},
        { heading: "9. Changes to Terms", paragraphs: [
          "We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance.",
        ]},
        { heading: "10. Contact", paragraphs: [
          `Questions? Email ${CONTACT}.`,
        ]},
      ],
    },
    zh: {
      title: `${BRAND} 服务条款`,
      updated: UPDATED,
      intro: `欢迎使用 ${BRAND}。访问或使用本网站及服务即表示您同意受以下条款约束。`,
      sections: [
        { heading: "一、服务说明", paragraphs: [
          `${BRAND} 提供合法采购的高级数字订阅的共享或独立席位,所有服务均在付款后以数字方式交付。`,
        ]},
        { heading: "二、使用资格", paragraphs: [
          "您必须年满 18 周岁或所在司法辖区的法定成年年龄方可下单。",
        ]},
        { heading: "三、账户与订单", paragraphs: [
          "请妥善保管您的登录凭据。将席位共享给家庭以外的用户可能导致立即停用且不予退款。",
        ]},
        { heading: "四、付款", paragraphs: [
          "所有价格以您选择的货币显示,除非另行说明,均已含相关税费。付款须在结账时一次完成。",
        ]},
        { heading: "五、交付", paragraphs: [
          "订单通常即时发货。如超过 24 小时仍未送达,请联系客服申请全额退款。",
        ]},
        { heading: "六、质保与补号", paragraphs: [
          "我们对订阅有效期内的席位提供全程质保,若账号失效将免费补号。",
        ]},
        { heading: "七、禁止行为", paragraphs: [
          "禁止转售、二次分发、修改凭据或将服务用于任何非法活动。",
        ]},
        { heading: "八、责任限制", paragraphs: [
          `${BRAND} 不对第三方服务中断、内容变更或因使用本服务而产生的任何间接损失负责。`,
        ]},
        { heading: "九、条款变更", paragraphs: [
          "我们可能不时更新本条款,变更后您继续使用即视为接受。",
        ]},
        { heading: "十、联系我们", paragraphs: [
          `如有疑问,请发送邮件至 ${CONTACT}。`,
        ]},
      ],
    },
  },

  privacy: {
    en: {
      title: "Privacy Policy",
      updated: UPDATED,
      intro: `${BRAND} respects your privacy. This policy explains what data we collect and how we use it.`,
      sections: [
        { heading: "Information We Collect", paragraphs: [
          "Account information (email, password hash), order information (products, prices, delivery address for digital receipts), and technical data (IP, device, browser) for security.",
        ]},
        { heading: "How We Use Data", paragraphs: [
          "To fulfill orders, provide customer support, prevent fraud, comply with legal obligations, and — with your consent — send marketing communications.",
        ]},
        { heading: "Sharing", paragraphs: [
          "We share data only with processors necessary to run the service (payment providers, email delivery, hosting). We do not sell personal data.",
        ]},
        { heading: "Retention", paragraphs: [
          "We keep account data while your account is active and for up to 3 years after closure for legal and accounting purposes.",
        ]},
        { heading: "Your Rights", paragraphs: [
          `Access, rectification, deletion, portability, and objection rights are available. Contact ${CONTACT} to exercise them.`,
        ]},
        { heading: "Cookies", paragraphs: [
          "We use strictly necessary cookies for login and cart, and optional analytics cookies with your consent.",
        ]},
      ],
    },
    zh: {
      title: "隐私政策",
      updated: UPDATED,
      intro: `${BRAND} 尊重您的隐私。本政策说明我们收集哪些数据以及如何使用。`,
      sections: [
        { heading: "我们收集的信息", paragraphs: [
          "账户信息(邮箱、密码哈希)、订单信息(商品、价格、数字收据地址)以及用于安全防护的技术数据(IP、设备、浏览器)。",
        ]},
        { heading: "如何使用", paragraphs: [
          "用于订单履行、客服支持、防欺诈、履行法律义务,并在您同意的前提下发送营销信息。",
        ]},
        { heading: "共享", paragraphs: [
          "仅与运营所必需的处理方共享(支付服务商、邮件服务、云托管),不出售个人数据。",
        ]},
        { heading: "留存期限", paragraphs: [
          "账户存续期间及注销后不超过 3 年,用于法律与财务合规。",
        ]},
        { heading: "您的权利", paragraphs: [
          `您享有访问、更正、删除、可携带以及反对处理的权利,请联系 ${CONTACT} 行使。`,
        ]},
        { heading: "Cookie", paragraphs: [
          "我们使用严格必要的登录/购物车 Cookie,并在您同意后使用可选的分析 Cookie。",
        ]},
      ],
    },
  },

  copyright: {
    en: {
      title: "Copyright Notice",
      updated: UPDATED,
      sections: [
        { paragraphs: [
          `All copyrights, trademarks, and service marks displayed on ${BRAND} belong to their respective owners. ${BRAND} is not affiliated with, endorsed by, or sponsored by any of the service providers whose subscriptions we resell.`,
          "If you are a rights holder and believe content on our site infringes your rights, email dmca@goaifast.com with details of the alleged infringement, your contact information, and a good-faith statement.",
        ]},
      ],
    },
    zh: {
      title: "版权声明",
      updated: UPDATED,
      sections: [
        { paragraphs: [
          `${BRAND} 网站上出现的所有版权、商标与服务标志均归其各自所有者所有。${BRAND} 与我们销售订阅的任何服务商均无从属、背书或赞助关系。`,
          "如您是权利人并认为本站内容侵犯您的权利,请发送邮件至 dmca@goaifast.com,注明侵权详情、联系方式及善意声明。",
        ]},
      ],
    },
  },

  refund: {
    en: {
      title: "Refund Policy",
      updated: UPDATED,
      intro: "We stand behind every order. Refunds are handled according to the rules below.",
      sections: [
        { heading: "Eligible for Full Refund", paragraphs: [
          "Order not delivered within 24 hours; account never worked from delivery; service permanently discontinued before your subscription ends.",
        ]},
        { heading: "Partial (Pro-rated) Refund", paragraphs: [
          "Account fails and cannot be replaced during the subscription period — refund is calculated based on unused days.",
        ]},
        { heading: "Not Eligible", paragraphs: [
          "You changed your mind after successful delivery; you violated our Terms (sharing outside household, credential changes); issues caused by your own device or network.",
        ]},
        { heading: "How to Request", paragraphs: [
          `Email ${CONTACT} with your order ID and description of the issue. Approved refunds are processed within 5–7 business days back to the original payment method.`,
        ]},
      ],
    },
    zh: {
      title: "退款政策",
      updated: UPDATED,
      intro: "我们对每一笔订单负责。退款按以下规则处理。",
      sections: [
        { heading: "可全额退款", paragraphs: [
          "订单超过 24 小时未发货;账号自发货起从未可用;订阅期内服务被官方永久终止。",
        ]},
        { heading: "可按比例退款", paragraphs: [
          "订阅期内账号失效且无法补号——按剩余未使用天数计算退款金额。",
        ]},
        { heading: "不可退款", paragraphs: [
          "发货成功后个人原因申请退款;违反使用条款(家庭外共享、修改凭据);因您自身设备或网络导致的问题。",
        ]},
        { heading: "申请方式", paragraphs: [
          `请将订单号与问题描述发送至 ${CONTACT}。审核通过的退款将在 5–7 个工作日内原路退回。`,
        ]},
      ],
    },
  },

  aml: {
    en: {
      title: "Anti-Money Laundering (AML) Policy",
      updated: UPDATED,
      intro: `${BRAND} is committed to preventing money laundering, terrorism financing, and other financial crime.`,
      sections: [
        { heading: "Customer Due Diligence", paragraphs: [
          "We may request identity verification for transactions that exceed risk thresholds, involve unusual patterns, or are flagged by our fraud systems.",
        ]},
        { heading: "Transaction Monitoring", paragraphs: [
          "All transactions are monitored for suspicious activity such as structuring, use of high-risk payment methods, or multiple accounts with common indicators.",
        ]},
        { heading: "Prohibited Sources of Funds", paragraphs: [
          "Payments derived from illegal activities, stolen cards, or sanctioned parties are strictly prohibited and will be reported to competent authorities.",
        ]},
        { heading: "Reporting", paragraphs: [
          "Where required by law, we file Suspicious Activity Reports (SARs) with the relevant financial intelligence unit and cooperate fully with regulators.",
        ]},
      ],
    },
    zh: {
      title: "反洗钱(AML)政策",
      updated: UPDATED,
      intro: `${BRAND} 承诺防范洗钱、恐怖主义融资及其他金融犯罪。`,
      sections: [
        { heading: "客户尽职调查", paragraphs: [
          "对于超过风险阈值、模式异常或被反欺诈系统标记的交易,我们可能要求进行身份核实。",
        ]},
        { heading: "交易监控", paragraphs: [
          "我们对所有交易进行监控,识别拆分交易、使用高风险支付方式或多账号具有共同特征等可疑活动。",
        ]},
        { heading: "禁止的资金来源", paragraphs: [
          "严禁使用来自非法活动、被盗银行卡或受制裁方的资金付款,一经发现将上报有权机关。",
        ]},
        { heading: "举报", paragraphs: [
          "在法律要求下,我们会向相关金融情报机构提交可疑活动报告(SAR),并全面配合监管调查。",
        ]},
      ],
    },
  },

  gdpr: {
    en: {
      title: "GDPR Data Protection Notice",
      updated: UPDATED,
      intro: `If you are located in the European Economic Area, the following rights apply to your personal data processed by ${BRAND}.`,
      sections: [
        { heading: "Data Controller", paragraphs: [
          `${BRAND} acts as the data controller for personal data collected through this website. Contact: ${CONTACT}.`,
        ]},
        { heading: "Legal Bases", paragraphs: [
          "Performance of contract (fulfilling your orders), legitimate interests (fraud prevention, service improvement), consent (marketing, non-essential cookies), and legal obligation (tax, AML).",
        ]},
        { heading: "Your Rights", paragraphs: [
          "Access, rectification, erasure, restriction of processing, portability, and objection. You also have the right to lodge a complaint with your local data protection authority.",
        ]},
        { heading: "International Transfers", paragraphs: [
          "Where personal data is transferred outside the EEA, we rely on Standard Contractual Clauses and additional safeguards where required.",
        ]},
        { heading: "Data Protection Officer", paragraphs: [
          "Contact our DPO at dpo@goaifast.com for any GDPR-related requests.",
        ]},
      ],
    },
    zh: {
      title: "GDPR 数据保护声明",
      updated: UPDATED,
      intro: `如您位于欧洲经济区(EEA),${BRAND} 处理您个人数据时您享有以下权利。`,
      sections: [
        { heading: "数据控制者", paragraphs: [
          `${BRAND} 是通过本网站收集的个人数据的控制者。联系方式:${CONTACT}。`,
        ]},
        { heading: "法律依据", paragraphs: [
          "履行合同(履行订单)、合法利益(防欺诈、服务改进)、您的同意(营销、非必要 Cookie)以及法律义务(税务、反洗钱)。",
        ]},
        { heading: "您的权利", paragraphs: [
          "访问、更正、删除、限制处理、可携带以及反对权,您还有权向当地数据保护机构投诉。",
        ]},
        { heading: "跨境传输", paragraphs: [
          "如个人数据被传输至 EEA 之外,我们将依据标准合同条款(SCC)并在必要时采取额外保障措施。",
        ]},
        { heading: "数据保护官", paragraphs: [
          "如有 GDPR 相关请求,请联系我们的 DPO:dpo@goaifast.com。",
        ]},
      ],
    },
  },
};

export function getPageContent(slug: PageSlug, lang: string): PageContent {
  const key = (lang || "en").split("-")[0];
  const locales = legalPages[slug];
  if (!locales) return { title: "Not Found", sections: [] };
  return key === "zh" ? locales.zh : locales.en;
}
