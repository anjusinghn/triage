import { prisma } from '@/lib/prisma';
import type { Prisma, Job, Candidate, Application } from '@prisma/client';
import { FRONTEND_JOB_SEED, FULLSTACK_JOB_SEED } from '@/lib/ats-default-jobs';

export interface CandidateData {
  id?: string;
  name: string;
  email?: string | null;
  resumeUrl?: string | null;
  skills: string[];
  experience?: Prisma.InputJsonValue;
  education?: Prisma.InputJsonValue;
}

export interface MatchData {
  score: number;
  justification: string;
  tier?: string;
  skillMatch?: number;
  experienceMatch?: number;
  domainFit?: number;
  semanticFit?: number;
  strengths?: string[];
  concerns?: string[];
  recommendedAction?: string;
  aiSummary?: string | null;
  fileName?: string | null;
}

export interface SaveEvaluationParams {
  candidateData: CandidateData;
  matchData: MatchData;
  jobId: string;
}

export interface EvaluationResult {
  candidate: Candidate;
  application: Application;
}

export type ParsedResumeWrite = {
  contentHash: string;
  fileName: string;
  mimeType?: string;
  extractedText: string;
  normalizedText?: string | null;
  justification?: string;
  jobId?: string;
  jobTitle?: string;
  matchScore?: number;
  tier?: string;
  skills: unknown;
  workExperience: unknown;
  education: unknown;
  totalYearsExperience: number;
  highestSeniority?: string | null;
  source?: string;
};

export type JobWriteData = {
  title: string;
  description: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  requiredExperienceYears?: number;
  department?: string;
  location?: string;
  locationType?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
};

function jobSlugFromTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${base || 'position'}-${Date.now().toString(36)}`;
}

export const DEFAULT_JOB_RECORD: Job = {
  id: 'default-job-id',
  title: FULLSTACK_JOB_SEED.title,
  description: FULLSTACK_JOB_SEED.description,
  slug: FULLSTACK_JOB_SEED.slug,
  mustHaveSkills: FULLSTACK_JOB_SEED.mustHaveSkills,
  niceToHaveSkills: FULLSTACK_JOB_SEED.niceToHaveSkills,
  requiredExperienceYears: FULLSTACK_JOB_SEED.requiredExperienceYears,
  department: FULLSTACK_JOB_SEED.department,
  location: FULLSTACK_JOB_SEED.location,
  locationType: FULLSTACK_JOB_SEED.locationType,
  employmentType: FULLSTACK_JOB_SEED.employmentType,
  salaryMin: FULLSTACK_JOB_SEED.salaryMin,
  salaryMax: FULLSTACK_JOB_SEED.salaryMax,
  createdAt: new Date(),
};

function withJobDefaults(
  partial: Partial<Job> & Pick<Job, 'id' | 'title' | 'description'>
): Job {
  return {
    ...DEFAULT_JOB_RECORD,
    createdAt: new Date(),
    ...partial,
  };
}

function atsApplicationFields(matchData: MatchData) {
  return {
    tier: matchData.tier ?? 'maybe',
    skillMatch: Math.round(matchData.skillMatch ?? 0),
    experienceMatch: Math.round(matchData.experienceMatch ?? 0),
    domainFit: Math.round(matchData.domainFit ?? 0),
    semanticFit: Math.round(matchData.semanticFit ?? 0),
    strengths: matchData.strengths ?? [],
    concerns: matchData.concerns ?? [],
    recommendedAction: matchData.recommendedAction ?? 'manual_review',
    aiSummary: matchData.aiSummary ?? null,
    fileName: matchData.fileName ?? null,
  };
}

export class CandidateRepository {
  /**
   * Create a new target job position.
   */
  async createJob(data: JobWriteData): Promise<Job> {
    const slug = jobSlugFromTitle(data.title);
    const payload: Prisma.JobCreateInput = {
      title: data.title.trim(),
      description: data.description.trim(),
      slug,
      mustHaveSkills: data.mustHaveSkills ?? [],
      niceToHaveSkills: data.niceToHaveSkills ?? [],
      requiredExperienceYears: data.requiredExperienceYears ?? 5,
      department: data.department ?? 'Engineering',
      location: data.location ?? 'Remote',
      locationType: data.locationType ?? 'hybrid',
      employmentType: data.employmentType ?? 'full-time',
      salaryMin: data.salaryMin ?? 120000,
      salaryMax: data.salaryMax ?? 180000,
    };
    try {
      return await prisma.job.create({ data: payload });
    } catch (err) {
      console.warn('Database job creation failed, returning in-memory mock:', err);
      return withJobDefaults({
        id: `job-${Date.now()}`,
        title: payload.title,
        description: payload.description,
        slug,
        mustHaveSkills: data.mustHaveSkills ?? [],
        niceToHaveSkills: data.niceToHaveSkills ?? [],
        requiredExperienceYears: data.requiredExperienceYears ?? 5,
        department: data.department ?? 'Engineering',
        location: data.location ?? 'Remote',
        locationType: data.locationType ?? 'hybrid',
        employmentType: data.employmentType ?? 'full-time',
        salaryMin: data.salaryMin ?? 120000,
        salaryMax: data.salaryMax ?? 180000,
      });
    }
  }

  /**
   * Update an existing job position.
   */
  async updateJob(id: string, data: JobWriteData): Promise<Job> {
    const payload: Prisma.JobUpdateInput = {
      title: data.title.trim(),
      description: data.description.trim(),
      ...(data.mustHaveSkills !== undefined ? { mustHaveSkills: data.mustHaveSkills } : {}),
      ...(data.niceToHaveSkills !== undefined ? { niceToHaveSkills: data.niceToHaveSkills } : {}),
      ...(data.requiredExperienceYears !== undefined
        ? { requiredExperienceYears: data.requiredExperienceYears }
        : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
      ...(data.locationType !== undefined ? { locationType: data.locationType } : {}),
      ...(data.employmentType !== undefined ? { employmentType: data.employmentType } : {}),
      ...(data.salaryMin !== undefined ? { salaryMin: data.salaryMin } : {}),
      ...(data.salaryMax !== undefined ? { salaryMax: data.salaryMax } : {}),
    };
    try {
      return await prisma.job.update({
        where: { id },
        data: payload,
      });
    } catch (err) {
      console.warn('Database job update failed:', err);
      return withJobDefaults({
        id,
        title: data.title,
        description: data.description,
        mustHaveSkills: data.mustHaveSkills,
        niceToHaveSkills: data.niceToHaveSkills,
        requiredExperienceYears: data.requiredExperienceYears,
        department: data.department,
        location: data.location,
        locationType: data.locationType,
        employmentType: data.employmentType,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
      });
    }
  }

  /**
   * Delete a job position and associated applications if needed.
   */
  async deleteJob(id: string): Promise<boolean> {
    try {
      await prisma.application.deleteMany({ where: { jobId: id } });
      await prisma.job.delete({ where: { id } });
      return true;
    } catch (err) {
      console.warn('Database job deletion failed:', err);
      return false;
    }
  }

  /**
   * Persists Candidate record and linked Application in a single transaction.
   * Updates the existing pair when fileName or email already maps to this job.
   * Returns fallback IDs if database connection is unavailable.
   */
  async saveCandidateEvaluation({
    candidateData,
    matchData,
    jobId,
  }: SaveEvaluationParams): Promise<EvaluationResult> {
    const candidatePayload = {
      name: candidateData.name,
      email: candidateData.email || null,
      resumeUrl: candidateData.resumeUrl || null,
      skills: candidateData.skills || [],
      experience: candidateData.experience ?? [],
      education: candidateData.education ?? [],
    };
    const applicationPayload = {
      matchScore: Math.round(matchData.score),
      justification: matchData.justification,
      ...atsApplicationFields(matchData),
    };

    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (matchData.fileName) {
          const existingByFile = await tx.application.findFirst({
            where: { jobId, fileName: matchData.fileName },
          });
          if (existingByFile) {
            const candidate = await tx.candidate.update({
              where: { id: existingByFile.candidateId },
              data: candidatePayload,
            });
            const application = await tx.application.update({
              where: { id: existingByFile.id },
              data: applicationPayload,
            });
            return { candidate, application };
          }
        }

        let candidate: Candidate | null = null;
        if (candidateData.email) {
          candidate = await tx.candidate.findFirst({
            where: { email: candidateData.email },
          });
        }

        if (candidate) {
          candidate = await tx.candidate.update({
            where: { id: candidate.id },
            data: candidatePayload,
          });
          const existingApp = await tx.application.findFirst({
            where: { jobId, candidateId: candidate.id },
          });
          if (existingApp) {
            const application = await tx.application.update({
              where: { id: existingApp.id },
              data: applicationPayload,
            });
            return { candidate, application };
          }
          const application = await tx.application.create({
            data: {
              jobId,
              candidateId: candidate.id,
              ...applicationPayload,
            },
          });
          return { candidate, application };
        }

        candidate = await tx.candidate.create({
          data: {
            ...(candidateData.id ? { id: candidateData.id } : {}),
            ...candidatePayload,
          },
        });

        const application = await tx.application.create({
          data: {
            jobId,
            candidateId: candidate.id,
            ...applicationPayload,
          },
        });

        return { candidate, application };
      });
    } catch (err) {
      console.error('Database persistence failed in saveCandidateEvaluation:', err);
      throw new Error('Could not save this review to the database.');
    }
  }

  async upsertParsedResume(
    candidateId: string,
    data: ParsedResumeWrite
  ): Promise<void> {
    try {
      const justification = data.justification?.trim() || '';
      const existing =
        (await prisma.parsedResume.findUnique({
          where: { contentHash: data.contentHash },
          select: { id: true, jobJustifications: true },
        })) ??
        (await prisma.parsedResume.findFirst({
          where: { candidateId, fileName: data.fileName },
          select: { id: true, jobJustifications: true },
        }));
      const previousJustifications =
        existing?.jobJustifications &&
        typeof existing.jobJustifications === 'object' &&
        !Array.isArray(existing.jobJustifications)
          ? (existing.jobJustifications as Record<string, unknown>)
          : {};
      const jobJustifications = data.jobId
        ? {
            ...previousJustifications,
            [data.jobId]: {
              jobId: data.jobId,
              jobTitle: data.jobTitle || '',
              justification,
              score: data.matchScore ?? 0,
              tier: data.tier || '',
            },
          }
        : previousJustifications;

      const payload = {
        candidateId,
        contentHash: data.contentHash,
        fileName: data.fileName,
        mimeType: data.mimeType ?? 'application/pdf',
        extractedText: data.extractedText,
        normalizedText: data.normalizedText ?? null,
        ...(justification ? { justification } : {}),
        jobJustifications: jobJustifications as Prisma.InputJsonValue,
        skills: data.skills as Prisma.InputJsonValue,
        workExperience: data.workExperience as Prisma.InputJsonValue,
        education: data.education as Prisma.InputJsonValue,
        totalYearsExperience: data.totalYearsExperience,
        highestSeniority: data.highestSeniority ?? null,
        source: data.source ?? 'upload',
      };

      if (existing) {
        await prisma.parsedResume.update({
          where: { id: existing.id },
          data: payload,
        });
        return;
      }

      await prisma.parsedResume.create({
        data: {
          ...payload,
          justification,
        },
      });
    } catch (err) {
      console.error('Database parsed-resume write failed:', err);
      throw new Error('Could not save the parsed resume.');
    }
  }

  /**
   * Create the default fullstack and frontend jobs when they are missing.
   */
  async ensureSeededJobs(): Promise<void> {
    try {
      const existing = await prisma.job.findMany({ select: { slug: true } });
      const slugs = new Set(existing.map((job) => job.slug));
      if (!slugs.has(FULLSTACK_JOB_SEED.slug)) {
        await prisma.job.create({ data: FULLSTACK_JOB_SEED });
      }
      if (!slugs.has(FRONTEND_JOB_SEED.slug)) {
        await prisma.job.create({ data: FRONTEND_JOB_SEED });
      }
    } catch (err) {
      console.warn('Could not ensure default job postings:', err);
    }
  }

  /**
   * List all available jobs.
   */
  async getAllJobs(): Promise<Job[]> {
    try {
      const jobs = await prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
      });
      if (jobs.length > 0) return jobs;
      return [DEFAULT_JOB_RECORD];
    } catch {
      return [DEFAULT_JOB_RECORD];
    }
  }
}

export const candidateRepository = new CandidateRepository();
