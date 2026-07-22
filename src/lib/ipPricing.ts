import type { Product } from "@/data/products";
import { PUBLIC_STORE_KEY, type IpPricingRule } from "@/lib/adminStore";

export type VisitorIpInfo = {
  ip: string;
  countryCode?: string;
  countryName?: string;
};

export type PricedProduct = Product & {
  basePrice?: number;
  baseOriginalPrice?: number;
  ipPricingRuleName?: string;
  ipPricingNote?: string;
};

const IP_INFO_KEY = "goaifast_visitor_ip_info_v1";
const IP_INFO_TTL = 10 * 60 * 1000;

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

function ruleMatches(rule: IpPricingRule, product: Product, visitor: VisitorIpInfo) {
  if (rule.productId !== "all" && rule.productId !== product.titleKey.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) return false;
  const target = rule.targetValue.trim();
  if (rule.targetType === "all") return true;
  if (!target) return false;
  if (rule.targetType === "ip") return visitor.ip === target;
  if (rule.targetType === "cidr") return matchesCidr(visitor.ip, target);
  if (rule.targetType === "country") return visitor.countryCode?.toUpperCase() === target.toUpperCase();
  return false;
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
    const nextPrice = rule.priceMode === "percent"
      ? Math.max(0, Math.round(product.price * (1 + rule.priceValue / 100) * 100) / 100)
      : rule.priceValue;
    return {
      ...product,
      basePrice: product.price,
      baseOriginalPrice: product.originalPrice,
      price: nextPrice,
      originalPrice: rule.originalPrice && rule.originalPrice > nextPrice ? rule.originalPrice : Math.max(product.originalPrice, nextPrice),
      ipPricingRuleName: rule.name,
      ipPricingNote: visitor.countryCode ? `${visitor.ip} · ${visitor.countryCode}` : visitor.ip,
    };
  });
}
