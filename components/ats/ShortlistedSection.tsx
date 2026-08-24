/**
 * @fileoverview Shortlisted candidates with recruiter-facing justification
 */

'use client';

import { Tick02Icon, UserGroupIcon } from 'hugeicons-react';
import { getActionLabel, getTierBgColor, getTierColor } from '@/lib/ats-tiers';
import { getShortlistJustification } from '@/lib/ats-shortlist';
import { TierBadge } from './TierBadge';
import type { ReviewedCandidate } from '@/lib/ats-types';

interface ShortlistedSectionProps {
  candidates: ReviewedCandidate[];
  usedMaybeFallback: boolean;
  allCandidates: ReviewedCandidate[];
  onCandidateClick: (candidate: ReviewedCandidate, index: number) => void;
}

export function ShortlistedSection({
  candidates,
  usedMaybeFallback,
  allCandidates,
  onCandidateClick,
}: ShortlistedSectionProps) {
  const subtitle = usedMaybeFallback
    ? 'No top or qualified matches — advancing the strongest maybe profiles'
    : 'Top and qualified candidates to advance next';

  return (
    <div className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-emerald-50/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor: getTierBgColor('top'),
                color: getTierColor('top'),
              }}
            >
              <Tick02Icon size={20} />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-playfair-display)] text-xl font-bold text-neutral-900">
                Shortlisted
              </h2>
              <p className="text-sm text-neutral-600">{subtitle}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {candidates.length} to advance
          </span>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <UserGroupIcon size={40} className="mb-3 text-neutral-300" />
          <h3 className="text-base font-semibold text-neutral-800">No one shortlisted</h3>
          <p className="mt-1 max-w-md text-sm text-neutral-500">
            Nobody met the bar to advance (top or qualified). Review the ranking table below.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 p-6 md:grid-cols-2">
          {candidates.map((candidate, index) => {
            const justification = getShortlistJustification(candidate);
            const strengths = (candidate.strengths ?? [])
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 3);
            const listIndex = allCandidates.findIndex((item) => item.id === candidate.id);

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() =>
                  onCandidateClick(candidate, listIndex >= 0 ? listIndex : index)
                }
                className="rounded-xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-700">#{index + 1}</span>
                      <h3 className="truncate font-semibold text-neutral-900">{candidate.name}</h3>
                    </div>
                    <p className="truncate text-sm text-neutral-500">
                      {candidate.currentRole}
                      {candidate.currentCompany ? ` at ${candidate.currentCompany}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="text-xl font-bold"
                      style={{ color: getTierColor(candidate.tier) }}
                    >
                      {candidate.atsScore}%
                    </span>
                    <TierBadge tier={candidate.tier} />
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    Why shortlisted
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-700">{justification}</p>
                </div>

                {strengths.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {strengths.map((strength) => (
                      <li
                        key={strength}
                        className="flex items-start gap-2 text-xs text-neutral-600"
                      >
                        <Tick02Icon
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: getTierColor('top') }}
                        />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-3 text-xs font-medium text-[#15aabf]">
                  Next: {getActionLabel(candidate.recommendedAction)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
