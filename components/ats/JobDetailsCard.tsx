/**
 * @fileoverview Job Details Card Component
 * @description Displays selected job details before review
 */

"use client";

import { MapPinIcon, Briefcase02Icon } from "hugeicons-react";
import { Badge } from "@/components/ui/badge";
import type { ATSJobPosting } from "@/lib/ats-types";

function formatEmploymentType(type: string): string {
  return type.replace(/^\w/, (char) => char.toUpperCase());
}

interface JobDetailsCardProps {
  job: ATSJobPosting;
  onEdit?: () => void;
}

export function JobDetailsCard({ job, onEdit }: JobDetailsCardProps) {
  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-neutral-900">{job.title}</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{formatEmploymentType(job.employmentType)}</Badge>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-[#15aabf] hover:underline"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      <p className="mb-3 line-clamp-2 text-sm text-neutral-600">
        {job.description}
      </p>
      <div className="flex flex-wrap gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <MapPinIcon size={14} />
          {job.location} ({job.locationType})
        </span>
        <span className="flex items-center gap-1">
          <Briefcase02Icon size={14} />
          {job.experienceRequired}+ years required
        </span>
        <span>
          ${(job.salaryMin ?? 0).toLocaleString()} - ${(job.salaryMax ?? 0).toLocaleString()}
        </span>
      </div>
      <div className="mt-3">
        <div className="mb-2 text-xs font-medium text-neutral-700">
          Must-have skills:
        </div>
        <div className="flex flex-wrap gap-1">
          {(job.mustHaveSkills ?? []).map((skill, i) => (
            <span
              key={i}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-2 text-xs font-medium text-neutral-700">
          Nice-to-have:
        </div>
        <div className="flex flex-wrap gap-1">
          {(job.niceToHaveSkills ?? []).slice(0, 6).map((skill, i) => (
            <span
              key={i}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
            >
              {skill}
            </span>
          ))}
          {(job.niceToHaveSkills?.length ?? 0) > 6 && (
            <span className="text-xs text-neutral-400">
              +{job.niceToHaveSkills.length - 6} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact job context banner for results view
 */
export function JobContextBanner({ job }: JobDetailsCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">
            Reviewing candidates for:
          </div>
          <div className="font-semibold text-neutral-900">{job.title}</div>
        </div>
        <div className="flex flex-wrap gap-1">
          {(job.mustHaveSkills ?? []).slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
            >
              {skill}
            </span>
          ))}
          {(job.mustHaveSkills?.length ?? 0) > 4 && (
            <span className="text-xs text-neutral-400">
              +{job.mustHaveSkills.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
