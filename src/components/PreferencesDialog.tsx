import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, HelpCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const LANGUAGES: { code: string; label: string }[] = [
  { code: "zh", label: "中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "it", label: "Italiano" },
];

const COUNTRIES = [
  "United States", "China", "Japan", "South Korea", "Germany", "France",
  "Spain", "Italy", "Portugal", "Brazil", "Russia", "United Kingdom",
  "Canada", "Australia", "Mexico", "India", "Saudi Arabia", "Singapore",
];

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "KRW", symbol: "₩" },
  { code: "CNY", symbol: "¥" },
  { code: "RUB", symbol: "₽" },
  { code: "BRL", symbol: "R$" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
  { code: "INR", symbol: "₹" },
];

export default function PreferencesDialog({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();

  const [country, setCountry] = useState<string>(() => localStorage.getItem("pref_country") || "United States");
  const [lang, setLang] = useState<string>(() => localStorage.getItem("app_lang") || i18n.resolvedLanguage || "en");
  const [currency, setCurrency] = useState<string>(() => localStorage.getItem("pref_currency") || "USD");

  useEffect(() => {
    if (open) {
      setCountry(localStorage.getItem("pref_country") || "United States");
      setLang(localStorage.getItem("app_lang") || i18n.resolvedLanguage || "en");
      setCurrency(localStorage.getItem("pref_currency") || "USD");
    }
  }, [open, i18n.resolvedLanguage]);

  const handleConfirm = () => {
    localStorage.setItem("pref_country", country);
    localStorage.setItem("pref_currency", currency);
    if (lang !== i18n.resolvedLanguage) {
      i18n.changeLanguage(lang);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 gap-0 bg-white dark:bg-gray-900">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {t("prefs.title", "Set your preferences")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-5">
          {/* Country */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-900 dark:text-white">
              {t("prefs.country", "Country")}
            </Label>
            <div className="relative">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500">
                  <SelectValue placeholder={t("prefs.country", "Country")} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RefreshCw className="w-4 h-4 text-gray-400 absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-900 dark:text-white">
              {t("prefs.language", "Language")}
            </Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              {t("prefs.currency", "Display Currency")}
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-full font-semibold border-gray-200 dark:border-gray-700"
            onClick={() => onOpenChange(false)}
          >
            {t("prefs.cancel", "Cancel")}
          </Button>
          <Button
            className="flex-1 h-12 rounded-full font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            onClick={handleConfirm}
          >
            {t("prefs.confirm", "Confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
