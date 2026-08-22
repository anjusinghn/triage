export type CandidateTier = 'top' | 'qualified' | 'maybe' | 'unqualified' | 'rejected';

export type RecommendedAction =
  | 'ai_interview'
  | 'assessment'
  | 'manual_review'
  | 'reject'
  | 'hold';

export type LocationType = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'full-time' | 'part-time' | 'contract';

export const DEFAULT_JOB_SLUG = 'fullstack';

export interface ATSJobWriteInput {
  title: string;
  description: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  requiredExperienceYears: number;
  location: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  department?: string;
}

export interface ATSJobPosting {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  locationType: LocationType;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  experienceRequired: number;
  description: string;
  responsibilities: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  requiredEducation: string;
  keywords: string[];
  createdAt: string;
}

export interface ATSCandidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  currentRole: string;
  currentCompany: string;
  yearsOfExperience: number;
  skills: string[];
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    year: number;
  }>;
  resumeText: string;
  fileName?: string;
  atsScore?: number;
  tier?: CandidateTier;
}

export interface ReviewedCandidate extends ATSCandidate {
  atsScore: number;
  skillMatch: number;
  experienceMatch: number;
  domainFit: number;
  semanticFit: number;
  overallFit: number;
  tier: CandidateTier;
  recommendedAction: string;
  strengths: string[];
  concerns: string[];
  aiSummary?: string;
  justification?: string;
}

export interface ReviewProgress {
  sessionId: string;
  jobId: string;
  jobTitle: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalCandidates: number;
  processedCount: number;
  completedCount: number;
  failedCount: number;
  currentCandidate?: {
    candidateId: string;
    candidateName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    step?: string;
    atsScore?: number;
    tier?: string;
    error?: string;
  };
  candidates: Array<{
    candidateId: string;
    candidateName: string;
    fileName?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    atsScore?: number;
    tier?: string;
    error?: string;
  }>;
  elapsedTimeMs: number;
}

export interface ReviewSessionResult {
  sessionId: string;
  job: ATSJobPosting;
  results: ReviewedCandidate[];
  progress: ReviewProgress;
}