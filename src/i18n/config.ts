import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

type Dict = {
  nav: {
    searchPlaceholder: string;
    signIn: string;
    home?: string;
    affiliate?: string;
    subscription?: string;
  };
  search?: {
    recentlySearched: string;
    clearAll: string;
    noResults: string;
  };
  userMenu?: {
    personalInfo: string;
    credits: string;
    mySubscription: string;
    support: string;
    helpCenter: string;
    orderHistory: string;
    affiliateProgram: string;
    referAndEarn: string;
    changeLanguage: string;
    logout: string;
    savedThrough: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    desc1: string;
    desc2: string;
    browse: string;
    learnMore: string;
    securePay: string;
    instantDelivery: string;
    bestPrice: string;
  };
  category: {
    title: string;
    subtitle: string;
    all: string;
    streaming: string;
    music: string;
    gaming: string;
    movies: string;
    software: string;
    audio: string;
    svod?: string;
    ai?: string;
    marketplace?: string;
    topup?: string;
    games?: string;
  };
  products: {
    sectionTitle: string;
    sectionSubtitle: string;
    empty: string;
    inStock: string;
    features: string;
    perMonth: string;
    original: string;
    autoDeliver: string;
    stableAccount: string;
    buyNow: string;
    save: string;
    badgeHot: string;
    badgeRecommend: string;
    badgeNew: string;
    viewMore: string;
  };
  checkout: {
    back: string;
    cashier: string;
    emailStep: string;
    emailPlaceholder: string;
    emailNotice: string;
    paymentStep: string;
    summary: string;
    coupon: string;
    couponPlaceholder: string;
    apply: string;
    subtotal: string;
    fee: string;
    total: string;
    processing: string;
    payNow: string;
    secureNotice: string;
    invalidEmail: string;
    demoAlert: string;
    duration: string;
  };
  language: { label: string };
  order?: {
    title: string;
    subtitle: string;
    orderId: string;
    placedAt: string;
    status: string;
    statusPaid: string;
    statusProcessing?: string;
    statusDelivered?: string;
    detailTitle?: string;
    detailSubtitle?: string;
    product: string;
    quantity: string;
    unitPrice: string;
    subtotal: string;
    discount: string;
    fee: string;
    total: string;
    paidWith: string;
    deliveryEmail: string;
    deliveryNote: string;
    backHome: string;
    viewInvoice: string;
    thanks: string;
  };
  auth?: {
    signIn: string;
    signUp: string;
    signOut: string;
    welcomeBack: string;
    createAccount: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    fullNamePlaceholder: string;
    forgotPassword: string;
    forgotPasswordTitle: string;
    forgotPasswordSubtitle: string;
    sendResetLink: string;
    resetLinkSent: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    newPassword: string;
    updatePassword: string;
    passwordUpdated: string;
    noAccount: string;
    haveAccount: string;
    orContinueWith: string;
    continueWithGoogle: string;
    continueWithApple: string;
    continueWithMicrosoft: string;
    microsoftUnavailable: string;
    agreeTerms: string;
    termsOfService: string;
    privacyPolicy: string;
    signingIn: string;
    signingUp: string;
    signInSuccess: string;
    signUpSuccess: string;
    signUpCheckEmail: string;
    signOutSuccess: string;
    passwordMismatch: string;
    passwordTooShort: string;
    invalidEmail: string;
    account: string;
    myOrders: string;
    myProfile: string;
    backHome: string;
  };
};

const zh: Dict = {
  nav: { searchPlaceholder: "搜索 Netflix、Spotify、游戏账号...", signIn: "登录 / 注册", home: "首页", affiliate: "推广合作", subscription: "订阅" },
  search: { recentlySearched: "最近搜索过", clearAll: "清除所有内容", noResults: "未找到相关产品" },
  userMenu: {
    personalInfo: "个人信息",
    credits: "余额",
    mySubscription: "我的订阅",
    support: "客服支持",
    helpCenter: "帮助中心",
    orderHistory: "订单历史",
    affiliateProgram: "推广计划",
    referAndEarn: "推荐赚钱",
    changeLanguage: "切换语言/货币",
    logout: "退出登录",
    savedThrough: "已通过 GoAifast 节省",
  },
  hero: {
    badge: "已服务 50,000+ 用户",
    title1: "优质数字服务",
    title2: "超值价格 极速交付",
    desc1: "Netflix、Spotify、游戏账号等热门服务一站购齐",
    desc2: "安全交易 • 即时发货 • 7×24小时客服",
    browse: "浏览商品",
    learnMore: "了解更多",
    securePay: "安全支付",
    instantDelivery: "即时发货",
    bestPrice: "超值价格",
  },
  category: {
    title: "分类浏览",
    subtitle: "点击分类快速找到您需要的服务",
    all: "全部",
    streaming: "流媒体",
    music: "音乐",
    gaming: "游戏",
    movies: "影视",
    software: "软件",
    audio: "音频",
    svod: "流媒体",
    ai: "AI",
    marketplace: "电商会员",
    topup: "充值卡",
    games: "游戏",
  },
  products: {
    sectionTitle: "分类浏览",
    sectionSubtitle: "点击分类查看对应软件",
    empty: "该分类暂无产品，敬请期待",
    inStock: "库存充足",
    features: "4K UHD • 独立车位 • 售后保障",
    perMonth: "/月",
    original: "原价",
    autoDeliver: "自动发货，秒级响应",
    stableAccount: "支持续费，账号稳定",
    buyNow: "立即购买",
    save: "省",
    badgeHot: "热销",
    badgeRecommend: "推荐",
    badgeNew: "新品",
    viewMore: "查看更多详情",
  },
  checkout: {
    back: "返回首页",
    cashier: "安全收银台",
    emailStep: "接收邮箱",
    emailPlaceholder: "yourname@example.com (重要：用于接收账号密码)",
    emailNotice: "我们承诺保护您的隐私，绝不发送垃圾邮件。",
    paymentStep: "选择支付方式",
    summary: "订单摘要",
    coupon: "优惠码",
    couponPlaceholder: "输入折扣代码",
    apply: "应用",
    subtotal: "小计",
    fee: "手续费 (0%)",
    total: "总计",
    processing: "正在处理...",
    payNow: "安全支付",
    secureNotice: "SSL 加密传输，保障支付安全",
    invalidEmail: "请填写有效的电子邮箱用于接收账号",
    demoAlert: "演示模式：支付流程已触发。在真实环境中，这里会跳转到 Stripe/PayPal 页面。",
    duration: "1 个月 / 独享车位",
  },
  language: { label: "语言" },
  order: {
    title: "订单支付成功",
    subtitle: "账号信息已发送到您的邮箱，请注意查收",
    orderId: "订单编号",
    placedAt: "下单时间",
    status: "状态",
    statusPaid: "已支付",
    statusProcessing: "处理中",
    statusDelivered: "已发货",
    detailTitle: "订单详情",
    detailSubtitle: "查看此订单的完整信息与支付明细",
    product: "商品",
    quantity: "数量",
    unitPrice: "单价",
    subtotal: "小计",
    discount: "优惠",
    fee: "手续费",
    total: "实付金额",
    paidWith: "支付方式",
    deliveryEmail: "接收邮箱",
    deliveryNote: "如10分钟内未收到邮件，请检查垃圾邮件或联系客服。",
    backHome: "返回首页",
    viewInvoice: "查看发票",
    thanks: "感谢您的购买！",
  },
  auth: {
    signIn: "登录",
    signUp: "注册",
    signOut: "退出登录",
    welcomeBack: "欢迎回来",
    createAccount: "创建账户",
    signInSubtitle: "登录您的账户，畅享全部服务",
    signUpSubtitle: "注册新账户，开启数字生活",
    email: "电子邮箱",
    password: "密码",
    confirmPassword: "确认密码",
    fullName: "昵称",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "至少 6 位字符",
    fullNamePlaceholder: "请输入您的昵称",
    forgotPassword: "忘记密码？",
    forgotPasswordTitle: "重置密码",
    forgotPasswordSubtitle: "输入邮箱，我们会发送重置链接给您",
    sendResetLink: "发送重置链接",
    resetLinkSent: "重置链接已发送，请查收邮箱",
    resetPasswordTitle: "设置新密码",
    resetPasswordSubtitle: "请输入您的新密码",
    newPassword: "新密码",
    updatePassword: "更新密码",
    passwordUpdated: "密码更新成功，请重新登录",
    noAccount: "还没有账户？",
    haveAccount: "已有账户？",
    orContinueWith: "或使用以下方式继续",
    continueWithGoogle: "使用 Google 继续",
    continueWithApple: "使用 Apple 继续",
    continueWithMicrosoft: "使用 Microsoft 继续",
    microsoftUnavailable: "当前后端暂不支持 Microsoft 登录",
    agreeTerms: "注册即表示您同意",
    termsOfService: "服务条款",
    privacyPolicy: "隐私政策",
    signingIn: "登录中...",
    signingUp: "注册中...",
    signInSuccess: "登录成功",
    signUpSuccess: "注册成功",
    signUpCheckEmail: "注册成功！请查收邮件完成验证。",
    signOutSuccess: "已退出登录",
    passwordMismatch: "两次输入的密码不一致",
    passwordTooShort: "密码至少 6 位",
    invalidEmail: "请输入有效的邮箱地址",
    account: "账户",
    myOrders: "我的订单",
    myProfile: "个人资料",
    backHome: "返回首页",
  },
};

