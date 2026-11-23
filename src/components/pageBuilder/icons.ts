import {
  Award,
  BadgePercent,
  Clock,
  Coffee,
  Droplets,
  Flame,
  Gift,
  Heart,
  Leaf,
  Package,
  Recycle,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { IconKey } from "@/lib/pageBuilder/types";

export const ICONS: Record<IconKey, LucideIcon> = {
  leaf: Leaf,
  coffee: Coffee,
  truck: Truck,
  shield: ShieldCheck,
  gift: Gift,
  sparkles: Sparkles,
  clock: Clock,
  heart: Heart,
  star: Star,
  flame: Flame,
  award: Award,
  package: Package,
  zap: Zap,
  percent: BadgePercent,
  recycle: Recycle,
  droplet: Droplets,
};

