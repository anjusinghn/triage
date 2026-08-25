/**
 * @fileoverview Overlay of shortlisted candidates from recent scans
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase02Icon,
  Cancel01Icon,
  Clock01Icon,
  File01Icon,
  Loading03Icon,
  Tick02Icon,
  UserGroupIcon,
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { getShortlistJustification } from '@/lib/ats-shortlist';
import { getTierColor } from '@/lib/ats-tiers';
import type { PastScan, ReviewedCandidate } from '@/lib/ats-types';
import { ATSResumeModal } from './ATSResumeModal';
import { TierBadge } from './TierBadge';

interface PastScansPanelProps {
  open: boolean;
  onClose: () => void;
  scans: PastScan[];
  loading?: boolean;
}

function isAdvanceTier(candidate: ReviewedCandidate): boolean {
  return candidate.tier === 'top' || candidate.tier === 'qualified';
}

function formatScanDate(iso: string): { relative: string; absolute: string } {
  const date = new Date(iso);
  const invalid = Number.isNaN(date.getTime());
  const absolute = invalid
    ? iso
    : date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });

  if (invalid) {
    return { relative: iso, absolute };
  }

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  let relative: string;
  if (absSeconds < 60) {
    relative = rtf.format(diffSeconds, 'second');
  } else if (absSeconds < 3600) {
    relative = rtf.format(Math.round(diffSeconds / 60), 'minute');
  } else if (absSeconds < 86400) {
    relative = rtf.format(Math.round(diffSeconds / 3600), 'hour');
  } else if (absSeconds < 2592000) {
    relative = rtf.format(Math.round(diffSeconds / 86400), 'day');
  } else if (absSeconds < 31536000) {
    relative = rtf.format(Math.round(diffSeconds / 2592000), 'month');
  } else {
    relative = rtf.format(Math.round(diffSeconds / 31536000), 'year');
  }

  return { relative, absolute };
}

export function PastScansPanel({
  open,
  onClose,
  scans,
  loading = false,
}: PastScansPanelProps) {
  const [resumeCandidate, setResumeCandidate] = useState<ReviewedCandidate | null>(null);
  const groupedScans = useMemo(() => {
    return scans
      .map((scan) => ({
        ...scan,
        shortlisted: scan.shortlisted.filter(isAdvanceTier),
      }))
      .filter((scan) => scan.shortlisted.length > 0)
      .sort(
        (a, b) =>
          new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime(),
      );
  }, [scans]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="past-scans-title"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 bg-gradient-to-r from-[#15aabf]/5 to-transparent p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#15aabf]/10 text-[#15aabf]">
              <Clock01Icon size={20} />
            </div>
            <div>
              <h2
                id="past-scans-title"
                className="font-[family-name:var(--font-playfair-display)] text-xl font-bold text-neutral-900"
              >
                Past scans
              </h2>
              <p className="text-sm text-neutral-600">
                Shortlisted candidates from recent reviews
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <Cancel01Icon size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loading03Icon size={32} className="animate-spin text-[#15aabf]" />
              <p className="mt-3 text-sm text-neutral-500">Loading past scans…</p>
            </div>
          ) : groupedScans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <UserGroupIcon size={40} className="mb-3 text-neutral-300" />
              <h3 className="text-base font-semibold text-neutral-800">
                No past shortlists yet.
              </h3>
              <p className="mt-1 max-w-md text-sm text-neutral-500">
                Completed reviews with top or qualified candidates will appear
                here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedScans.map((scan) => {
                const { relative, absolute } = formatScanDate(scan.scannedAt);

                return (
                  <section
                    key={scan.id}
                    className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-emerald-100 bg-emerald-50/60 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Briefcase02Icon
                              size={16}
                              className="shrink-0 text-[#15aabf]"
                            />
                            <h3 className="truncate font-semibold text-neutral-900">
                              {scan.jobTitle}
                            </h3>
                          </div>
                          <p className="mt-1 text-sm text-neutral-500">
                            <span className="capitalize">{relative}</span>
                            <span className="text-neutral-400"> · </span>
                            <span>{absolute}</span>
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                          {scan.shortlisted.length} shortlisted
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-4 p-5 lg:grid-cols-2">
                      {scan.shortlisted.map((candidate) => {
                        const justification = getShortlistJustification(candidate);
                        const resumeText = candidate.resumeText?.trim() || '';

                        return (
                          <div
                            key={candidate.id}
                            className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5"
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="truncate font-semibold text-neutral-900">
                                  {candidate.name}
                                </h4>
                                <p className="truncate text-sm text-neutral-500">
                                  {candidate.currentRole}
                                  {candidate.currentCompany
                                    ? ` at ${candidate.currentCompany}`
                                    : ''}
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

                            <div className="mb-3 rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                                <Tick02Icon size={12} />
                                Why shortlisted
                              </p>
                              <p className="text-sm leading-relaxed text-neutral-700">
                                {justification}
                              </p>
                            </div>

                            <div className="min-h-0 flex-1">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                                  <File01Icon size={12} />
                                  Resume
                                </p>
                                {resumeText ? (
                                  <button
                                    type="button"
                                    onClick={() => setResumeCandidate(candidate)}
                                    className="text-xs font-medium text-[#15aabf] hover:underline"
                                  >
                                    View full resume
                                  </button>
                                ) : null}
                              </div>
                              {resumeText ? (
                                <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-sans text-xs leading-relaxed text-neutral-700">
                                  {resumeText}
                                </pre>
                              ) : (
                                <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-4 text-xs text-neutral-500">
                                  No parsed resume text stored for this candidate.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
    {resumeCandidate ? (
      <ATSResumeModal
        candidate={resumeCandidate}
        onClose={() => setResumeCandidate(null)}
      />
    ) : null}
    </>
  );
}
