/**
 * @fileoverview Review Progress Bar Component
 * @description Progress bar during ATS review
 */

"use client";

interface ReviewProgressBarProps {
  progress: number;
  totalCandidates: number;
  jobTitle?: string;
}

export function ReviewProgressBar({
  progress,
  totalCandidates,
  jobTitle,
}: ReviewProgressBarProps) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-sm text-neutral-600">
        <span>
          Analyzing {totalCandidates} candidates
          {jobTitle && ` for ${jobTitle}`}...
        </span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: "#15aabf",
          }}
        />
      </div>
    </div>
  );
}
