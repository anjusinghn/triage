/**
 * @fileoverview Candidate Detail Modal Component
 * @description Modal for viewing full candidate details
 */

"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Mail01Icon,
  Call02Icon,
  MapPinIcon,
  GraduateMaleIcon,
  Calendar01Icon,
  LinkSquare01Icon,
  Tick02Icon,
  AlertCircleIcon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { getTierColor, getActionLabel } from "@/lib/ats-tiers";
import { ScoreBar } from "./ScoreBar";
import { TierBadge } from "./TierBadge";
import type { ReviewedCandidate, ATSJobPosting } from "@/lib/ats-types";

interface CandidateDetailModalProps {
  candidate: ReviewedCandidate;
  candidateIndex: number;
  totalCandidates: number;
  selectedJob?: ATSJobPosting;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function CandidateDetailModal({
  candidate,
  candidateIndex,
  totalCandidates,
  selectedJob,
  onClose,
  onPrevious,
  onNext,
}: CandidateDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={candidateIndex === 0}
            >
              <ArrowLeft01Icon size={18} />
            </Button>
            <span className="text-sm text-neutral-500">
              {candidateIndex + 1} of {totalCandidates}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={candidateIndex === totalCandidates - 1}
            >
              <ArrowRight01Icon size={18} />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Cancel01Icon size={20} />
          </Button>
        </div>

        <div className="p-6">
          {/* Candidate Info */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                {candidate.name}
              </h2>
              <p className="text-neutral-500">
                {candidate.currentRole} at {candidate.currentCompany}
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                {candidate.yearsOfExperience} years of experience
              </p>
            </div>
            <div className="text-right">
              <div
                className="text-3xl font-bold"
                style={{ color: getTierColor(candidate.tier) }}
              >
                {candidate.atsScore}%
              </div>
              <TierBadge tier={candidate.tier} />
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="mb-6 rounded-xl bg-neutral-50 p-4">
            <h3 className="mb-4 font-semibold text-neutral-700">
              Score Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <ScoreBar
                label="Requirement Coverage (RCS)"
                value={candidate.skillMatch}
                color="#10b981"
              />
              <ScoreBar
                label="Experience Match"
                value={candidate.experienceMatch}
                color="#3b82f6"
              />
              <ScoreBar
                label="Domain Fit (DFS)"
                value={candidate.domainFit}
                color="#8b5cf6"
              />
              <ScoreBar
                label="Semantic Fit (SemFS)"
                value={candidate.semanticFit}
                color="#f59e0b"
              />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <Mail01Icon size={18} className="text-neutral-400" />
              {candidate.email}
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <Call02Icon size={18} className="text-neutral-400" />
              {candidate.phone || "—"}
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <MapPinIcon size={18} className="text-neutral-400" />
              {candidate.location || "—"}
            </div>
            {(candidate.education?.length ?? 0) > 0 && (
              <div className="flex items-center gap-3 text-sm text-neutral-600">
                <GraduateMaleIcon size={18} className="text-neutral-400" />
                {candidate.education[0].degree} {candidate.education[0].field},{" "}
                {candidate.education[0].institution}
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
              Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills ?? []).map((skill, i) => {
                const isRequired = selectedJob?.mustHaveSkills?.some(
                  (s) => s.toLowerCase() === skill.toLowerCase()
                );
                const isNice = selectedJob?.niceToHaveSkills?.some(
                  (s) => s.toLowerCase() === skill.toLowerCase()
                );
                return (
                  <span
                    key={i}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      isRequired
                        ? "bg-emerald-100 text-emerald-700"
                        : isNice
                          ? "bg-blue-100 text-blue-700"
                          : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {skill}
                    {isRequired && " ✓"}
                  </span>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Required skill
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Nice-to-have
              </span>
            </div>
          </div>

          {/* Strengths & Concerns */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                Strengths
              </h3>
              <div className="space-y-2">
                {(candidate.strengths ?? []).map((strength, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-600"
                  >
                    <Tick02Icon
                      size={16}
                      style={{ color: "#10b981" }}
                      className="mt-0.5 flex-shrink-0"
                    />
                    {strength}
                  </div>
                ))}
                {(candidate.strengths?.length ?? 0) === 0 && (
                  <p className="text-sm italic text-neutral-400">
                    No specific strengths identified
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-neutral-700">
                Concerns
              </h3>
              <div className="space-y-2">
                {(candidate.concerns ?? []).map((concern, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-600"
                  >
                    <AlertCircleIcon
                      size={16}
                      className="mt-0.5 flex-shrink-0 text-amber-500"
                    />
                    {concern}
                  </div>
                ))}
                {(candidate.concerns?.length ?? 0) === 0 && (
                  <p className="text-sm italic text-neutral-400">
                    No concerns identified
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resume Preview */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
              Resume Summary
            </h3>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <pre className="whitespace-pre-wrap font-sans text-xs text-neutral-600">
                {(candidate.resumeText ?? "").slice(0, 1500)}
                {(candidate.resumeText?.length ?? 0) > 1500 && "..."}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-neutral-200 pt-4">
            <Button variant="outline" className="flex-1">
              <LinkSquare01Icon size={16} className="mr-2" />
              View Full Resume
            </Button>
            <Button
              className="flex-1 text-white"
              style={{ backgroundColor: "#15aabf" }}
            >
              <Calendar01Icon size={16} className="mr-2" />
              {getActionLabel(candidate.recommendedAction)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
