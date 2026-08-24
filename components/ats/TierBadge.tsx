/**
 * @fileoverview Tier Badge Component
 * @description Badge for displaying candidate tier
 */

import { getTierColor, getTierBgColor, TIER_LABELS } from "@/lib/ats-tiers";
import type { CandidateTier } from "@/lib/ats-types";

interface TierBadgeProps {
  tier: string;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const color = getTierColor(tier);
  const bgColor = getTierBgColor(tier);
  const tierKey = tier.toLowerCase() as CandidateTier;
  const label = TIER_LABELS[tierKey] || tier;

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bgColor, color }}
    >
      {label}
    </span>
  );
}
