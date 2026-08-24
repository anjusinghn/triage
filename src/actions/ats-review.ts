'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { scoreResumeWithFireworks, scoreResumeLocally, createJobInput } from '@/lib/ats-engine';
import { parseResume, getRecommendedAction } from '@/src/ats-engine/index';
import type { ATSEngineOutput, DecisionBand, JobInput } from '@/src/ats-engine/index';
import { peekInferenceRateLimit } from '@/lib/rate-limiter';
import {
  createAtsSession,
  getAtsSession,
  getAtsSessionResults,
  snapshotProgress,
} from '@/lib/ats-session';
import { candidateRepository } from '@/src/repositories/candidate.repository';
import type {
  ATSJobPosting,
  ATSJobWriteInput,
  CandidateTier,
  EmploymentType,
  LocationType,
  RecommendedAction,
  ReviewProgress,
  ReviewedCandidate,
} from '@/lib/ats-types';

const GENERATED_RESUMES_DIR = path.join(process.cwd(), 'data', 'generated-resumes');

async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim() || '127.0.0.1';
    }
    const realIp = headerList.get('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

function publicInferenceError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/too many|rate|quota|429/i.test(raw)) {
    return 'Too many AI reviews right now. Please wait and try again.';
  }
  if (/could not save/i.test(raw)) {
    return raw;
  }
  return 'AI review failed for this resume. Please try again.';
}

interface QueuedResume {
  candidateId: string;
  fileName: string;
  diskPath?: string;
  buffer?: Buffer;
  resumeUrl?: string | null;
}

function hashResumeBytes(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function isPdfFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf');
}

function nameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, '');
  const match = base.match(/^resume_\d+_(.+)$/i);
  const raw = match?.[1] ?? base;
  const named = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return named || 'Candidate';
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function asLocationType(value: string): LocationType {
  const normalized = value.toLowerCase();
  if (normalized === 'remote' || normalized === 'hybrid' || normalized === 'onsite') {
    return normalized;
  }
  return 'hybrid';
}

function asEmploymentType(value: string): EmploymentType {
  const normalized = value.toLowerCase().replace(/_/g, '-');
  if (normalized === 'full-time' || normalized === 'part-time' || normalized === 'contract') {
    return normalized;
  }
  return 'full-time';
}

function mapDecisionBandToTier(band: string): CandidateTier {
  switch (band) {
    case 'STRONG_MATCH':
      return 'top';
    case 'GOOD_MATCH':
      return 'qualified';
    case 'MODERATE_MATCH':
      return 'maybe';
    case 'WEAK_MATCH':
      return 'unqualified';
    case 'NO_MATCH':
      return 'rejected';
    default:
      return 'maybe';
  }
}

function mapRecommendedAction(action: string, band: DecisionBand): RecommendedAction {
  const normalized = action.toUpperCase();
  const fromEngine: Record<string, RecommendedAction> = {
    ADVANCE: 'ai_interview',
    REVIEW: 'manual_review',
    HOLD: 'hold',
    REJECT: 'reject',
  };
  if (fromEngine[normalized]) {
    return fromEngine[normalized];
  }
  return fromEngine[getRecommendedAction(band)] ?? 'manual_review';
}

