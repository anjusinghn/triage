"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ATSJobPosting, ATSJobWriteInput, EmploymentType, LocationType } from "@/lib/ats-types";
import { createAtsJob, deleteAtsJob, updateAtsJob } from "@/src/actions/ats-review";

const LOCATION_ITEMS = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
} as const;

const EMPLOYMENT_ITEMS = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
} as const;

function skillsToText(skills: string[]): string {
  return skills.join(", ");
}

function textToSkills(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function postingToForm(job: ATSJobPosting | null): ATSJobWriteInput {
  if (!job) {
    return {
      title: "",
      description: "",
      mustHaveSkills: [],
      niceToHaveSkills: [],
      requiredExperienceYears: 5,
      location: "Remote",
      locationType: "hybrid",
      employmentType: "full-time",
      salaryMin: 120000,
      salaryMax: 180000,
      department: "Engineering",
    };
  }

  return {
    title: job.title,
    description: job.description,
    mustHaveSkills: job.mustHaveSkills,
    niceToHaveSkills: job.niceToHaveSkills,
    requiredExperienceYears: job.experienceRequired,
    location: job.location,
    locationType: job.locationType,
    employmentType: job.employmentType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    department: job.department,
  };
}

interface JobPositionEditorProps {
  job: ATSJobPosting | null;
  canDelete: boolean;
  onCancel: () => void;
  onSaved: (job: ATSJobPosting) => void;
  onDeleted: (deletedId: string) => void;
}

export function JobPositionEditor({
  job,
  canDelete,
  onCancel,
  onSaved,
  onDeleted,
}: JobPositionEditorProps) {
  const isCreate = job == null;
  const initial = useMemo(() => postingToForm(job), [job]);
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [mustHaveText, setMustHaveText] = useState(skillsToText(initial.mustHaveSkills));
  const [niceToHaveText, setNiceToHaveText] = useState(skillsToText(initial.niceToHaveSkills));
  const [years, setYears] = useState(String(initial.requiredExperienceYears));
  const [location, setLocation] = useState(initial.location);
  const [locationType, setLocationType] = useState<LocationType>(initial.locationType);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(initial.employmentType);
  const [salaryMin, setSalaryMin] = useState(String(initial.salaryMin));
  const [salaryMax, setSalaryMax] = useState(String(initial.salaryMax));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const payload = (): ATSJobWriteInput => ({
    title,
    description,
    mustHaveSkills: textToSkills(mustHaveText),
    niceToHaveSkills: textToSkills(niceToHaveText),
    requiredExperienceYears: Number(years) || 0,
    location,
    locationType,
    employmentType,
    salaryMin: Number(salaryMin) || 0,
    salaryMax: Number(salaryMax) || 0,
    department: initial.department,
  });

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const saved = isCreate
        ? await createAtsJob(payload())
        : await updateAtsJob(job.id, payload());
      onSaved(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save this position.";
      if (/fireworks|gemini|google|anthropic|groq|openrouter|openai/i.test(message)) {
        setErrorMessage("Could not save this position.");
      } else {
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !canDelete) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await deleteAtsJob(job.id);
      onDeleted(job.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete this position.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-neutral-900">
          {isCreate ? "New target position" : "Edit target position"}
        </h3>
        {!isCreate && canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="h-8 text-xs text-rose-600 hover:text-rose-700"
          >
            Delete
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="position-title" className="text-xs text-neutral-700">
            Position title
          </Label>
          <Input
            id="position-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            className="h-10 bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="position-description" className="text-xs text-neutral-700">
            Description
          </Label>
          <textarea
            id="position-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Role summary, responsibilities, and qualifications"
            className="w-full rounded-lg border border-input bg-white p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="must-have-skills" className="text-xs text-neutral-700">
            Must-have skills
          </Label>
          <Input
            id="must-have-skills"
            value={mustHaveText}
            onChange={(e) => setMustHaveText(e.target.value)}
            placeholder="React, TypeScript, Node.js"
            className="h-10 bg-white"
          />
          <p className="text-[11px] text-neutral-500">Separate skills with commas.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nice-to-have-skills" className="text-xs text-neutral-700">
            Nice-to-have skills
          </Label>
          <Input
            id="nice-to-have-skills"
            value={niceToHaveText}
            onChange={(e) => setNiceToHaveText(e.target.value)}
            placeholder="GraphQL, AWS, Docker"
            className="h-10 bg-white"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="experience-years" className="text-xs text-neutral-700">
              Years of experience
            </Label>
            <Input
              id="experience-years"
              type="number"
              min={0}
              max={40}
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="position-location" className="text-xs text-neutral-700">
              Location
            </Label>
            <Input
              id="position-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote"
              className="h-10 bg-white"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-700">Work type</Label>
            <Select
              value={locationType}
              onValueChange={(value) => value && setLocationType(value as LocationType)}
              items={LOCATION_ITEMS}
            >
              <SelectTrigger className="h-10 w-full rounded-lg bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-700">Employment</Label>
            <Select
              value={employmentType}
              onValueChange={(value) => value && setEmploymentType(value as EmploymentType)}
              items={EMPLOYMENT_ITEMS}
            >
              <SelectTrigger className="h-10 w-full rounded-lg bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="salary-min" className="text-xs text-neutral-700">
              Salary min
            </Label>
            <Input
              id="salary-min"
              type="number"
              min={0}
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="h-10 bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="salary-max" className="text-xs text-neutral-700">
              Salary max
            </Label>
            <Input
              id="salary-max"
              type="number"
              min={0}
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="h-10 bg-white"
            />
          </div>
        </div>

        {errorMessage && <p className="text-xs text-rose-600">{errorMessage}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting}
            className="text-white"
            style={{ backgroundColor: "#15aabf" }}
          >
            {isSubmitting ? "Saving..." : isCreate ? "Add position" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
