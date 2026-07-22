import type { Product } from "@/data/products";
import { PUBLIC_STORE_KEY, type IpPricingRule } from "@/lib/adminStore";

export type VisitorIpInfo = {
  ip: string;
  countryCode?: string;
  countryName?: string;
  continentCode?: string;
  currency?: string;
};

export type PricedProduct = Product & {
  basePrice?: number;
  baseOriginalPrice?: number;
  ipPricingRuleName?: string;
  ipPricingNote?: string;
  ipPricingDisclosure?: string;
  ipPricingRiskLevel?: IpPricingRule["riskLevel"];
};

const IP_INFO_KEY = "goaifast_visitor_ip_info_v1";
const IP_INFO_TTL = 10 * 60 * 1000;

const regionCountries: Record<string, string[]> = {
  NA: ["US", "CA", "MX"],
  EU: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"],
  SEA: ["BN", "KH", "ID", "LA", "MY", "MM", "PH", "SG", "TH", "TL", "VN"],
  LATAM: ["AR", "BO", "BR", "CL", "CO", "CR", "DO", "EC", "GT", "HN", "MX", "PA", "PE", "PY", "SV", "UY", "VE"],
  MENA: ["AE", "BH", "DZ", "EG", "IL", "IQ", "JO", "KW", "LB", "MA", "OM", "QA", "SA", "TN", "TR"],
};

function productIdFromTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ipToNumber(ip: string) {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;
  return parts.reduce((sum, part) => (sum << 8) + part, 0) >>> 0;
}

function matchesCidr(ip: string, cidr: string) {
  const [rangeIp, prefixRaw] = cidr.split("/");
  const ipNumber = ipToNumber(ip);
  const rangeNumber = ipToNumber(rangeIp);
  const prefix = Number(prefixRaw);
  if (ipNumber === null || rangeNumber === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipNumber & mask) === (rangeNumber & mask);
}

function isRuleInWindow(rule: IpPricingRule) {
  const now = Date.now();
  const startsAt = rule.startsAt ? Date.parse(rule.startsAt) : NaN;
  const endsAt = rule.endsAt ? Date.parse(rule.endsAt) : NaN;
  if (Number.isFinite(startsAt) && now < startsAt) return false;
  if (Number.isFinite(endsAt) && now > endsAt) return false;
  return true;
}

function ruleMatches(rule: IpPricingRule, product: Product, visitor: VisitorIpInfo) {
  if (!isRuleInWindow(rule)) return false;
  if (rule.productId !== "all" && rule.productId !== productIdFromTitle(product.titleKey)) return false;
  const target = rule.targetValue.trim();
  if (rule.targetType === "all") return true;
  if (!target) return false;
  if (rule.targetType === "ip") return visitor.ip === target;
  if (rule.targetType === "cidr") return matchesCidr(visitor.ip, target);
  if (rule.targetType === "country") return visitor.countryCode?.toUpperCase() === target.toUpperCase();
  if (rule.targetType === "region") {
    const region = target.toUpperCase();
    if (visitor.continentCode?.toUpperCase() === region) return true;
    return Boolean(visitor.countryCode && regionCountries[region]?.includes(visitor.countryCode.toUpperCase()));
  }
  return false;
}

function roundPrice(price: number, rounding: IpPricingRule["rounding"]) {
  if (rounding === "whole") return Math.max(0, Math.round(price));
  if (rounding === "ending-90") return Math.max(0, Math.round((Math.floor(price) + 0.9) * 100) / 100);
  if (rounding === "ending-99") return Math.max(0, Math.round((Math.floor(price) + 0.99) * 100) / 100);
  return Math.max(0, Math.round(price * 100) / 100);
}

function clampPrice(price: number, rule: IpPricingRule) {
  let next = price;
  if (rule.minPrice !== undefined && Number.isFinite(rule.minPrice)) next = Math.max(next, rule.minPrice);
  if (rule.maxPrice !== undefined && Number.isFinite(rule.maxPrice)) next = Math.min(next, rule.maxPrice);
  return next;
}

export function loadPublicIpPricingRules(): IpPricingRule[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(PUBLIC_STORE_KEY) || "{}");
    return Array.isArray(parsed.ipPricingRules) ? parsed.ipPricingRules : [];
  } catch {
    return [];
  }
}

export async function getVisitorIpInfo(): Promise<VisitorIpInfo | null> {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(localStorage.getItem(IP_INFO_KEY) || "null");
    if (cached?.value?.ip && Date.now() - cached.createdAt < IP_INFO_TTL) return cached.value;
  } catch {
    // Ignore corrupted cache and request fresh data.
  }

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) throw new Error("ipapi failed");
    const data = await response.json();
    const value: VisitorIpInfo = {
      ip: String(data.ip || ""),
      countryCode: data.country_code ? String(data.country_code).toUpperCase() : undefined,
      countryName: data.country_name ? String(data.country_name) : undefined,
      continentCode: data.continent_code ? String(data.continent_code).toUpperCase() : undefined,
      currency: data.currency ? String(data.currency).toUpperCase() : undefined,
    };
    if (value.ip) {
      localStorage.setItem(IP_INFO_KEY, JSON.stringify({ createdAt: Date.now(), value }));
      return value;
    }
  } catch {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      if (!response.ok) throw new Error("ipify failed");
      const data = await response.json();
      const value: VisitorIpInfo = { ip: String(data.ip || "") };
      if (value.ip) {
        localStorage.setItem(IP_INFO_KEY, JSON.stringify({ createdAt: Date.now(), value }));
        return value;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function applyIpPricing(products: Product[], visitor: VisitorIpInfo | null, rules = loadPublicIpPricingRules()): PricedProduct[] {
  if (!visitor?.ip || rules.length === 0) return products;
  const activeRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return products.map((product) => {
    const rule = activeRules.find((candidate) => ruleMatches(candidate, product, visitor));
    if (!rule) return product;
    const calculatedPrice = rule.priceMode === "percent"
      ? Math.max(0, Math.round(product.price * (1 + rule.priceValue / 100) * 100) / 100)
      : rule.priceValue;
    const nextPrice = roundPrice(clampPrice(calculatedPrice, rule), rule.rounding || "none");
    const market = [visitor.ip, visitor.countryCode, visitor.currency].filter(Boolean).join(" · ");
    return {
      ...product,
      basePrice: product.price,
      baseOriginalPrice: product.originalPrice,
      price: nextPrice,
      originalPrice: rule.originalPrice && rule.originalPrice > nextPrice ? rule.originalPrice : Math.max(product.originalPrice, nextPrice),
      ipPricingRuleName: rule.name,
      ipPricingNote: market || visitor.ip,
      ipPricingDisclosure: rule.disclosure,
      ipPricingRiskLevel: rule.riskLevel,
    };
  });
}
