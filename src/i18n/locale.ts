// Locale-aware formatting utilities.
// Prices in the app are authored in USD; we convert to each locale's currency
// using static demo rates and format via Intl APIs so numerals, grouping,
// currency symbol placement, and RTL bidi all follow local conventions.

import { useTranslation } from "react-i18next";

export type SupportedLng =
  | "zh" | "en" | "ja" | "ko" | "es" | "fr" | "de" | "pt" | "ru" | "ar" | "it";

// BCP-47 locale tag per language (Intl uses these for numerals/date order).
export const localeMap: Record<SupportedLng, string> = {
  zh: "zh-CN",
  en: "en-US",
  ja: "ja-JP",
  ko: "ko-KR",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-PT",
  ru: "ru-RU",
  ar: "ar-SA",
  it: "it-IT",
};

// Display currency per locale.
export const currencyMap: Record<SupportedLng, string> = {
  zh: "CNY",
  en: "USD",
  ja: "JPY",
  ko: "KRW",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
  pt: "EUR",
  ru: "RUB",
  ar: "SAR",
  it: "EUR",
};

// Static demo exchange rates: 1 USD = X target currency.
// In production, fetch these from an FX API.
export const usdRates: Record<string, number> = {
  USD: 1,
  CNY: 7.2,
  JPY: 155,
  KRW: 1350,
  EUR: 0.92,
  RUB: 92,
  SAR: 3.75,
};

const normalize = (lng?: string): SupportedLng => {
  const key = (lng || "en").split("-")[0] as SupportedLng;
  return (localeMap[key] ? key : "en");
};

export function convertFromUSD(usd: number, lng?: string): { amount: number; currency: string } {
  const l = normalize(lng);
  const currency = currencyMap[l];
  const rate = usdRates[currency] ?? 1;
  return { amount: usd * rate, currency };
}

export function formatPrice(usd: number, lng?: string): string {
  const l = normalize(lng);
  const { amount, currency } = convertFromUSD(usd, l);
  // JPY / KRW have no fractional units.
  const noFraction = currency === "JPY" || currency === "KRW";
  return new Intl.NumberFormat(localeMap[l], {
    style: "currency",
    currency,
    maximumFractionDigits: noFraction ? 0 : 2,
    minimumFractionDigits: noFraction ? 0 : 2,
  }).format(amount);
}

export function formatDate(date: Date | number | string, lng?: string): string {
  const l = normalize(lng);
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(localeMap[l], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | number | string, lng?: string): string {
  const l = normalize(lng);
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(localeMap[l], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function useLocale() {
  const { i18n } = useTranslation();
  const lng = normalize(i18n.resolvedLanguage || i18n.language);
  return {
    lng,
    locale: localeMap[lng],
    currency: currencyMap[lng],
    isRTL: lng === "ar",
    formatPrice: (usd: number) => formatPrice(usd, lng),
    formatDate: (d: Date | number | string) => formatDate(d, lng),
    formatDateTime: (d: Date | number | string) => formatDateTime(d, lng),
  };
}
