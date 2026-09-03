import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Facebook, Send, Youtube, Twitter, Music2, Globe, ChevronDown } from "lucide-react";
import PreferencesDialog from "./PreferencesDialog";

export default function Footer() {
  const { t, i18n } = useTranslation();
  const year = new Date().getFullYear();
  const [prefsOpen, setPrefsOpen] = useState(false);
  const langLabels: Record<string, string> = {
    zh: "中文", en: "English", ja: "日本語", ko: "한국어", es: "Español",
    fr: "Français", de: "Deutsch", pt: "Português", ru: "Русский", ar: "العربية", it: "Italiano",
  };
  const currentLangLabel = langLabels[i18n.resolvedLanguage || i18n.language] || "English";

  const socials = [
    { icon: Facebook, href: "https://www.facebook.com", label: "Facebook", target: "_blank" },
    { icon: Send, href: "https://t.me", label: "Telegram", target: "_blank" },
    { icon: Music2, href: "https://www.tiktok.com", label: "TikTok", target: "_blank" },
    { icon: Youtube, href: "https://www.youtube.com", label: "YouTube", target: "_blank" },
    { icon: Twitter, href: "https://x.com", label: "X", target: "_blank" },
  ];

  const about = [
    { label: t("footer.about1", "About Us"), to: "/page/about-us" },
    { label: t("footer.about2", "Contact Us"), to: "/page/contact-us" },
    { label: t("footer.about3", "Help Center"), to: "/page/help-center" },
    { label: t("footer.about4", "Affliate Program"), to: "/page/affiliate" },
    { label: t("footer.about5", "Blog"), to: "/page/blog" },
    { label: t("footer.about6", "Brand assets"), to: "/page/brand-assets" },
    { label: t("footer.about7", "Suggest a Subscription"), to: "/page/suggest-subscription" },
    { label: t("footer.about8", "Refer and Earn"), to: "/page/refer-earn" },
    { label: t("footer.about9", "Sell to us"), to: "/page/sell-to-us" },
  ];

  const legal = [
    { label: t("footer.legal1", "GoAifast T&C"), to: "/page/terms" },
    { label: t("footer.legal2", "Privacy Policy"), to: "/page/privacy" },
    { label: t("footer.legal3", "Copyright"), to: "/page/copyright" },
    { label: t("footer.legal4", "Refund Policy"), to: "/page/refund" },
    { label: t("footer.legal5", "AML Policy"), to: "/page/aml" },
    { label: t("footer.legal6", "GDPR Data Protection Notice"), to: "/page/gdpr" },
  ];

  // GamsGo-style payment logos rendered as branded pill badges
  const pays: { name: string; className: string; style?: string }[] = [
    { name: "VISA", className: "text-[#1a1f71] italic", style: "font-black tracking-wider" },
    { name: "mastercard", className: "text-[#eb001b]", style: "font-bold lowercase" },
    { name: "AMEX", className: "text-[#2e77bb]", style: "font-black tracking-wide" },
    { name: "DISCOVER", className: "text-[#ff6000]", style: "font-black tracking-wide" },
    { name: "iDEAL", className: "text-[#cd0067]", style: "font-black italic" },
    { name: "Bancontact", className: "text-[#005498]", style: "font-bold" },
    { name: "Pay", className: "text-black", style: "font-bold" },
    { name: "G Pay", className: "text-slate-800", style: "font-bold" },
  ];

  return (
    <footer className="relative bg-[#0f172a] text-gray-300">
      {/* Wave top going into dark navy */}
      <div className="absolute -top-px left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 80" className="w-full h-16 md:h-20" preserveAspectRatio="none" aria-hidden>
          <path d="M0,40 C240,80 480,0 720,32 C960,64 1200,16 1440,48 L1440,80 L0,80 Z" fill="#0f172a" />
        </svg>
      </div>

      {/* Socials */}
      <div className="pt-20 md:pt-24 pb-12 flex justify-center gap-5">
        {socials.map((s) => {
          const Icon = s.icon;
          return (
            <a
              key={s.label}
              href={s.href}
              target={s.target}
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md hover:scale-110 hover:shadow-lg transition-transform"
            >
              <Icon className="w-6 h-6" />
            </a>
          );
        })}
      </div>

      <div className="container mx-auto px-6 max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 pb-14">
        {/* ABOUT */}
        <div>
          <h4 className="text-white text-base font-extrabold tracking-[0.02em] mb-6">
            {t("footer.aboutTitle", "ABOUT")}
          </h4>
          <ul className="space-y-4 text-[15px]">
            {about.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-gray-300/90 hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h4 className="text-white text-base font-extrabold tracking-[0.02em] mb-6">
            {t("footer.legalTitle", "LEGAL")}
          </h4>
          <ul className="space-y-4 text-[15px]">
            {legal.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  className="text-gray-300/90 hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* LANGUAGE & CURRENCY */}
        <div>
          <h4 className="text-white text-base font-extrabold tracking-[0.02em] mb-6">
            {t("footer.langTitle", "LANGUAGE & CURRENCY")}
          </h4>
          <button
            onClick={() => setPrefsOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{currentLangLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>

        {/* CUSTOMER SERVICE */}
        <div>
          <h4 className="text-white text-base font-extrabold tracking-[0.02em] mb-6">
            {t("footer.serviceTitle", "CUSTOMER SERVICE")}
          </h4>
          <div className="text-white text-[15px] font-semibold mb-1">
            {t("footer.support", "Support")}
          </div>
          <div className="text-sm text-gray-400 mb-5">
            {t("footer.support247", "24/7 Support, 12 hours response")}
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-[220px]">
            <div className="col-span-1 h-10 rounded-md bg-white flex items-center justify-center text-[9px] font-black text-emerald-600 leading-tight text-center px-1">
              Google<br />Safe Browsing
            </div>
            <div className="col-span-1 h-10 rounded-md bg-white flex items-center justify-center text-[9px] font-black text-emerald-700 leading-tight text-center px-1">
              TrustedSite<br />CERTIFIED
            </div>
            <div className="col-span-1 h-10 rounded-md bg-white flex items-center justify-center text-[9px] font-black text-red-600 leading-tight text-center px-1">
              SiteLock<br />SECURE
            </div>
            <div className="col-span-1 h-10 rounded-md bg-white flex items-center justify-center text-[9px] font-black text-green-600 leading-tight text-center px-1">
              GOOGLE SSL<br />SECURED
            </div>
            <div className="col-span-1 h-10 rounded-md bg-white flex items-center justify-center text-[9px] font-black text-slate-700 leading-tight text-center px-1">
              PCI DSS<br />COMPLIANT
            </div>
            <div className="col-span-1 h-10 rounded-md bg-white flex items-center justify-center text-[9px] font-black text-red-600 leading-tight text-center px-1">
              SCAM<br />ADVISER
            </div>
          </div>
        </div>
      </div>

      {/* Payments bar */}
      <div className="border-t border-white/10 bg-[#0b1220]">
        <div className="container mx-auto px-6 max-w-6xl py-6 flex flex-wrap items-center justify-center gap-3">
          {pays.map((p) => (
            <span
              key={p.name}
              className={`min-w-[68px] h-9 px-3 rounded-md bg-white shadow-sm flex items-center justify-center text-sm ${p.className} ${p.style ?? ""}`}
              dir="ltr"
            >
              {p.name}
            </span>
          ))}
          <span className="text-sm text-gray-400 font-medium ms-2">+50 more</span>
        </div>

        <div className="text-center text-xs md:text-sm text-gray-400 pb-8 pt-2 space-y-1 px-4">
          <p>
            {t("footer.rights", "All copyrights, trade marks, service marks belong to the corresponding owners.")}
          </p>
          <p>
            Copyright © {year} GoAifast.com All Rights.
          </p>
          <p>
            <Link to="#" className="uppercase hover:text-white mx-1">
              {t("footer.terms", "Terms and Condition")}
            </Link>
            <span className="mx-1">{t("footer.and", "and")}</span>
            <Link to="#" className="uppercase hover:text-white mx-1">
              {t("footer.privacy", "Privacy Policy")}
            </Link>
          </p>
        </div>
      </div>
      <PreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
    </footer>
  );
}
