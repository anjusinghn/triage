/**
 * @fileoverview Top Talents Section Component
 * @description Displays top tier candidates in card format
 */

"use client";

import { SparklesIcon, Calendar01Icon } from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { getTierColor, getTierBgColor, getActionLabel } from "@/lib/ats-tiers";
import { ScoreBar } from "./ScoreBar";
import { TierBadge } from "./TierBadge";
import type { ReviewedCandidate } from "@/lib/ats-types";

interface TopTalentsSectionProps {
  candidates: ReviewedCandidate[];
  allCandidates: ReviewedCandidate[];
  onCandidateClick: (candidate: ReviewedCandidate, index: number) => void;
}

export function TopTalentsSection({
  candidates,
  allCandidates,
  onCandidateClick,
}: TopTalentsSectionProps) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-300 bg-gray-100 shadow-sm">
      <div className="border-b border-neutral-200 p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              backgroundColor: getTierBgColor("top"),
              color: getTierColor("top"),
            }}
          >
            <SparklesIcon size={20} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-playfair-display)] text-xl font-bold text-neutral-900">
              Top Talents
            </h2>
            <p className="text-sm text-neutral-600">
              Highest scoring candidates - ready for AI interview
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {candidates.slice(0, 6).map((candidate, index) => (
          <div
            key={candidate.id}
            onClick={() =>
              onCandidateClick(candidate, allCandidates.indexOf(candidate))
            }
            className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-neutral-900">
                    #{index + 1}
                  </span>
                  <h3 className="font-semibold text-neutral-900">
                    {candidate.name}
                  </h3>
                </div>
                <p className="text-sm text-neutral-500">
                  {candidate.currentRole} at {candidate.currentCompany}
                </p>
              </div>
              <TierBadge tier={candidate.tier} />
            </div>

            {/* Score breakdown */}
            <div className="mb-4 space-y-2">
              <ScoreBar
                label="Skills Match"
                value={candidate.skillMatch}
                color="#10b981"
              />
              <ScoreBar
                label="Experience"
                value={candidate.experienceMatch}
                color="#3b82f6"
              />
              <ScoreBar
                label="Semantic Fit"
                value={candidate.semanticFit}
                color="#f59e0b"
              />
            </div>

            {/* Overall Score */}
            <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-3">
              <span className="text-sm font-medium text-neutral-700">
                ATS Score
              </span>
              <span
                className="text-xl font-bold"
                style={{ color: getTierColor(candidate.tier) }}
              >
                {candidate.atsScore}%
              </span>
            </div>

            {/* Recommended Action */}
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full text-white"
                style={{ backgroundColor: "#15aabf" }}
              >
                <Calendar01Icon size={14} className="mr-2" />
                {getActionLabel(candidate.recommendedAction)}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