const en: Dict = {
  nav: { searchPlaceholder: "Search Netflix, Spotify, Gaming Accounts...", signIn: "Sign In / Register", home: "Home", affiliate: "Affiliate", subscription: "Subscription" },
  search: { recentlySearched: "Recently searched", clearAll: "Clear all", noResults: "No products found" },
  userMenu: {
    personalInfo: "Personal Information",
    credits: "Credits",
    mySubscription: "My Subscription",
    support: "Support",
    helpCenter: "Help Center",
    orderHistory: "Order History",
    affiliateProgram: "Affiliate Program",
    referAndEarn: "Refer and Earn",
    changeLanguage: "Change Language/Currency",
    logout: "Log out",
    savedThrough: "Saved through GoAifast",
  },
  hero: {
    badge: "Trusted by 50,000+ users",
    title1: "Premium Digital Services",
    title2: "Great Prices • Instant Delivery",
    desc1: "Netflix, Spotify, gaming accounts and more — all in one place",
    desc2: "Secure Payments • Instant Delivery • 24/7 Support",
    browse: "Browse Products",
    learnMore: "Learn More",
    securePay: "Secure Payments",
    instantDelivery: "Instant Delivery",
    bestPrice: "Best Prices",
  },
  category: {
    title: "Browse Categories",
    subtitle: "Click a category to quickly find what you need",
    all: "All",
    streaming: "Streaming",
    music: "Music",
    gaming: "Gaming",
    movies: "Movies",
    software: "Software",
    audio: "Audio",
    svod: "SVOD",
    ai: "AI",
    marketplace: "Marketplace",
    topup: "Top up",
    games: "Games",
  },
  products: {
    sectionTitle: "Browse Categories",
    sectionSubtitle: "Click a category to see related products",
    empty: "No products in this category yet. Stay tuned!",
    inStock: "In Stock",
    features: "4K UHD • Private Slot • After-sales Guarantee",
    perMonth: "/mo",
    original: "Original",
    autoDeliver: "Auto delivery, instant response",
    stableAccount: "Renewable, stable account",
    buyNow: "Buy Now",
    save: "Save",
    badgeHot: "HOT",
    badgeRecommend: "PICK",
    badgeNew: "NEW",
    viewMore: "View more details",
  },
  checkout: {
    back: "Back to Home",
    cashier: "Secure Checkout",
    emailStep: "Delivery Email",
    emailPlaceholder: "yourname@example.com (used to receive account details)",
    emailNotice: "We respect your privacy and will never send spam.",
    paymentStep: "Select Payment Method",
    summary: "Order Summary",
    coupon: "Coupon Code",
    couponPlaceholder: "Enter discount code",
    apply: "Apply",
    subtotal: "Subtotal",
    fee: "Service Fee (0%)",
    total: "Total",
    processing: "Processing...",
    payNow: "Pay Securely",
    secureNotice: "SSL encrypted transmission for secure payment",
    invalidEmail: "Please enter a valid email to receive your account",
    demoAlert: "Demo mode: Payment flow triggered. In production this would redirect to Stripe/PayPal.",
    duration: "1 Month / Private Slot",
  },
  language: { label: "Language" },
  order: {
    title: "Order Paid Successfully",
    subtitle: "Your account details have been sent to your email inbox",
    orderId: "Order ID",
    placedAt: "Placed At",
    status: "Status",
    statusPaid: "Paid",
    statusProcessing: "Processing",
    statusDelivered: "Delivered",
    detailTitle: "Order Details",
    detailSubtitle: "Full information and payment breakdown for this order",
    product: "Product",
    quantity: "Qty",
    unitPrice: "Unit Price",
    subtotal: "Subtotal",
    discount: "Discount",
    fee: "Service Fee",
    total: "Total Paid",
    paidWith: "Payment Method",
    deliveryEmail: "Delivery Email",
    deliveryNote: "If you don't see the email within 10 minutes, check your spam folder or contact support.",
    backHome: "Back to Home",
    viewInvoice: "View Invoice",
    thanks: "Thank you for your purchase!",
  },
  auth: {
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    welcomeBack: "Welcome Back",
    createAccount: "Create Account",
    signInSubtitle: "Sign in to your account to continue",
    signUpSubtitle: "Create an account to get started",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "At least 6 characters",
    fullNamePlaceholder: "Your full name",
    forgotPassword: "Forgot password?",
    forgotPasswordTitle: "Reset Password",
    forgotPasswordSubtitle: "Enter your email and we'll send you a reset link",
    sendResetLink: "Send Reset Link",
    resetLinkSent: "Reset link sent — check your inbox",
    resetPasswordTitle: "Set a New Password",
    resetPasswordSubtitle: "Enter your new password below",
    newPassword: "New Password",
    updatePassword: "Update Password",
    passwordUpdated: "Password updated. Please sign in again.",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    orContinueWith: "Or continue with",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    continueWithMicrosoft: "Continue with Microsoft",
    microsoftUnavailable: "Microsoft sign-in is not available on this backend",
    agreeTerms: "By signing up, you agree to our",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    signingIn: "Signing in...",
    signingUp: "Creating account...",
    signInSuccess: "Signed in successfully",
    signUpSuccess: "Account created",
    signUpCheckEmail: "Account created! Please check your email to verify.",
    signOutSuccess: "Signed out",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    invalidEmail: "Please enter a valid email address",
    account: "Account",
    myOrders: "My Orders",
    myProfile: "My Profile",
    backHome: "Back to Home",
  },
};

