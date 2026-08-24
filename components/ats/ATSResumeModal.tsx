/**
 * @fileoverview ATS Resume Modal Component
 * @description Modal for viewing candidate resume with ATS context
 */

"use client";

import {
  Cancel01Icon,
  Mail01Icon,
  MapPinIcon,
  GraduateMaleIcon,
} from "hugeicons-react";
import { Button } from "@/components/ui/button";
import { getTierColor } from "@/lib/ats-tiers";
import { TierBadge } from "./TierBadge";
import type { ReviewedCandidate } from "@/lib/ats-types";

interface ATSResumeModalProps {
  candidate: ReviewedCandidate;
  onClose: () => void;
}

export function ATSResumeModal({ candidate, onClose }: ATSResumeModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 bg-gradient-to-r from-[#15aabf]/5 to-transparent px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {candidate.name}
            </h3>
            <p className="text-sm text-neutral-500">
              {candidate.currentRole} • {candidate.yearsOfExperience} years
              experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        {/* Resume Content */}
        <div className="max-h-[calc(85vh-140px)] overflow-y-auto p-6">
          {/* Contact Info */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Mail01Icon size={14} className="text-[#15aabf]" />
              <span>{candidate.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPinIcon size={14} className="text-[#15aabf]" />
              <span>{candidate.location || "—"}</span>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">
              Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {(candidate.skills ?? []).map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-[#15aabf]/10 px-3 py-1 text-xs font-medium text-[#15aabf]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">
              Education
            </h4>
            <div className="space-y-2">
              {(candidate.education ?? []).map((edu, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <GraduateMaleIcon
                    size={16}
                    className="mt-0.5 text-neutral-400"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {edu.degree} in {edu.field}
                    </p>
                    <p className="text-xs text-neutral-500">{edu.institution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Text */}
          <div>
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">
              Resume Content
            </h4>
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-700">
                {candidate.resumeText}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 bg-neutral-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TierBadge tier={candidate.tier} />
              <span className="text-sm text-neutral-500">
                Score:{" "}
                <span
                  className="font-semibold"
                  style={{ color: getTierColor(candidate.tier) }}
                >
                  {candidate.atsScore}%
                </span>
              </span>
            </div>
            <Button
              onClick={onClose}
              className="bg-[#15aabf] text-white hover:bg-[#0d7f8f]"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
