export type ProductBadge = "hot" | "new" | "recommend";

export interface Product {
  titleKey: string;
  price: number;
  originalPrice: number;
  color: string;
  badge?: ProductBadge;
  category: string;
  stock?: number;
  delivery?: string;
  imageUrl?: string;
  subtitle?: string;
  description?: string;
}

export const products: Product[] = [
  // SVOD (streaming video)
  { titleKey: "Netflix", price: 29.99, originalPrice: 99.99, color: "bg-gradient-to-br from-red-600 to-red-800", badge: "hot", category: "svod" },
  { titleKey: "Disney+", price: 24.99, originalPrice: 79.99, color: "bg-gradient-to-br from-blue-400 to-blue-600", badge: "new", category: "svod" },
  { titleKey: "HBO Max", price: 19.99, originalPrice: 49.99, color: "bg-gradient-to-br from-purple-600 to-purple-800", category: "svod" },
  { titleKey: "YouTube Premium", price: 34.99, originalPrice: 79.99, color: "bg-gradient-to-br from-red-500 to-red-700", badge: "hot", category: "svod" },
  { titleKey: "Prime Video", price: 27.99, originalPrice: 69.99, color: "bg-gradient-to-br from-cyan-500 to-blue-600", category: "svod" },

  // AI
  { titleKey: "ChatGPT Plus", price: 15.99, originalPrice: 20.00, color: "bg-gradient-to-br from-emerald-500 to-teal-700", badge: "hot", category: "ai" },
  { titleKey: "Claude Pro", price: 14.99, originalPrice: 20.00, color: "bg-gradient-to-br from-orange-500 to-amber-700", badge: "new", category: "ai" },
  { titleKey: "Midjourney", price: 9.99, originalPrice: 30.00, color: "bg-gradient-to-br from-slate-700 to-slate-900", badge: "recommend", category: "ai" },
  { titleKey: "Perplexity Pro", price: 12.99, originalPrice: 20.00, color: "bg-gradient-to-br from-sky-500 to-indigo-700", category: "ai" },

  // Music
  { titleKey: "Spotify Premium", price: 19.99, originalPrice: 59.99, color: "bg-gradient-to-br from-green-500 to-green-700", badge: "recommend", category: "music" },
  { titleKey: "Apple Music", price: 14.99, originalPrice: 39.99, color: "bg-gradient-to-br from-pink-500 to-rose-600", category: "music" },
  { titleKey: "Tidal HiFi", price: 22.99, originalPrice: 59.99, color: "bg-gradient-to-br from-slate-700 to-black", category: "music" },

  // Marketplace
  { titleKey: "Amazon Prime", price: 8.99, originalPrice: 14.99, color: "bg-gradient-to-br from-yellow-500 to-orange-600", category: "marketplace" },
  { titleKey: "Costco Membership", price: 39.99, originalPrice: 60.00, color: "bg-gradient-to-br from-red-500 to-red-700", category: "marketplace" },

  // Top up
  { titleKey: "Steam Wallet", price: 45.00, originalPrice: 50.00, color: "bg-gradient-to-br from-blue-700 to-slate-900", badge: "hot", category: "topup" },
  { titleKey: "PSN Card", price: 45.00, originalPrice: 50.00, color: "bg-gradient-to-br from-indigo-600 to-blue-800", category: "topup" },
  { titleKey: "iTunes Gift Card", price: 47.00, originalPrice: 50.00, color: "bg-gradient-to-br from-gray-600 to-gray-900", category: "topup" },

  // Software
  { titleKey: "Microsoft 365", price: 49.99, originalPrice: 129.99, color: "bg-gradient-to-br from-orange-500 to-red-600", category: "software" },
  { titleKey: "Adobe Creative Cloud", price: 89.99, originalPrice: 239.99, color: "bg-gradient-to-br from-red-600 to-pink-700", badge: "recommend", category: "software" },

  // Games
  { titleKey: "Steam", price: 149.99, originalPrice: 399.99, color: "bg-gradient-to-br from-blue-600 to-indigo-700", category: "games" },
  { titleKey: "Xbox Game Pass", price: 39.99, originalPrice: 89.99, color: "bg-gradient-to-br from-green-600 to-green-800", category: "games" },
  { titleKey: "PlayStation Plus", price: 44.99, originalPrice: 99.99, color: "bg-gradient-to-br from-blue-500 to-blue-800", badge: "hot", category: "games" },
];

export const categories = [
  { id: "all", label: "All", labelZh: "全部" },
  { id: "svod", label: "SVOD", labelZh: "流媒体" },
  { id: "ai", label: "AI", labelZh: "AI" },
  { id: "music", label: "Music", labelZh: "音乐" },
  { id: "marketplace", label: "Marketplace", labelZh: "电商" },
  { id: "topup", label: "Top up", labelZh: "充值" },
  { id: "software", label: "Software", labelZh: "软件" },
  { id: "games", label: "Games", labelZh: "游戏" },
];