const ja: Dict = {
  nav: { searchPlaceholder: "Netflix、Spotify、ゲームアカウントを検索...", signIn: "ログイン / 登録" },
  hero: {
    badge: "50,000人以上のユーザーに信頼されています",
    title1: "プレミアムデジタルサービス",
    title2: "お得な価格・即時配信",
    desc1: "Netflix、Spotify、ゲームアカウントなど人気サービスをまとめて",
    desc2: "安全な決済 • 即時配信 • 24時間365日サポート",
    browse: "商品を見る",
    learnMore: "詳細を見る",
    securePay: "安全な決済",
    instantDelivery: "即時配信",
    bestPrice: "最安価格",
  },
  category: {
    title: "カテゴリー一覧",
    subtitle: "カテゴリーをクリックしてお探しのサービスを素早く見つけましょう",
    all: "すべて",
    streaming: "動画配信",
    music: "音楽",
    gaming: "ゲーム",
    movies: "映画",
    software: "ソフトウェア",
    audio: "オーディオ",
  },
  products: {
    sectionTitle: "カテゴリー一覧",
    sectionSubtitle: "カテゴリーをクリックして関連商品を表示",
    empty: "このカテゴリーにはまだ商品がありません。お楽しみに！",
    inStock: "在庫あり",
    features: "4K UHD • 専用枠 • アフターサービス保証",
    perMonth: "/月",
    original: "定価",
    autoDeliver: "自動配信、即時対応",
    stableAccount: "更新可能、安定したアカウント",
    buyNow: "今すぐ購入",
    save: "割引",
    badgeHot: "人気",
    badgeRecommend: "おすすめ",
    badgeNew: "新着",
    viewMore: "詳細を見る",
  },
  checkout: {
    back: "ホームに戻る",
    cashier: "安全なチェックアウト",
    emailStep: "受信メールアドレス",
    emailPlaceholder: "yourname@example.com（アカウント情報の受信用）",
    emailNotice: "プライバシーを尊重し、スパムメールは送信しません。",
    paymentStep: "お支払い方法を選択",
    summary: "注文概要",
    coupon: "クーポンコード",
    couponPlaceholder: "割引コードを入力",
    apply: "適用",
    subtotal: "小計",
    fee: "手数料 (0%)",
    total: "合計",
    processing: "処理中...",
    payNow: "安全に支払う",
    secureNotice: "SSL暗号化通信で安全な決済",
    invalidEmail: "アカウント受信用の有効なメールアドレスを入力してください",
    demoAlert: "デモモード：決済フローが起動しました。本番環境ではStripe/PayPalへリダイレクトされます。",
    duration: "1ヶ月 / 専用枠",
  },
  language: { label: "言語" },
};

const ko: Dict = {
  nav: { searchPlaceholder: "Netflix, Spotify, 게임 계정 검색...", signIn: "로그인 / 회원가입" },
  hero: {
    badge: "50,000명 이상의 사용자가 신뢰",
    title1: "프리미엄 디지털 서비스",
    title2: "최고의 가격 • 즉시 배송",
    desc1: "Netflix, Spotify, 게임 계정 등 인기 서비스를 한 곳에서",
    desc2: "안전한 결제 • 즉시 배송 • 연중무휴 24시간 지원",
    browse: "상품 보기",
    learnMore: "더 알아보기",
    securePay: "안전한 결제",
    instantDelivery: "즉시 배송",
    bestPrice: "최저가",
  },
  category: {
    title: "카테고리 둘러보기",
    subtitle: "카테고리를 클릭하여 원하는 서비스를 빠르게 찾으세요",
    all: "전체",
    streaming: "스트리밍",
    music: "음악",
    gaming: "게임",
    movies: "영화",
    software: "소프트웨어",
    audio: "오디오",
  },
  products: {
    sectionTitle: "카테고리 둘러보기",
    sectionSubtitle: "카테고리를 클릭하여 관련 상품을 확인하세요",
    empty: "이 카테고리에는 아직 상품이 없습니다. 곧 만나요!",
    inStock: "재고 있음",
    features: "4K UHD • 전용 슬롯 • A/S 보장",
    perMonth: "/월",
    original: "정가",
    autoDeliver: "자동 배송, 즉시 응답",
    stableAccount: "갱신 가능, 안정적인 계정",
    buyNow: "지금 구매",
    save: "할인",
    badgeHot: "인기",
    badgeRecommend: "추천",
    badgeNew: "신상품",
    viewMore: "자세히 보기",
  },
  checkout: {
    back: "홈으로 돌아가기",
    cashier: "안전한 결제",
    emailStep: "수신 이메일",
    emailPlaceholder: "yourname@example.com (계정 정보 수신용)",
    emailNotice: "개인정보를 보호하며 스팸 메일을 보내지 않습니다.",
    paymentStep: "결제 방법 선택",
    summary: "주문 요약",
    coupon: "쿠폰 코드",
    couponPlaceholder: "할인 코드 입력",
    apply: "적용",
    subtotal: "소계",
    fee: "수수료 (0%)",
    total: "총계",
    processing: "처리 중...",
    payNow: "안전하게 결제",
    secureNotice: "SSL 암호화 전송으로 안전한 결제",
    invalidEmail: "계정 수신용 유효한 이메일을 입력해 주세요",
    demoAlert: "데모 모드: 결제 흐름이 시작되었습니다. 실제 환경에서는 Stripe/PayPal로 이동됩니다.",
    duration: "1개월 / 전용 슬롯",
  },
  language: { label: "언어" },
};

const es: Dict = {
  nav: { searchPlaceholder: "Buscar Netflix, Spotify, cuentas de juegos...", signIn: "Iniciar sesión / Registro" },
  hero: {
    badge: "Con la confianza de más de 50.000 usuarios",
    title1: "Servicios digitales premium",
    title2: "Precios geniales • Entrega instantánea",
    desc1: "Netflix, Spotify, cuentas de juegos y más — todo en un solo lugar",
    desc2: "Pagos seguros • Entrega inmediata • Soporte 24/7",
    browse: "Ver productos",
    learnMore: "Más información",
    securePay: "Pagos seguros",
    instantDelivery: "Entrega instantánea",
    bestPrice: "Mejores precios",
  },
  category: {
    title: "Explorar categorías",
    subtitle: "Haz clic en una categoría para encontrar lo que necesitas",
    all: "Todo",
    streaming: "Streaming",
    music: "Música",
    gaming: "Juegos",
    movies: "Películas",
    software: "Software",
    audio: "Audio",
  },
  products: {
    sectionTitle: "Explorar categorías",
    sectionSubtitle: "Haz clic en una categoría para ver los productos",
    empty: "Aún no hay productos en esta categoría. ¡Vuelve pronto!",
    inStock: "En stock",
    features: "4K UHD • Espacio privado • Garantía postventa",
    perMonth: "/mes",
    original: "Original",
    autoDeliver: "Entrega automática, respuesta instantánea",
    stableAccount: "Renovable, cuenta estable",
    buyNow: "Comprar ahora",
    save: "Ahorra",
    badgeHot: "TOP",
    badgeRecommend: "ELEGIDO",
    badgeNew: "NUEVO",
    viewMore: "Ver más detalles",
  },
  checkout: {
    back: "Volver al inicio",
    cashier: "Pago seguro",
    emailStep: "Correo de entrega",
    emailPlaceholder: "tunombre@ejemplo.com (para recibir los datos de la cuenta)",
    emailNotice: "Respetamos tu privacidad y nunca enviaremos spam.",
    paymentStep: "Seleccionar método de pago",
    summary: "Resumen del pedido",
    coupon: "Código de cupón",
    couponPlaceholder: "Introduce el código de descuento",
    apply: "Aplicar",
    subtotal: "Subtotal",
    fee: "Tarifa (0%)",
    total: "Total",
    processing: "Procesando...",
    payNow: "Pagar de forma segura",
    secureNotice: "Transmisión cifrada con SSL para pagos seguros",
    invalidEmail: "Introduce un correo válido para recibir tu cuenta",
    demoAlert: "Modo demo: Flujo de pago activado. En producción redirigiría a Stripe/PayPal.",
    duration: "1 mes / Espacio privado",
  },
  language: { label: "Idioma" },
};