function jobResponsibilities(description: string): string[] {
  return description
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-') || line.startsWith('•'))
    .map((line) => line.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function jobKeywords(job: {
  description: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
}): string[] {
  const fromSkills = [...job.mustHaveSkills, ...job.niceToHaveSkills].map((skill) =>
    skill.toLowerCase()
  );
  const fromDescription = job.description
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9.+#]/g, ''))
    .filter((word) => word.length > 4);
  return Array.from(new Set([...fromSkills, ...fromDescription])).slice(0, 16);
}

function mapJobToPosting(job: {
  id: string;
  slug: string;
  title: string;
  description: string;
  department: string;
  location: string;
  locationType: string;
  employmentType: string;
  salaryMin: number;
  salaryMax: number;
  requiredExperienceYears: number;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  createdAt: Date;
}): ATSJobPosting {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    department: job.department,
    location: job.location,
    locationType: asLocationType(job.locationType),
    employmentType: asEmploymentType(job.employmentType),
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    experienceRequired: job.requiredExperienceYears,
    description: job.description,
    responsibilities: jobResponsibilities(job.description),
    mustHaveSkills: job.mustHaveSkills,
    niceToHaveSkills: job.niceToHaveSkills,
    requiredEducation: "Bachelor's in Computer Science or related field",
    keywords: jobKeywords(job),
    createdAt: job.createdAt.toISOString(),
  };
}

function toJobInput(job: {
  id: string;
  title: string;
  description: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  requiredExperienceYears: number;
}): JobInput {
  return createJobInput(
    job.id,
    job.title,
    job.description,
    { mustHave: job.mustHaveSkills, niceToHave: job.niceToHaveSkills },
    { requiredExperienceYears: job.requiredExperienceYears }
  );
}

const GENERATED_RESUME_LIMIT = 30;

async function listGeneratedPdfFileNames(): Promise<string[]> {
  try {
    const entries = await readdir(GENERATED_RESUMES_DIR);
    return entries
      .filter(isPdfFileName)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .slice(0, GENERATED_RESUME_LIMIT);
  } catch {
    return [];
  }
}

function readExperienceBlob(value: unknown): {
  yearsOfExperience: number;
  currentRole: string;
  currentCompany: string;
} {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      yearsOfExperience: Number(record.yearsOfExperience) || 0,
      currentRole: String(record.currentRole || 'Candidate'),
      currentCompany: String(record.currentCompany || ''),
    };
  }
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object') {
    const first = value[0] as Record<string, unknown>;
    return {
      yearsOfExperience: 0,
      currentRole: String(first.role || first.title || 'Candidate'),
      currentCompany: String(first.company || ''),
    };
  }
  return { yearsOfExperience: 0, currentRole: 'Candidate', currentCompany: '' };
}

function readEducationBlob(
  value: unknown
): ReviewedCandidate['education'] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return {
      degree: String(record.degree || ''),
      field: String(record.field || ''),
      institution: String(record.institution || ''),
      year: Number(record.year ?? record.graduationYear) || 0,
    };
  });
}

function mapEngineOutputToCandidate(args: {
  candidateId: string;
  fileName: string;
  fallbackName: string;
  output: ATSEngineOutput;
}): ReviewedCandidate {
  const { candidateId, fileName, fallbackName, output } = args;
  const parsed = parseResume(output.normalizedText || output.extractedText || '');
  const current = parsed.workExperience[0];
  const yearsOfExperience =
    parsed.totalYearsExperience || output.explanation.keyHighlights.yearsOfExperience || 0;
  const skills =
    parsed.skills.map((skill) => skill.name).filter(Boolean).length > 0
      ? parsed.skills.map((skill) => skill.name)
      : output.explanation.keyHighlights.topSkills ?? [];
  const band = output.core.decisionBand;
  const atsScore = Math.round(output.core.overallScore);
  const skillMatch = Math.round(output.core.componentScores.skillsMatch);
  const experienceMatch = Math.round(output.core.componentScores.experienceRelevance);
  const domainFit = Math.round(output.core.componentScores.educationFit);
  const semanticFit = Math.round(output.core.componentScores.keywordCoverage);
  const concerns = [...output.explanation.gaps, ...output.explanation.riskFlags].filter(Boolean);

  return {
    id: candidateId,
    name: fallbackName,
    email: extractEmail(output.extractedText) || '',
    currentRole: current?.title || 'Candidate',
    currentCompany: current?.company || '',
    yearsOfExperience,
    skills,
    education: parsed.education.map((item) => ({
      degree: item.degree,
      field: item.field,
      institution: item.institution,
      year: item.graduationYear ?? 0,
    })),
    resumeText: output.extractedText || '',
    fileName,
    atsScore,
    skillMatch,
    experienceMatch,
    domainFit,
    semanticFit,
    overallFit: atsScore,
    tier: mapDecisionBandToTier(band),
    recommendedAction: mapRecommendedAction(output.decision.recommendedAction, band),
    strengths: output.explanation.strengths ?? [],
    concerns,
    aiSummary: output.explanation.summary,
    justification: output.explanation.summary,
  };
}

