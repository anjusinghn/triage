/**
 * @fileoverview Review Stats Cards Component
 * @description Stats overview cards for reviewed candidates
 */

"use client";

import {
  UserGroupIcon,
  StarIcon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
  AlertCircleIcon,
} from "hugeicons-react";
import { getTierColor, getTierBgColor } from "@/lib/ats-tiers";

interface TierBreakdown {
  top: number;
  qualified: number;
  maybe: number;
  unqualified: number;
  rejected: number;
}

interface ReviewStatsCardsProps {
  totalReviewed: number;
  tierBreakdown: TierBreakdown;
}

const statConfigs = [
  {
    key: "total",
    label: "Total Reviewed",
    icon: UserGroupIcon,
    getValue: (total: number) => total,
    tier: null,
  },
  {
    key: "top",
    label: "Top Tier",
    icon: StarIcon,
    getValue: (_: number, breakdown: TierBreakdown) => breakdown.top,
    tier: "top",
  },
  {
    key: "qualified",
    label: "Qualified",
    icon: CheckmarkCircle02Icon,
    getValue: (_: number, breakdown: TierBreakdown) => breakdown.qualified,
    tier: "qualified",
  },
  {
    key: "maybe",
    label: "Maybe",
    icon: InformationCircleIcon,
    getValue: (_: number, breakdown: TierBreakdown) => breakdown.maybe,
    tier: "maybe",
  },
  {
    key: "unqualified",
    label: "Not Qualified",
    icon: AlertCircleIcon,
    getValue: (_: number, breakdown: TierBreakdown) =>
      breakdown.unqualified + breakdown.rejected,
    tier: "unqualified",
  },
] as const;

export function ReviewStatsCards({
  totalReviewed,
  tierBreakdown,
}: ReviewStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {statConfigs.map((config) => {
        const Icon = config.icon;
        const value = config.getValue(totalReviewed, tierBreakdown);
        const iconStyle = config.tier
          ? {
            backgroundColor: getTierBgColor(config.tier),
            color: getTierColor(config.tier),
          }
          : { backgroundColor: "#15aabf20", color: "#15aabf" };

        return (
          <div
            key={config.key}
            className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={iconStyle}
              >
                <Icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-neutral-900">{value}</p>
            <p className="text-xs text-neutral-500">{config.label}</p>
          </div>
        );
      })}
    </div>
  );
}