const fr: Dict = {
  nav: { searchPlaceholder: "Rechercher Netflix, Spotify, comptes de jeux...", signIn: "Connexion / Inscription" },
  hero: {
    badge: "Approuvé par plus de 50 000 utilisateurs",
    title1: "Services numériques premium",
    title2: "Prix imbattables • Livraison instantanée",
    desc1: "Netflix, Spotify, comptes de jeux et bien plus — tout en un seul endroit",
    desc2: "Paiements sécurisés • Livraison immédiate • Support 24/7",
    browse: "Voir les produits",
    learnMore: "En savoir plus",
    securePay: "Paiements sécurisés",
    instantDelivery: "Livraison instantanée",
    bestPrice: "Meilleurs prix",
  },
  category: {
    title: "Parcourir les catégories",
    subtitle: "Cliquez sur une catégorie pour trouver rapidement ce dont vous avez besoin",
    all: "Tout",
    streaming: "Streaming",
    music: "Musique",
    gaming: "Jeux",
    movies: "Films",
    software: "Logiciels",
    audio: "Audio",
  },
  products: {
    sectionTitle: "Parcourir les catégories",
    sectionSubtitle: "Cliquez sur une catégorie pour voir les produits associés",
    empty: "Aucun produit dans cette catégorie pour le moment. À bientôt !",
    inStock: "En stock",
    features: "4K UHD • Place privée • Garantie après-vente",
    perMonth: "/mois",
    original: "Prix initial",
    autoDeliver: "Livraison automatique, réponse instantanée",
    stableAccount: "Renouvelable, compte stable",
    buyNow: "Acheter",
    save: "Économisez",
    badgeHot: "TOP",
    badgeRecommend: "CHOIX",
    badgeNew: "NOUVEAU",
    viewMore: "Voir plus de détails",
  },
  checkout: {
    back: "Retour à l'accueil",
    cashier: "Paiement sécurisé",
    emailStep: "E-mail de livraison",
    emailPlaceholder: "votrenom@exemple.com (pour recevoir les détails du compte)",
    emailNotice: "Nous respectons votre vie privée et n'envoyons jamais de spam.",
    paymentStep: "Choisir un mode de paiement",
    summary: "Résumé de la commande",
    coupon: "Code promo",
    couponPlaceholder: "Saisir le code de réduction",
    apply: "Appliquer",
    subtotal: "Sous-total",
    fee: "Frais (0%)",
    total: "Total",
    processing: "Traitement...",
    payNow: "Payer en toute sécurité",
    secureNotice: "Transmission chiffrée SSL pour un paiement sécurisé",
    invalidEmail: "Veuillez saisir un e-mail valide pour recevoir votre compte",
    demoAlert: "Mode démo : Flux de paiement déclenché. En production, redirection vers Stripe/PayPal.",
    duration: "1 mois / Place privée",
  },
  language: { label: "Langue" },
};

const de: Dict = {
  nav: { searchPlaceholder: "Netflix, Spotify, Gaming-Accounts suchen...", signIn: "Anmelden / Registrieren" },
  hero: {
    badge: "Von über 50.000 Nutzern vertraut",
    title1: "Premium-Digitaldienste",
    title2: "Top-Preise • Sofortlieferung",
    desc1: "Netflix, Spotify, Gaming-Accounts und mehr — alles an einem Ort",
    desc2: "Sichere Zahlungen • Sofortlieferung • 24/7 Support",
    browse: "Produkte ansehen",
    learnMore: "Mehr erfahren",
    securePay: "Sichere Zahlungen",
    instantDelivery: "Sofortlieferung",
    bestPrice: "Bestpreise",
  },
  category: {
    title: "Kategorien durchsuchen",
    subtitle: "Klicken Sie auf eine Kategorie, um schnell zu finden, was Sie brauchen",
    all: "Alle",
    streaming: "Streaming",
    music: "Musik",
    gaming: "Gaming",
    movies: "Filme",
    software: "Software",
    audio: "Audio",
  },
  products: {
    sectionTitle: "Kategorien durchsuchen",
    sectionSubtitle: "Klicken Sie auf eine Kategorie, um passende Produkte anzuzeigen",
    empty: "Noch keine Produkte in dieser Kategorie. Bleiben Sie dran!",
    inStock: "Auf Lager",
    features: "4K UHD • Privater Slot • Kundendienstgarantie",
    perMonth: "/Mon.",
    original: "UVP",
    autoDeliver: "Automatische Lieferung, sofortige Reaktion",
    stableAccount: "Verlängerbar, stabiles Konto",
    buyNow: "Jetzt kaufen",
    save: "Sparen",
    badgeHot: "TOP",
    badgeRecommend: "TIPP",
    badgeNew: "NEU",
    viewMore: "Weitere Details ansehen",
  },
  checkout: {
    back: "Zurück zur Startseite",
    cashier: "Sicherer Checkout",
    emailStep: "Zustell-E-Mail",
    emailPlaceholder: "ihrname@beispiel.com (zur Zustellung der Kontodaten)",
    emailNotice: "Wir respektieren Ihre Privatsphäre und senden niemals Spam.",
    paymentStep: "Zahlungsmethode wählen",
    summary: "Bestellübersicht",
    coupon: "Gutscheincode",
    couponPlaceholder: "Rabattcode eingeben",
    apply: "Anwenden",
    subtotal: "Zwischensumme",
    fee: "Gebühr (0%)",
    total: "Gesamt",
    processing: "Wird verarbeitet...",
    payNow: "Sicher bezahlen",
    secureNotice: "SSL-verschlüsselte Übertragung für sichere Zahlung",
    invalidEmail: "Bitte geben Sie eine gültige E-Mail zur Zustellung an",
    demoAlert: "Demo-Modus: Zahlungsablauf ausgelöst. In der Produktion Weiterleitung zu Stripe/PayPal.",
    duration: "1 Monat / Privater Slot",
  },
  language: { label: "Sprache" },
};

const pt: Dict = {
  nav: { searchPlaceholder: "Pesquisar Netflix, Spotify, contas de jogos...", signIn: "Entrar / Cadastrar" },
  hero: {
    badge: "Com a confiança de mais de 50.000 usuários",
    title1: "Serviços digitais premium",
    title2: "Ótimos preços • Entrega imediata",
    desc1: "Netflix, Spotify, contas de jogos e muito mais — tudo em um só lugar",
    desc2: "Pagamentos seguros • Entrega imediata • Suporte 24/7",
    browse: "Ver produtos",
    learnMore: "Saiba mais",
    securePay: "Pagamentos seguros",
    instantDelivery: "Entrega imediata",
    bestPrice: "Melhores preços",
  },
  category: {
    title: "Navegar por categorias",
    subtitle: "Clique em uma categoria para encontrar rapidamente o que precisa",
    all: "Tudo",
    streaming: "Streaming",
    music: "Música",
    gaming: "Jogos",
    movies: "Filmes",
    software: "Software",
    audio: "Áudio",
  },
  products: {
    sectionTitle: "Navegar por categorias",
    sectionSubtitle: "Clique em uma categoria para ver os produtos",
    empty: "Ainda não há produtos nesta categoria. Volte em breve!",
    inStock: "Em estoque",
    features: "4K UHD • Vaga privada • Garantia pós-venda",
    perMonth: "/mês",
    original: "Original",
    autoDeliver: "Entrega automática, resposta imediata",
    stableAccount: "Renovável, conta estável",
    buyNow: "Comprar agora",
    save: "Economize",
    badgeHot: "TOP",
    badgeRecommend: "ESCOLHA",
    badgeNew: "NOVO",
    viewMore: "Ver mais detalhes",
  },
  checkout: {
    back: "Voltar ao início",
    cashier: "Checkout seguro",
    emailStep: "E-mail de entrega",
    emailPlaceholder: "seunome@exemplo.com (para receber os dados da conta)",
    emailNotice: "Respeitamos sua privacidade e nunca enviaremos spam.",
    paymentStep: "Selecionar método de pagamento",
    summary: "Resumo do pedido",
    coupon: "Código de cupom",
    couponPlaceholder: "Insira o código de desconto",
    apply: "Aplicar",
    subtotal: "Subtotal",
    fee: "Taxa (0%)",
    total: "Total",
    processing: "Processando...",
    payNow: "Pagar com segurança",
    secureNotice: "Transmissão criptografada SSL para pagamento seguro",
    invalidEmail: "Insira um e-mail válido para receber sua conta",
    demoAlert: "Modo demo: Fluxo de pagamento acionado. Em produção, redirecionaria para Stripe/PayPal.",
    duration: "1 mês / Vaga privada",
  },
  language: { label: "Idioma" },
};