function mapApplicationToReviewedCandidate(application: {
  matchScore: number;
  justification: string;
  tier: string;
  skillMatch: number;
  experienceMatch: number;
  domainFit: number;
  semanticFit: number;
  strengths: string[];
  concerns: string[];
  recommendedAction: string;
  aiSummary: string | null;
  fileName: string | null;
  candidate: {
    id: string;
    name: string;
    email: string | null;
    skills: string[];
    experience: unknown;
    education: unknown;
    resumeUrl: string | null;
    parsedResumes?: Array<{
      fileName: string;
      extractedText: string;
      education: unknown;
    }>;
  };
}): ReviewedCandidate {
  const experience = readExperienceBlob(application.candidate.experience);
  const atsScore = Math.round(application.matchScore);
  const parsedResume =
    application.candidate.parsedResumes?.find((item) => item.fileName === application.fileName) ??
    application.candidate.parsedResumes?.[0];
  return {
    id: application.candidate.id,
    name: application.candidate.name,
    email: application.candidate.email || '',
    currentRole: experience.currentRole,
    currentCompany: experience.currentCompany,
    yearsOfExperience: experience.yearsOfExperience,
    skills: application.candidate.skills ?? [],
    education: parsedResume
      ? readEducationBlob(parsedResume.education)
      : readEducationBlob(application.candidate.education),
    resumeText: parsedResume?.extractedText || application.aiSummary || application.justification || '',
    fileName: application.fileName ?? undefined,
    atsScore,
    skillMatch: application.skillMatch,
    experienceMatch: application.experienceMatch,
    domainFit: application.domainFit,
    semanticFit: application.semanticFit,
    overallFit: atsScore,
    tier: (application.tier as CandidateTier) || 'maybe',
    recommendedAction: application.recommendedAction,
    strengths: application.strengths ?? [],
    concerns: application.concerns ?? [],
    aiSummary: application.aiSummary ?? application.justification,
    justification: application.justification || application.aiSummary || '',
  };
}

async function persistReviewedCandidate(
  jobId: string,
  reviewed: ReviewedCandidate,
  extras: {
    resumeUrl?: string | null;
    contentHash: string;
    extractedText: string;
    normalizedText?: string | null;
    source: string;
  }
): Promise<ReviewedCandidate> {
  const parsed = parseResume(extras.extractedText || extras.normalizedText || '');
  const saved = await candidateRepository.saveCandidateEvaluation({
    candidateData: {
      id: reviewed.id,
      name: reviewed.name,
      email: reviewed.email || null,
      resumeUrl: extras.resumeUrl ?? null,
      skills: reviewed.skills,
      experience: {
        yearsOfExperience: reviewed.yearsOfExperience,
        currentRole: reviewed.currentRole,
        currentCompany: reviewed.currentCompany,
      },
      education: reviewed.education,
    },
    matchData: {
      score: reviewed.atsScore,
      justification: reviewed.aiSummary || reviewed.justification || reviewed.recommendedAction,
      tier: reviewed.tier,
      skillMatch: reviewed.skillMatch,
      experienceMatch: reviewed.experienceMatch,
      domainFit: reviewed.domainFit,
      semanticFit: reviewed.semanticFit,
      strengths: reviewed.strengths,
      concerns: reviewed.concerns,
      recommendedAction: reviewed.recommendedAction,
      aiSummary: reviewed.aiSummary ?? null,
      fileName: reviewed.fileName ?? null,
    },
    jobId,
  });

  await candidateRepository.upsertParsedResume(saved.candidate.id, {
    contentHash: extras.contentHash,
    fileName: reviewed.fileName || 'resume.pdf',
    extractedText: extras.extractedText,
    normalizedText: extras.normalizedText ?? null,
    skills: parsed.skills,
    workExperience: parsed.workExperience,
    education: parsed.education,
    totalYearsExperience: parsed.totalYearsExperience,
    highestSeniority: parsed.highestSeniority ?? null,
    source: extras.source,
  });

  return {
    ...reviewed,
    id: saved.candidate.id,
    resumeText: extras.extractedText || reviewed.resumeText,
  };
}

