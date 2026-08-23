import type { ReviewedCandidate } from '@/lib/ats-types';
import { getActionLabel } from '@/lib/ats-tiers';

function byAtsScoreDesc(a: ReviewedCandidate, b: ReviewedCandidate): number {
  return b.atsScore - a.atsScore;
}

/**
 * People a recruiter would actually advance: top + qualified.
 * If none exist, fall back to maybe so the shortlist is still visible.
 */
export function selectShortlisted(candidates: ReviewedCandidate[]): {
  shortlisted: ReviewedCandidate[];
  usedMaybeFallback: boolean;
} {
  const advance = candidates
    .filter((candidate) => candidate.tier === 'top' || candidate.tier === 'qualified')
    .sort(byAtsScoreDesc);

  if (advance.length > 0) {
    return { shortlisted: advance, usedMaybeFallback: false };
  }

  const maybe = candidates.filter((candidate) => candidate.tier === 'maybe').sort(byAtsScoreDesc);
  return { shortlisted: maybe, usedMaybeFallback: maybe.length > 0 };
}

export function getShortlistJustification(candidate: ReviewedCandidate): string {
  const summary = candidate.aiSummary?.trim();
  if (summary) return summary;

  const persisted = candidate.justification?.trim();
  if (persisted) return persisted;

  const strengths = (candidate.strengths ?? []).map((item) => item.trim()).filter(Boolean);
  const actionLabel = candidate.recommendedAction
    ? getActionLabel(candidate.recommendedAction)
    : '';

  const parts: string[] = [];
  if (strengths.length > 0) {
    const strengthText = strengths.slice(0, 3).join('; ');
    parts.push(strengthText.endsWith('.') ? strengthText : `${strengthText}.`);
  }
  if (actionLabel) {
    parts.push(`Recommended next step: ${actionLabel}.`);
  }
  if (parts.length > 0) {
    return parts.join(' ');
  }

  return 'Shortlisted based on ATS score and overall fit for this role.';
}