const ru: Dict = {
  nav: { searchPlaceholder: "Поиск Netflix, Spotify, игровых аккаунтов...", signIn: "Войти / Регистрация" },
  hero: {
    badge: "Нам доверяют более 50 000 пользователей",
    title1: "Премиум цифровые сервисы",
    title2: "Отличные цены • Мгновенная доставка",
    desc1: "Netflix, Spotify, игровые аккаунты и многое другое — всё в одном месте",
    desc2: "Безопасные платежи • Мгновенная доставка • Поддержка 24/7",
    browse: "Смотреть товары",
    learnMore: "Подробнее",
    securePay: "Безопасные платежи",
    instantDelivery: "Мгновенная доставка",
    bestPrice: "Лучшие цены",
  },
  category: {
    title: "Категории",
    subtitle: "Нажмите на категорию, чтобы быстро найти нужный сервис",
    all: "Все",
    streaming: "Стриминг",
    music: "Музыка",
    gaming: "Игры",
    movies: "Фильмы",
    software: "Софт",
    audio: "Аудио",
  },
  products: {
    sectionTitle: "Категории",
    sectionSubtitle: "Нажмите на категорию, чтобы увидеть товары",
    empty: "В этой категории пока нет товаров. Скоро появятся!",
    inStock: "В наличии",
    features: "4K UHD • Отдельное место • Гарантия",
    perMonth: "/мес",
    original: "Ориг.",
    autoDeliver: "Автодоставка, мгновенный отклик",
    stableAccount: "Продлеваемый стабильный аккаунт",
    buyNow: "Купить",
    save: "Экономия",
    badgeHot: "ХИТ",
    badgeRecommend: "ВЫБОР",
    badgeNew: "НОВОЕ",
    viewMore: "Подробнее",
  },
  checkout: {
    back: "На главную",
    cashier: "Безопасная оплата",
    emailStep: "Email для получения",
    emailPlaceholder: "yourname@example.com (для получения данных аккаунта)",
    emailNotice: "Мы уважаем вашу конфиденциальность и не отправляем спам.",
    paymentStep: "Выберите способ оплаты",
    summary: "Ваш заказ",
    coupon: "Промокод",
    couponPlaceholder: "Введите код скидки",
    apply: "Применить",
    subtotal: "Подытог",
    fee: "Комиссия (0%)",
    total: "Итого",
    processing: "Обработка...",
    payNow: "Оплатить безопасно",
    secureNotice: "SSL-шифрование для безопасной оплаты",
    invalidEmail: "Введите корректный email для получения аккаунта",
    demoAlert: "Демо-режим: Оплата инициирована. В боевом режиме — переход на Stripe/PayPal.",
    duration: "1 месяц / Отдельное место",
  },
  language: { label: "Язык" },
};

const ar: Dict = {
  nav: { searchPlaceholder: "ابحث عن Netflix وSpotify وحسابات الألعاب...", signIn: "تسجيل الدخول / إنشاء حساب" },
  hero: {
    badge: "يثق بنا أكثر من 50,000 مستخدم",
    title1: "خدمات رقمية مميزة",
    title2: "أسعار رائعة • تسليم فوري",
    desc1: "Netflix وSpotify وحسابات الألعاب والمزيد — كل ذلك في مكان واحد",
    desc2: "مدفوعات آمنة • تسليم فوري • دعم على مدار الساعة",
    browse: "تصفح المنتجات",
    learnMore: "اعرف المزيد",
    securePay: "مدفوعات آمنة",
    instantDelivery: "تسليم فوري",
    bestPrice: "أفضل الأسعار",
  },
  category: {
    title: "تصفح الفئات",
    subtitle: "انقر على فئة للعثور بسرعة على ما تحتاجه",
    all: "الكل",
    streaming: "البث",
    music: "الموسيقى",
    gaming: "الألعاب",
    movies: "الأفلام",
    software: "البرامج",
    audio: "الصوتيات",
  },
  products: {
    sectionTitle: "تصفح الفئات",
    sectionSubtitle: "انقر على فئة لعرض المنتجات المرتبطة",
    empty: "لا توجد منتجات في هذه الفئة بعد. ترقبوا!",
    inStock: "متوفر",
    features: "4K UHD • مقعد خاص • ضمان ما بعد البيع",
    perMonth: "/شهر",
    original: "السعر الأصلي",
    autoDeliver: "تسليم تلقائي واستجابة فورية",
    stableAccount: "قابل للتجديد، حساب مستقر",
    buyNow: "اشترِ الآن",
    save: "وفّر",
    badgeHot: "الأكثر مبيعًا",
    badgeRecommend: "موصى به",
    badgeNew: "جديد",
    viewMore: "عرض المزيد من التفاصيل",
  },
  checkout: {
    back: "العودة إلى الرئيسية",
    cashier: "دفع آمن",
    emailStep: "البريد الإلكتروني للاستلام",
    emailPlaceholder: "yourname@example.com (لاستلام تفاصيل الحساب)",
    emailNotice: "نحن نحترم خصوصيتك ولن نرسل أي رسائل مزعجة.",
    paymentStep: "اختر طريقة الدفع",
    summary: "ملخص الطلب",
    coupon: "رمز الخصم",
    couponPlaceholder: "أدخل رمز الخصم",
    apply: "تطبيق",
    subtotal: "المجموع الفرعي",
    fee: "الرسوم (0%)",
    total: "الإجمالي",
    processing: "جارٍ المعالجة...",
    payNow: "ادفع بأمان",
    secureNotice: "نقل مشفر بـ SSL لدفع آمن",
    invalidEmail: "يرجى إدخال بريد إلكتروني صالح لاستلام حسابك",
    demoAlert: "الوضع التجريبي: تم تشغيل تدفق الدفع. في الإنتاج، سيتم التحويل إلى Stripe/PayPal.",
    duration: "شهر واحد / مقعد خاص",
  },
  language: { label: "اللغة" },
};

