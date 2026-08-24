/**
 * @fileoverview Live Review Panel
 * @description Polled progress panel for an in-flight ATS review session
 */

"use client";

import {
  AiBrain01Icon,
  Loading03Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
} from "hugeicons-react";
import { getTierColor } from "@/lib/ats-tiers";
import type { ReviewProgress } from "@/lib/ats-types";

interface LiveReviewPanelProps {
  progress: ReviewProgress;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function statusColor(status: string): string {
  if (status === "completed") return "#10b981";
  if (status === "processing") return "#15aabf";
  if (status === "failed") return "#ef4444";
  return "#9ca3af";
}

export function LiveReviewPanel({ progress }: LiveReviewPanelProps) {
  const percent =
    progress.totalCandidates > 0
      ? Math.round((progress.processedCount / progress.totalCandidates) * 100)
      : 0;
  const isProcessing = progress.status === "running";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#15aabf]/10">
            <AiBrain01Icon size={20} className="text-[#15aabf]" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">
              {isProcessing ? "AI Analysis in Progress" : "Analysis Complete"}
            </h3>
            <p className="text-sm text-neutral-500">
              {progress.jobTitle} • {progress.totalCandidates} candidates
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-neutral-600">
            {progress.processedCount} of {progress.totalCandidates} processed
          </span>
          <span className="font-medium text-neutral-700">{percent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#15aabf] to-[#0d9488] transition-all duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <CheckmarkCircle02Icon size={16} className="text-emerald-600" />
          <div className="text-xs">
            <div className="font-medium text-neutral-700">Completed</div>
            <div className="font-semibold text-neutral-900">{progress.completedCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <Cancel01Icon size={16} className="text-red-500" />
          <div className="text-xs">
            <div className="font-medium text-neutral-700">Failed</div>
            <div className="font-semibold text-neutral-900">{progress.failedCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <Clock01Icon size={16} className="text-neutral-500" />
          <div className="text-xs">
            <div className="font-medium text-neutral-700">Elapsed</div>
            <div className="font-semibold text-neutral-900">
              {formatElapsed(progress.elapsedTimeMs)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm">
          <Loading03Icon
            size={16}
            className={isProcessing ? "animate-spin text-[#15aabf]" : "text-neutral-400"}
          />
          <div className="text-xs">
            <div className="font-medium text-neutral-700">Status</div>
            <div className="font-semibold text-neutral-900 capitalize">{progress.status}</div>
          </div>
        </div>
      </div>

      {isProcessing && progress.currentCandidate && (
        <div className="rounded-lg border border-[#15aabf]/20 bg-[#15aabf]/10 p-3">
          <div className="mb-1 text-xs font-medium text-[#0d8a9e]">NOW PROCESSING</div>
          <div className="flex items-center gap-2">
            <Loading03Icon size={14} className="animate-spin text-[#15aabf]" />
            <span className="text-sm font-medium text-neutral-900">
              {progress.currentCandidate.candidateName}
            </span>
            {progress.currentCandidate.step && (
              <span className="text-xs text-[#15aabf]">• {progress.currentCandidate.step}</span>
            )}
          </div>
        </div>
      )}

      {progress.candidates.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-neutral-200">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2">
            <h4 className="text-sm font-medium text-neutral-700">Candidates</h4>
          </div>
          <div className="max-h-[300px] overflow-y-auto px-4 py-2">
            {progress.candidates.map((candidate) => (
              <div
                key={candidate.candidateId}
                className="flex items-center justify-between border-b border-neutral-100 py-2 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: statusColor(candidate.status) }}
                  />
                  <div>
                    <div className="text-sm font-medium text-neutral-800">
                      {candidate.candidateName}
                    </div>
                    {candidate.fileName && (
                      <div className="text-xs text-neutral-500">{candidate.fileName}</div>
                    )}
                    {candidate.status === "failed" && candidate.error && (
                      <div className="text-xs text-red-500">{candidate.error}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {candidate.status === "completed" && candidate.atsScore !== undefined && (
                    <>
                      {candidate.tier && (
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: `${getTierColor(candidate.tier)}15`,
                            color: getTierColor(candidate.tier),
                          }}
                        >
                          {candidate.tier.toUpperCase()}
                        </span>
                      )}
                      <span className="font-semibold text-neutral-700">{candidate.atsScore}</span>
                    </>
                  )}
                  {candidate.status === "failed" && (
                    <span className="text-xs text-red-500">Failed</span>
                  )}
                  {candidate.status === "processing" && (
                    <Loading03Icon size={16} className="animate-spin text-[#15aabf]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
