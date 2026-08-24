/**
 * @fileoverview Candidates Ranking Table Component
 * @description Table showing all ranked candidates
 */

"use client";

import {
  RankingIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserGroupIcon,
  File02Icon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { getTierColor } from "@/lib/ats-tiers";
import { TierBadge } from "./TierBadge";
import type { ReviewedCandidate } from "@/lib/ats-types";

type SortField = "atsScore" | "skillMatch" | "experienceMatch" | "semanticFit";
type SortOrder = "asc" | "desc";

interface CandidatesRankingTableProps {
  candidates: ReviewedCandidate[];
  sortBy: SortField;
  sortOrder: SortOrder;
  onToggleSort: (field: SortField) => void;
  onCandidateClick: (candidate: ReviewedCandidate, index: number) => void;
  onViewResume: (candidate: ReviewedCandidate, e: React.MouseEvent) => void;
}

export function CandidatesRankingTable({
  candidates,
  sortBy,
  sortOrder,
  onToggleSort,
  onCandidateClick,
  onViewResume,
}: CandidatesRankingTableProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === "desc" ? (
      <ArrowDown01Icon size={14} />
    ) : (
      <ArrowUp01Icon size={14} />
    );
  };

  const sortableHeaderClass =
    "cursor-pointer px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-900";

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-300 bg-gray-100 shadow-sm">
      <div className="border-b border-neutral-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
              <RankingIcon size={20} />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-playfair-display)] text-xl font-bold text-neutral-900">
                Remaining candidates
              </h2>
              <p className="text-sm text-neutral-600">
                Everyone outside the shortlist • Click a header to sort • Click a row for details
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Rank
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Candidate
              </th>
              <th
                className={sortableHeaderClass}
                onClick={() => onToggleSort("atsScore")}
              >
                <div className="flex items-center gap-1">
                  Composite Score
                  <SortIcon field="atsScore" />
                </div>
              </th>
              <th
                className={sortableHeaderClass}
                onClick={() => onToggleSort("skillMatch")}
              >
                <div className="flex items-center gap-1">
                  Skills (RCS)
                  <SortIcon field="skillMatch" />
                </div>
              </th>
              <th
                className={sortableHeaderClass}
                onClick={() => onToggleSort("experienceMatch")}
              >
                <div className="flex items-center gap-1">
                  Experience
                  <SortIcon field="experienceMatch" />
                </div>
              </th>
              <th
                className={sortableHeaderClass}
                onClick={() => onToggleSort("semanticFit")}
              >
                <div className="flex items-center gap-1">
                  Semantic
                  <SortIcon field="semanticFit" />
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Tier
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Resume
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {candidates.map((candidate, index) => (
              <tr
                key={candidate.id}
                className="cursor-pointer transition-colors hover:bg-neutral-50"
                onClick={() => onCandidateClick(candidate, index)}
              >
                <td className="px-6 py-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-700">
                    {index + 1}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-neutral-900">
                      {candidate.name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {candidate.currentRole} • {candidate.yearsOfExperience}{" "}
                      yrs
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-lg font-bold"
                      style={{ color: getTierColor(candidate.tier) }}
                    >
                      {candidate.atsScore}%
                    </span>
                    <div className="h-2 w-16 rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${candidate.atsScore}%`,
                          backgroundColor: getTierColor(candidate.tier),
                        }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-emerald-600">
                    {candidate.skillMatch}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-blue-600">
                    {candidate.experienceMatch}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-amber-600">
                    {candidate.semanticFit}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <TierBadge tier={candidate.tier} />
                </td>
                <td className="px-6 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => onViewResume(candidate, e)}
                    className="h-8 border-[#15aabf] px-3 text-xs text-[#15aabf] hover:bg-[#15aabf]/10"
                  >
                    <File02Icon size={14} className="mr-1.5" />
                    Resume
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserGroupIcon size={48} className="mb-4 text-neutral-300" />
            <h3 className="text-lg font-medium text-neutral-700">
              No remaining candidates
            </h3>
            <p className="text-neutral-500">
              Everyone on this list is already on the shortlist, or no one matches the tier filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