const it: Dict = {
  nav: { searchPlaceholder: "Cerca Netflix, Spotify, account di gioco...", signIn: "Accedi / Registrati" },
  hero: {
    badge: "Scelto da oltre 50.000 utenti",
    title1: "Servizi digitali premium",
    title2: "Prezzi imbattibili • Consegna istantanea",
    desc1: "Netflix, Spotify, account di gioco e molto altro — tutto in un unico posto",
    desc2: "Pagamenti sicuri • Consegna immediata • Assistenza 24/7",
    browse: "Sfoglia i prodotti",
    learnMore: "Scopri di più",
    securePay: "Pagamenti sicuri",
    instantDelivery: "Consegna istantanea",
    bestPrice: "Prezzi migliori",
  },
  category: {
    title: "Sfoglia le categorie",
    subtitle: "Clicca una categoria per trovare rapidamente ciò che ti serve",
    all: "Tutto",
    streaming: "Streaming",
    music: "Musica",
    gaming: "Giochi",
    movies: "Film",
    software: "Software",
    audio: "Audio",
  },
  products: {
    sectionTitle: "Sfoglia le categorie",
    sectionSubtitle: "Clicca una categoria per vedere i prodotti correlati",
    empty: "Nessun prodotto in questa categoria. Torna presto!",
    inStock: "Disponibile",
    features: "4K UHD • Posto privato • Garanzia post-vendita",
    perMonth: "/mese",
    original: "Originale",
    autoDeliver: "Consegna automatica, risposta immediata",
    stableAccount: "Rinnovabile, account stabile",
    buyNow: "Acquista ora",
    save: "Risparmia",
    badgeHot: "TOP",
    badgeRecommend: "SCELTO",
    badgeNew: "NUOVO",
    viewMore: "Vedi più dettagli",
  },
  checkout: {
    back: "Torna alla home",
    cashier: "Checkout sicuro",
    emailStep: "Email di consegna",
    emailPlaceholder: "tuonome@esempio.com (per ricevere i dati dell'account)",
    emailNotice: "Rispettiamo la tua privacy e non invieremo mai spam.",
    paymentStep: "Seleziona metodo di pagamento",
    summary: "Riepilogo ordine",
    coupon: "Codice sconto",
    couponPlaceholder: "Inserisci il codice sconto",
    apply: "Applica",
    subtotal: "Subtotale",
    fee: "Commissione (0%)",
    total: "Totale",
    processing: "Elaborazione...",
    payNow: "Paga in sicurezza",
    secureNotice: "Trasmissione crittografata SSL per pagamento sicuro",
    invalidEmail: "Inserisci un'email valida per ricevere il tuo account",
    demoAlert: "Modalità demo: Flusso di pagamento avviato. In produzione reindirizza a Stripe/PayPal.",
    duration: "1 mese / Posto privato",
  },
  language: { label: "Lingua" },
};