async function processQueuedResume(
  sessionId: string,
  jobInput: JobInput,
  item: QueuedResume,
  options?: { skipLlm?: boolean }
): Promise<void> {
  const session = getAtsSession(sessionId);
  if (!session) return;

  const progressItem = session.progress.candidates.find(
    (candidate) => candidate.candidateId === item.candidateId
  );
  const fallbackName = nameFromFileName(item.fileName);

  if (progressItem) {
    progressItem.status = 'processing';
  }
  session.progress.currentCandidate = {
    candidateId: item.candidateId,
    candidateName: fallbackName,
    status: 'processing',
    step: 'Running ATS analysis',
  };

  try {
    const resumeBuffer =
      item.buffer ?? (item.diskPath ? await readFile(item.diskPath) : undefined);
    if (!resumeBuffer) {
      throw new Error(`Resume bytes missing for ${item.fileName}`);
    }

    const output = options?.skipLlm
      ? await scoreResumeLocally({
          candidateName: fallbackName,
          resumeBuffer,
          resumeFileName: item.fileName,
          job: jobInput,
        })
      : await scoreResumeWithFireworks({
          candidateName: fallbackName,
          resumeBuffer,
          resumeFileName: item.fileName,
          job: jobInput,
          clientIp: session.clientIp,
        });

    let reviewed = mapEngineOutputToCandidate({
      candidateId: item.candidateId,
      fileName: item.fileName,
      fallbackName,
      output,
    });
    reviewed = await persistReviewedCandidate(session.jobId, reviewed, {
      resumeUrl: item.resumeUrl,
      contentHash: hashResumeBytes(resumeBuffer),
      extractedText: output.extractedText || '',
      normalizedText: output.normalizedText || null,
      source: item.diskPath ? 'generated' : 'upload',
    });

    if (progressItem) {
      progressItem.status = 'completed';
      progressItem.candidateName = reviewed.name;
      progressItem.atsScore = reviewed.atsScore;
      progressItem.tier = reviewed.tier;
      progressItem.error = undefined;
    }
    session.progress.completedCount += 1;
    session.progress.currentCandidate = {
      candidateId: reviewed.id,
      candidateName: reviewed.name,
      status: 'completed',
      atsScore: reviewed.atsScore,
      tier: reviewed.tier,
    };
    session.results.push(reviewed);
  } catch (err) {
    const message = publicInferenceError(err);
    if (progressItem) {
      progressItem.status = 'failed';
      progressItem.error = message;
    }
    session.progress.failedCount += 1;
    session.progress.currentCandidate = {
      candidateId: item.candidateId,
      candidateName: fallbackName,
      status: 'failed',
      error: message,
    };
  } finally {
    session.progress.processedCount += 1;
    session.progress.elapsedTimeMs = Date.now() - session.startedAt;
  }
}

async function runAtsReview(
  sessionId: string,
  jobInput: JobInput,
  queue: QueuedResume[],
  options?: { skipLlm?: boolean }
) {
  const session = getAtsSession(sessionId);
  if (!session) return;

  session.progress.status = 'running';

  try {
    for (const item of queue) {
      await processQueuedResume(sessionId, jobInput, item, options);
    }
    session.progress.status = 'completed';
    session.progress.currentCandidate = undefined;
    session.progress.elapsedTimeMs = Date.now() - session.startedAt;
  } catch (err) {
    session.progress.status = 'failed';
    session.progress.currentCandidate = undefined;
    session.progress.elapsedTimeMs = Date.now() - session.startedAt;
    console.error('ATS review session failed');
  }
}

const SEEDED_SLUG_ORDER: Record<string, number> = {
  fullstack: 0,
  frontend: 1,
};

