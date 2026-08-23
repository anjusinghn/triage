/**
 * @fileoverview Tier Constants
 * @description Centralized tier configurations for ATS scoring
 */

import type { CandidateTier } from '@/lib/ats-types';

/**
 * Tier color mapping
 */
export const TIER_COLORS: Record<CandidateTier, string> = {
  top: "#10b981",
  qualified: "#15aabf",
  maybe: "#f59e0b",
  unqualified: "#ef4444",
  rejected: "#6b7280",
};

/**
 * Tier background color mapping
 */
export const TIER_BG_COLORS: Record<CandidateTier, string> = {
  top: "#10b98115",
  qualified: "#15aabf15",
  maybe: "#f59e0b15",
  unqualified: "#ef444415",
  rejected: "#6b728015",
};

/**
 * Tier labels
 */
export const TIER_LABELS: Record<CandidateTier, string> = {
  top: "Top Tier",
  qualified: "Qualified",
  maybe: "Maybe",
  unqualified: "Unqualified",
  rejected: "Rejected",
};

/**
 * Action labels for recommended actions
 */
export const ACTION_LABELS: Record<string, string> = {
  ai_interview: "AI Interview",
  assessment: "Send Assessment",
  manual_review: "Manual Review",
  reject: "Auto-Reject",
  hold: "Hold",
};

/**
 * Get tier color by tier key
 */
export function getTierColor(tier: string): string {
  return TIER_COLORS[tier.toLowerCase() as CandidateTier] || "#6b7280";
}

/**
 * Get tier background color by tier key
 */
export function getTierBgColor(tier: string): string {
  return TIER_BG_COLORS[tier.toLowerCase() as CandidateTier] || "#6b728015";
}

/**
 * Get tier label by tier key
 */
export function getTierLabel(tier: string): string {
  return TIER_LABELS[tier.toLowerCase() as CandidateTier] || tier;
}

/**
 * Get action label by action key
 */
export function getActionLabel(action: string): string {
  return ACTION_LABELS[action] || action;
}