// Extra translations for HowItWorks, Testimonials, and Footer sections.
// Kept separate to avoid enforcing the strict Dict type on every language.
const extras: Record<string, Record<string, any>> = {
  zh: {
    howItWorks: {
      title: "四步开启你的订阅之旅",
      subtitle: "从下单到使用，全程仅需一分钟",
      s1: { title: "选择服务", desc: "在数十种正版数字订阅中挑选适合你的服务与时长。" },
      s2: { title: "安全支付", desc: "支持信用卡、PayPal、加密货币等多种全球支付方式。" },
      s3: { title: "极速交付", desc: "系统自动发货，几秒内收到账号信息，无需人工等待。" },
      s4: { title: "售后保障", desc: "全周期 7×24 售后服务，问题秒级响应，出问题即补发。" },
    },
    testimonials: {
      title: "全球用户如何评价我们",
      subtitle: "已服务 50,000+ 用户，98% 好评率",
    },
    footer: {
      aboutTitle: "关于我们", legalTitle: "法律条款", langTitle: "语言与货币", serviceTitle: "客户服务",
      about1: "关于我们", about2: "联系我们", about3: "帮助中心", about4: "推广联盟", about5: "博客",
      about6: "品牌资源", about7: "订阅建议", about8: "推荐赚钱", about9: "出售给我们",
      legal1: "服务条款", legal2: "隐私政策", legal3: "版权声明", legal4: "退款政策", legal5: "反洗钱政策", legal6: "GDPR 数据保护声明",
      support: "在线客服", support247: "7×24 在线，12 小时内响应",
      rights: "所有版权、商标、服务标识均归相应所有者。",
      terms: "服务条款", privacy: "隐私政策", and: "和",
    },
  },
  en: {
    howItWorks: {
      title: "Start Your Subscription in 4 Steps",
      subtitle: "From order to use — takes only a minute",
      s1: { title: "Choose Service", desc: "Pick from dozens of authentic digital subscriptions and durations." },
      s2: { title: "Secure Payment", desc: "Credit card, PayPal, crypto and other global payment methods supported." },
      s3: { title: "Instant Delivery", desc: "Automated delivery — account info arrives in seconds." },
      s4: { title: "After-sales Care", desc: "24/7 support with instant response and free re-delivery when issues occur." },
    },
    testimonials: {
      title: "How Global Users Rate Us",
      subtitle: "50,000+ served users, 98% positive reviews",
    },
    footer: {
      aboutTitle: "ABOUT", legalTitle: "LEGAL", langTitle: "LANGUAGE & CURRENCY", serviceTitle: "CUSTOMER SERVICE",
      about1: "About Us", about2: "Contact Us", about3: "Help Center", about4: "Affiliate Program", about5: "Blog",
      about6: "Brand Assets", about7: "Suggest a Subscription", about8: "Refer and Earn", about9: "Sell to Us",
      legal1: "Terms & Conditions", legal2: "Privacy Policy", legal3: "Copyright", legal4: "Refund Policy", legal5: "AML Policy", legal6: "GDPR Data Protection Notice",
      support: "Support", support247: "24/7 Support, 12 hours response",
      rights: "All copyrights, trade marks, service marks belong to the corresponding owners.",
      terms: "Terms and Condition", privacy: "Privacy Policy", and: "and",
    },
  },
  ja: {
    howItWorks: {
      title: "4ステップで購読開始",
      subtitle: "注文から利用まで、わずか1分",
      s1: { title: "サービス選択", desc: "多数の正規デジタル購読からお好みのサービスと期間を選択。" },
      s2: { title: "安全な決済", desc: "クレジットカード、PayPal、暗号通貨など世界の決済手段に対応。" },
      s3: { title: "即時配信", desc: "システムが自動でアカウント情報を数秒以内にお届け。" },
      s4: { title: "アフターサポート", desc: "24時間365日サポート、即時対応、問題発生時は再送します。" },
    },
    testimonials: {
      title: "世界中のユーザーの評価",
      subtitle: "50,000人以上に利用され、98%が高評価",
    },
    footer: {
      aboutTitle: "会社情報", legalTitle: "法的情報", langTitle: "言語と通貨", serviceTitle: "カスタマーサービス",
      about1: "会社概要", about2: "お問い合わせ", about3: "ヘルプセンター", about4: "アフィリエイト", about5: "ブログ",
      about6: "ブランド素材", about7: "サブスク提案", about8: "紹介プログラム", about9: "販売する",
      legal1: "利用規約", legal2: "プライバシーポリシー", legal3: "著作権", legal4: "返金ポリシー", legal5: "AMLポリシー", legal6: "GDPRデータ保護通知",
      support: "サポート", support247: "24時間365日対応、12時間以内に返信",
      rights: "すべての著作権、商標、サービスマークは各所有者に帰属します。",
      terms: "利用規約", privacy: "プライバシーポリシー", and: "および",
    },
  },
  ko: {
    howItWorks: {
      title: "4단계로 시작하는 구독",
      subtitle: "주문에서 사용까지 단 1분",
      s1: { title: "서비스 선택", desc: "다양한 정품 디지털 구독 서비스와 기간 중에서 선택하세요." },
      s2: { title: "안전한 결제", desc: "신용카드, PayPal, 암호화폐 등 글로벌 결제수단 지원." },
      s3: { title: "즉시 배송", desc: "시스템이 몇 초 안에 계정 정보를 자동으로 전달합니다." },
      s4: { title: "사후 지원", desc: "연중무휴 24시간 지원, 문제 발생 시 즉시 재발송." },
    },
    testimonials: {
      title: "전 세계 사용자의 평가",
      subtitle: "50,000명 이상 이용, 98% 긍정 평가",
    },
    footer: {
      aboutTitle: "회사 소개", legalTitle: "법적 고지", langTitle: "언어 및 통화", serviceTitle: "고객 서비스",
      about1: "회사 소개", about2: "문의하기", about3: "고객 센터", about4: "제휴 프로그램", about5: "블로그",
      about6: "브랜드 자료", about7: "구독 제안", about8: "추천 및 리워드", about9: "우리에게 판매",
      legal1: "이용 약관", legal2: "개인정보 처리방침", legal3: "저작권", legal4: "환불 정책", legal5: "AML 정책", legal6: "GDPR 데이터 보호 고지",
      support: "고객 지원", support247: "24/7 지원, 12시간 이내 응답",
      rights: "모든 저작권, 상표, 서비스 마크는 해당 소유자에게 있습니다.",
      terms: "이용 약관", privacy: "개인정보 처리방침", and: "및",
    },
  },
  es: {
    howItWorks: {
      title: "Comienza tu suscripción en 4 pasos",
      subtitle: "Del pedido al uso — solo un minuto",
      s1: { title: "Elige el servicio", desc: "Elige entre decenas de suscripciones digitales oficiales y duraciones." },
      s2: { title: "Pago seguro", desc: "Compatible con tarjeta, PayPal, criptomonedas y otros métodos globales." },
      s3: { title: "Entrega instantánea", desc: "Entrega automatizada — recibe la cuenta en segundos." },
      s4: { title: "Soporte postventa", desc: "Soporte 24/7 con respuesta inmediata y reemplazo si hay problemas." },
    },
    testimonials: {
      title: "Lo que dicen usuarios de todo el mundo",
      subtitle: "Más de 50.000 usuarios atendidos, 98% de reseñas positivas",
    },
    footer: {
      aboutTitle: "SOBRE NOSOTROS", legalTitle: "LEGAL", langTitle: "IDIOMA Y MONEDA", serviceTitle: "SERVICIO AL CLIENTE",
      about1: "Sobre Nosotros", about2: "Contacto", about3: "Centro de Ayuda", about4: "Programa de Afiliados", about5: "Blog",
      about6: "Recursos de Marca", about7: "Sugerir Suscripción", about8: "Recomienda y Gana", about9: "Vendénos",
      legal1: "Términos y Condiciones", legal2: "Política de Privacidad", legal3: "Derechos de Autor", legal4: "Política de Reembolso", legal5: "Política AML", legal6: "Aviso de Protección de Datos GDPR",
      support: "Soporte", support247: "Soporte 24/7, respuesta en 12 horas",
      rights: "Todos los derechos, marcas y marcas de servicio pertenecen a sus respectivos propietarios.",
      terms: "Términos y Condiciones", privacy: "Política de Privacidad", and: "y",
    },
  },
  fr: {
    howItWorks: {
      title: "Commencez votre abonnement en 4 étapes",
      subtitle: "De la commande à l'utilisation en une minute",
      s1: { title: "Choisir le service", desc: "Choisissez parmi des dizaines d'abonnements numériques officiels." },
      s2: { title: "Paiement sécurisé", desc: "Cartes, PayPal, crypto et autres moyens de paiement mondiaux." },
      s3: { title: "Livraison instantanée", desc: "Livraison automatisée — recevez les infos du compte en secondes." },
      s4: { title: "Service après-vente", desc: "Support 24h/24, 7j/7, réponse instantanée et renvoi en cas de problème." },
    },
    testimonials: {
      title: "Ce que disent nos utilisateurs",
      subtitle: "Plus de 50 000 utilisateurs, 98% d'avis positifs",
    },
    footer: {
      aboutTitle: "À PROPOS", legalTitle: "LÉGAL", langTitle: "LANGUE ET DEVISE", serviceTitle: "SERVICE CLIENT",
      about1: "À propos", about2: "Contactez-nous", about3: "Centre d'aide", about4: "Programme d'affiliation", about5: "Blog",
      about6: "Ressources de marque", about7: "Suggérer un abonnement", about8: "Parrainer et gagner", about9: "Nous vendre",
      legal1: "Conditions générales", legal2: "Politique de confidentialité", legal3: "Droits d'auteur", legal4: "Politique de remboursement", legal5: "Politique AML", legal6: "Avis de protection des données RGPD",
      support: "Support", support247: "Support 24/7, réponse sous 12 heures",
      rights: "Tous les droits, marques et marques de service appartiennent à leurs propriétaires respectifs.",
      terms: "Conditions générales", privacy: "Politique de confidentialité", and: "et",
    },
  },
  de: {
    howItWorks: {
      title: "In 4 Schritten zum Abo",
      subtitle: "Von der Bestellung bis zur Nutzung in einer Minute",
      s1: { title: "Service wählen", desc: "Wählen Sie aus vielen offiziellen digitalen Abos und Laufzeiten." },
      s2: { title: "Sichere Zahlung", desc: "Kreditkarte, PayPal, Krypto und weitere globale Zahlungsmethoden." },
      s3: { title: "Sofortige Lieferung", desc: "Automatische Lieferung — Zugangsdaten in Sekunden." },
      s4: { title: "Kundendienst", desc: "24/7 Support, sofortige Antwort und kostenlose Neulieferung bei Problemen." },
    },
    testimonials: {
      title: "So bewerten uns Nutzer weltweit",
      subtitle: "50.000+ Nutzer, 98% positive Bewertungen",
    },
    footer: {
      aboutTitle: "ÜBER UNS", legalTitle: "RECHTLICHES", langTitle: "SPRACHE & WÄHRUNG", serviceTitle: "KUNDENSERVICE",
      about1: "Über uns", about2: "Kontakt", about3: "Hilfe-Center", about4: "Partnerprogramm", about5: "Blog",
      about6: "Markenmaterial", about7: "Abo vorschlagen", about8: "Empfehlen & Verdienen", about9: "An uns verkaufen",
      legal1: "AGB", legal2: "Datenschutzerklärung", legal3: "Urheberrecht", legal4: "Rückerstattungsrichtlinie", legal5: "AML-Richtlinie", legal6: "DSGVO-Datenschutzhinweis",
      support: "Support", support247: "24/7 Support, Antwort binnen 12 Stunden",
      rights: "Alle Urheber-, Marken- und Dienstleistungsrechte gehören den jeweiligen Inhabern.",
      terms: "AGB", privacy: "Datenschutzerklärung", and: "und",
    },
  },
  pt: {
    howItWorks: {
      title: "Comece sua assinatura em 4 passos",
      subtitle: "Do pedido ao uso em apenas um minuto",
      s1: { title: "Escolha o serviço", desc: "Escolha entre dezenas de assinaturas digitais oficiais e durações." },
      s2: { title: "Pagamento seguro", desc: "Cartão, PayPal, cripto e outros métodos de pagamento globais." },
      s3: { title: "Entrega imediata", desc: "Entrega automática — receba os dados da conta em segundos." },
      s4: { title: "Pós-venda", desc: "Suporte 24/7, resposta imediata e reenvio grátis em caso de problema." },
    },
    testimonials: {
      title: "O que dizem os usuários no mundo todo",
      subtitle: "Mais de 50.000 usuários atendidos, 98% de avaliações positivas",
    },
    footer: {
      aboutTitle: "SOBRE", legalTitle: "LEGAL", langTitle: "IDIOMA E MOEDA", serviceTitle: "ATENDIMENTO",
      about1: "Sobre Nós", about2: "Contato", about3: "Central de Ajuda", about4: "Programa de Afiliados", about5: "Blog",
      about6: "Recursos da Marca", about7: "Sugerir Assinatura", about8: "Indique e Ganhe", about9: "Venda para Nós",
      legal1: "Termos e Condições", legal2: "Política de Privacidade", legal3: "Direitos Autorais", legal4: "Política de Reembolso", legal5: "Política AML", legal6: "Aviso de Proteção de Dados GDPR",
      support: "Suporte", support247: "Suporte 24/7, resposta em 12 horas",
      rights: "Todos os direitos, marcas e marcas de serviço pertencem aos respectivos proprietários.",
      terms: "Termos e Condições", privacy: "Política de Privacidade", and: "e",
    },
  },
  ru: {
    howItWorks: {
      title: "Начните подписку за 4 шага",
      subtitle: "От заказа до использования — всего одна минута",
      s1: { title: "Выберите сервис", desc: "Выберите среди десятков официальных цифровых подписок." },
      s2: { title: "Безопасная оплата", desc: "Карты, PayPal, крипто и другие мировые способы оплаты." },
      s3: { title: "Мгновенная доставка", desc: "Автоматическая доставка — данные аккаунта за секунды." },
      s4: { title: "Поддержка", desc: "Поддержка 24/7, мгновенный ответ и бесплатная замена при проблемах." },
    },
    testimonials: {
      title: "Отзывы пользователей со всего мира",
      subtitle: "Более 50 000 пользователей, 98% положительных отзывов",
    },
    footer: {
      aboutTitle: "О НАС", legalTitle: "ЮРИДИЧЕСКАЯ ИНФ.", langTitle: "ЯЗЫК И ВАЛЮТА", serviceTitle: "СЛУЖБА ПОДДЕРЖКИ",
      about1: "О нас", about2: "Связаться", about3: "Центр помощи", about4: "Партнёрская программа", about5: "Блог",
      about6: "Бренд-материалы", about7: "Предложить подписку", about8: "Приведи и заработай", about9: "Продать нам",
      legal1: "Условия использования", legal2: "Политика конфиденциальности", legal3: "Авторские права", legal4: "Политика возврата", legal5: "AML-политика", legal6: "Уведомление GDPR",
      support: "Поддержка", support247: "Поддержка 24/7, ответ в течение 12 часов",
      rights: "Все авторские права, торговые марки и знаки обслуживания принадлежат соответствующим владельцам.",
      terms: "Условия использования", privacy: "Политика конфиденциальности", and: "и",
    },
  },
  ar: {
    howItWorks: {
      title: "ابدأ اشتراكك في 4 خطوات",
      subtitle: "من الطلب إلى الاستخدام في دقيقة واحدة",
      s1: { title: "اختر الخدمة", desc: "اختر من بين عشرات الاشتراكات الرقمية الأصلية والمدد المختلفة." },
      s2: { title: "دفع آمن", desc: "يدعم البطاقات وPayPal والعملات المشفرة وغيرها من طرق الدفع العالمية." },
      s3: { title: "تسليم فوري", desc: "تسليم تلقائي — تصلك بيانات الحساب خلال ثوانٍ." },
      s4: { title: "دعم ما بعد البيع", desc: "دعم 24/7 مع استجابة فورية وإعادة الإرسال مجانًا عند وجود مشكلة." },
    },
    testimonials: {
      title: "ماذا يقول المستخدمون حول العالم",
      subtitle: "أكثر من 50,000 مستخدم و98% تقييمات إيجابية",
    },
    footer: {
      aboutTitle: "معلومات عنا", legalTitle: "قانوني", langTitle: "اللغة والعملة", serviceTitle: "خدمة العملاء",
      about1: "من نحن", about2: "تواصل معنا", about3: "مركز المساعدة", about4: "برنامج الشراكة", about5: "المدونة",
      about6: "أصول العلامة", about7: "اقترح اشتراكًا", about8: "أوصِ واربح", about9: "بِع لنا",
      legal1: "الشروط والأحكام", legal2: "سياسة الخصوصية", legal3: "حقوق النشر", legal4: "سياسة الاسترداد", legal5: "سياسة مكافحة غسيل الأموال", legal6: "إشعار حماية البيانات GDPR",
      support: "الدعم", support247: "دعم 24/7، استجابة خلال 12 ساعة",
      rights: "جميع حقوق النشر والعلامات التجارية وعلامات الخدمة تعود لأصحابها.",
      terms: "الشروط والأحكام", privacy: "سياسة الخصوصية", and: "و",
    },
  },
  it: {
    howItWorks: {
      title: "Inizia il tuo abbonamento in 4 passaggi",
      subtitle: "Dall'ordine all'utilizzo in un minuto",
      s1: { title: "Scegli il servizio", desc: "Scegli tra decine di abbonamenti digitali ufficiali e durate." },
      s2: { title: "Pagamento sicuro", desc: "Carte, PayPal, crypto e altri metodi di pagamento globali." },
      s3: { title: "Consegna immediata", desc: "Consegna automatica — ricevi i dati dell'account in pochi secondi." },
      s4: { title: "Assistenza post-vendita", desc: "Supporto 24/7 con risposta immediata e rinvio gratuito in caso di problemi." },
    },
    testimonials: {
      title: "Cosa dicono gli utenti nel mondo",
      subtitle: "Oltre 50.000 utenti serviti, 98% di recensioni positive",
    },
    footer: {
      aboutTitle: "CHI SIAMO", legalTitle: "LEGALE", langTitle: "LINGUA E VALUTA", serviceTitle: "ASSISTENZA CLIENTI",
      about1: "Chi siamo", about2: "Contattaci", about3: "Centro assistenza", about4: "Programma affiliati", about5: "Blog",
      about6: "Risorse del brand", about7: "Suggerisci un abbonamento", about8: "Invita e guadagna", about9: "Vendi a noi",
      legal1: "Termini e Condizioni", legal2: "Informativa sulla privacy", legal3: "Copyright", legal4: "Politica di rimborso", legal5: "Politica AML", legal6: "Informativa GDPR",
      support: "Supporto", support247: "Supporto 24/7, risposta entro 12 ore",
      rights: "Tutti i diritti, marchi e marchi di servizio appartengono ai rispettivi proprietari.",
      terms: "Termini e Condizioni", privacy: "Informativa sulla privacy", and: "e",
    },
  },
};