function sortJobPostings(jobs: ATSJobPosting[]): ATSJobPosting[] {
  return [...jobs].sort((a, b) => {
    const orderA = SEEDED_SLUG_ORDER[a.slug] ?? 2;
    const orderB = SEEDED_SLUG_ORDER[b.slug] ?? 2;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
}

function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const skill of skills) {
    const trimmed = skill.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function normalizeJobWrite(input: ATSJobWriteInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) {
    throw new Error('Enter a position title.');
  }
  if (!description) {
    throw new Error('Enter a job description.');
  }

  const mustHaveSkills = uniqueSkills(input.mustHaveSkills);
  if (mustHaveSkills.length === 0) {
    throw new Error('Add at least one must-have skill.');
  }

  const location = input.location.trim() || 'Remote';
  const salaryMin = Math.max(0, Math.round(input.salaryMin));
  const salaryMax = Math.max(salaryMin, Math.round(input.salaryMax));

  return {
    title,
    description,
    mustHaveSkills,
    niceToHaveSkills: uniqueSkills(input.niceToHaveSkills),
    requiredExperienceYears: Math.min(40, Math.max(0, Math.round(input.requiredExperienceYears))),
    department: input.department?.trim() || 'Engineering',
    location,
    locationType: asLocationType(input.locationType),
    employmentType: asEmploymentType(input.employmentType),
    salaryMin,
    salaryMax,
  };
}

export async function getAtsJobs(): Promise<ATSJobPosting[]> {
  const jobs = await candidateRepository.getAllJobs();
  return sortJobPostings(jobs.map(mapJobToPosting));
}

export async function createAtsJob(input: ATSJobWriteInput): Promise<ATSJobPosting> {
  try {
    const data = normalizeJobWrite(input);
    const job = await candidateRepository.createJob(data);
    return mapJobToPosting(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.startsWith('Enter a') || message.startsWith('Add at least')) {
      throw err;
    }
    throw new Error('Could not save this position.');
  }
}

export async function updateAtsJob(
  jobId: string,
  input: ATSJobWriteInput
): Promise<ATSJobPosting> {
  try {
    if (!jobId.trim()) {
      throw new Error('Select a target position.');
    }
    const data = normalizeJobWrite(input);
    const job = await candidateRepository.updateJob(jobId, data);
    return mapJobToPosting(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (
      message.startsWith('Enter a') ||
      message.startsWith('Add at least') ||
      message.startsWith('Select a')
    ) {
      throw err;
    }
    throw new Error('Could not save this position.');
  }
}

export async function deleteAtsJob(jobId: string): Promise<{ deletedId: string }> {
  try {
    const jobs = await candidateRepository.getAllJobs();
    if (jobs.length <= 1) {
      throw new Error('Keep at least one target position.');
    }
    const existing = jobs.find((job) => job.id === jobId);
    if (!existing) {
      throw new Error('Position not found.');
    }
    const deleted = await candidateRepository.deleteJob(jobId);
    if (!deleted) {
      throw new Error('Could not delete this position.');
    }
    return { deletedId: jobId };
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (
      message.startsWith('Keep at least') ||
      message.startsWith('Position not found') ||
      message.startsWith('Could not delete')
    ) {
      throw err;
    }
    throw new Error('Could not delete this position.');
  }
}

export async function listGeneratedResumes(): Promise<{ fileName: string; count: number }> {
  const fileNames = await listGeneratedPdfFileNames();
  return {
    fileName: 'data/generated-resumes/*.pdf',
    count: fileNames.length,
  };
}

export async function startAtsReview(input: {
  jobId: string;
  attachGeneratedResumes: boolean;
  files?: File[];
}): Promise<{
  sessionId: string;
  status: 'running' | 'completed';
  results: ReviewedCandidate[];
}> {
  try {
  if (!input.jobId?.trim()) {
    throw new Error('Select a target position.');
  }

  const job = await prisma.job.findUnique({ where: { id: input.jobId } });
  if (!job) {
    throw new Error('Select a target position.');
  }

  const seen = new Set<string>();
  const queue: QueuedResume[] = [];

  if (input.attachGeneratedResumes) {
    const generated = await listGeneratedPdfFileNames();
    for (const fileName of generated) {
      const key = fileName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({
        candidateId: randomUUID(),
        fileName,
        diskPath: path.join(GENERATED_RESUMES_DIR, fileName),
        resumeUrl: path.join('data', 'generated-resumes', fileName),
      });
    }
  }

  if (input.files?.length) {
    for (const file of input.files) {
      if (!file || typeof file.arrayBuffer !== 'function') continue;
      if (!isPdfFileName(file.name) && file.type !== 'application/pdf') continue;
      const key = file.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length === 0) continue;
      queue.push({
        candidateId: randomUUID(),
        fileName: file.name,
        buffer,
        resumeUrl: null,
      });
    }
  }

  const generatedOnly = Boolean(input.attachGeneratedResumes) && !input.files?.length;

  if (generatedOnly) {
    const past = await getLatestResultsForJob(job.id);
    if (past.length > 0) {
      const sessionId = randomUUID();
      const startedAt = Date.now();
      createAtsSession({
        sessionId,
        jobId: job.id,
        jobTitle: job.title,
        startedAt,
        clientIp: await getClientIp(),
        progress: {
          sessionId,
          jobId: job.id,
          jobTitle: job.title,
          status: 'completed',
          totalCandidates: past.length,
          processedCount: past.length,
          completedCount: past.length,
          failedCount: 0,
          candidates: past.map((candidate) => ({
            candidateId: candidate.id,
            candidateName: candidate.name,
            fileName: candidate.fileName || `${candidate.name}.pdf`,
            status: 'completed',
            atsScore: candidate.atsScore,
            tier: candidate.tier,
          })),
          elapsedTimeMs: 0,
        },
        results: past,
      });
      return { sessionId, status: 'completed', results: past };
    }
  }

  if (queue.length === 0) {
    throw new Error('Add at least one resume to start an AI review.');
  }

  const skipLlm = generatedOnly;
  const clientIp = await getClientIp();

  if (!skipLlm) {
    const quota = peekInferenceRateLimit(clientIp, false, queue.length);
    if (!quota.allowed) {
      throw new Error(quota.message || 'Too many AI reviews right now. Please wait and try again.');
    }
  }

  const sessionId = randomUUID();
  const startedAt = Date.now();
  const progress: ReviewProgress = {
    sessionId,
    jobId: job.id,
    jobTitle: job.title,
    status: 'running',
    totalCandidates: queue.length,
    processedCount: 0,
    completedCount: 0,
    failedCount: 0,
    candidates: queue.map((item) => ({
      candidateId: item.candidateId,
      candidateName: nameFromFileName(item.fileName),
      fileName: item.fileName,
      status: 'pending',
    })),
    elapsedTimeMs: 0,
  };

  createAtsSession({
    sessionId,
    jobId: job.id,
    jobTitle: job.title,
    startedAt,
    clientIp,
    progress,
    results: [],
  });

  const jobInput = toJobInput(job);

  if (skipLlm) {
    await runAtsReview(sessionId, jobInput, queue, { skipLlm: true });
    const session = getAtsSession(sessionId);
    const results = getAtsSessionResults(sessionId);
    return {
      sessionId,
      status: session?.progress.status === 'failed' ? 'running' : 'completed',
      results,
    };
  }

  after(() => runAtsReview(sessionId, jobInput, queue));

  return { sessionId, status: 'running', results: [] };
  } catch (err) {
    const raw = err instanceof Error ? err.message : '';
    if (
      raw.startsWith('Select ') ||
      raw.startsWith('Add at least') ||
      raw.startsWith('Enter a') ||
      raw.startsWith('Keep at least') ||
      raw.startsWith('Position not found') ||
      raw.startsWith('Job not found') ||
      raw.startsWith('Too many')
    ) {
      throw err;
    }
    throw new Error('Could not start AI review. Please try again.');
  }
}

export async function getAtsReviewProgress(sessionId: string): Promise<ReviewProgress | null> {
  const session = getAtsSession(sessionId);
  if (!session) return null;
  return snapshotProgress(session);
}

export async function getAtsReviewResults(sessionId: string): Promise<ReviewedCandidate[]> {
  return getAtsSessionResults(sessionId);
}

export async function getLatestResultsForJob(jobId: string): Promise<ReviewedCandidate[]> {
  try {
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          include: {
            parsedResumes: {
              orderBy: { updatedAt: 'desc' },
            },
          },
        },
      },
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
    });
    return applications.map(mapApplicationToReviewedCandidate);
  } catch (err) {
    console.warn('Failed to load latest ATS results for job:', err);
    return [];
  }
}
