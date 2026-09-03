import {
  Lock,
  Globe,
  Gauge,
  Sparkles,
  ShieldCheck,
  MonitorSmartphone,
  Headphones,
  Zap,
  Star,
  KeyRound,
  Repeat,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Lock,
  Globe,
  Gauge,
  Sparkles,
  ShieldCheck,
  MonitorSmartphone,
  Headphones,
  Zap,
  Star,
  KeyRound,
  Repeat,
  Users,
};

export const ICON_NAMES = Object.keys(ICONS);

export const GRADIENTS = [
  "bg-gradient-to-br from-blue-500 to-indigo-600",
  "bg-gradient-to-br from-indigo-500 to-purple-600",
  "bg-gradient-to-br from-sky-500 to-blue-600",
  "bg-gradient-to-br from-violet-500 to-fuchsia-600",
  "bg-gradient-to-br from-emerald-500 to-teal-600",
  "bg-gradient-to-br from-orange-500 to-rose-600",
];

export function icon(name?: string, fallback: LucideIcon = Sparkles): LucideIcon {
  return (name && ICONS[name]) || fallback;
}