const resources = {
  zh: { translation: { ...zh, ...extras.zh } },
  en: { translation: { ...en, ...extras.en } },
  ja: { translation: { ...ja, ...extras.ja } },
  ko: { translation: { ...ko, ...extras.ko } },
  es: { translation: { ...es, ...extras.es } },
  fr: { translation: { ...fr, ...extras.fr } },
  de: { translation: { ...de, ...extras.de } },
  pt: { translation: { ...pt, ...extras.pt } },
  ru: { translation: { ...ru, ...extras.ru } },
  ar: { translation: { ...ar, ...extras.ar } },
  it: { translation: { ...it, ...extras.it } },
};

const defaultLocaleVersion = "zh-default-20260903";
if (typeof localStorage !== "undefined" && localStorage.getItem("locale_default_version") !== defaultLocaleVersion) {
  localStorage.setItem("app_lang", "zh");
  localStorage.setItem("locale_default_version", defaultLocaleVersion);
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("app_lang") || "zh",
    fallbackLng: "zh",
    supportedLngs: ["zh", "en", "ja", "ko", "es", "fr", "de", "pt", "ru", "ar", "it"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: "app_lang",
    },
  });

// Apply document direction for RTL languages
const applyDir = (lng: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lng;
  }
};
applyDir(i18n.resolvedLanguage || i18n.language || "en");
i18n.on("languageChanged", applyDir);

export default i18n;
