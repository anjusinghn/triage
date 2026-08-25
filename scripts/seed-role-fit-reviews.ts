import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { createJobInput, scoreResumeLocally } from '../lib/ats-engine';
import { parseResume } from '../src/ats-engine/index';
import { candidateRepository } from '../src/repositories/candidate.repository';

const GENERATED_RESUMES_DIR = path.join(process.cwd(), 'data', 'generated-resumes');
const LIMIT = 30;

function nameFromFileName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, '');
  const match = base.match(/^resume_\d+_(.+)$/i);
  const raw = match?.[1] ?? base;
  return raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Candidate';
}

function extractEmail(text: string): string | undefined {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
}

function bandToTier(band: string): string {
  switch (band) {
    case 'STRONG_MATCH':
      return 'top';
    case 'GOOD_MATCH':
      return 'qualified';
    case 'MODERATE_MATCH':
      return 'maybe';
    case 'WEAK_MATCH':
      return 'unqualified';
    default:
      return 'rejected';
  }
}

async function listPdfs(): Promise<string[]> {
  const entries = await readdir(GENERATED_RESUMES_DIR);
  return entries
    .filter((name) => name.toLowerCase().endsWith('.pdf'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .slice(0, LIMIT);
}

async function reviewJob(job: {
  id: string;
  slug: string;
  title: string;
  description: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  requiredExperienceYears: number;
}) {
  const jobInput = createJobInput(
    job.id,
    job.title,
    job.description,
    { mustHave: job.mustHaveSkills, niceToHave: job.niceToHaveSkills },
    { requiredExperienceYears: job.requiredExperienceYears }
  );
  const files = await listPdfs();
  const shortlisted: string[] = [];

  for (const fileName of files) {
    const buffer = await readFile(path.join(GENERATED_RESUMES_DIR, fileName));
    const fallbackName = nameFromFileName(fileName);
    const output = await scoreResumeLocally({
      candidateName: fallbackName,
      resumeBuffer: buffer,
      resumeFileName: fileName,
      job: jobInput,
    });
    const parsed = parseResume(output.normalizedText || output.extractedText || '');
    const current = parsed.workExperience[0];
    const atsScore = Math.round(output.core.overallScore);
    const tier = bandToTier(output.core.decisionBand);
    const summary = output.explanation.summary;
    const saved = await candidateRepository.saveCandidateEvaluation({
      candidateData: {
        id: randomUUID(),
        name: fallbackName,
        email: extractEmail(output.extractedText) || null,
        resumeUrl: path.join('data', 'generated-resumes', fileName),
        skills:
          parsed.skills.map((skill) => skill.name).filter(Boolean).length > 0
            ? parsed.skills.map((skill) => skill.name)
            : output.explanation.keyHighlights.topSkills ?? [],
        experience: {
          yearsOfExperience:
            parsed.totalYearsExperience || output.explanation.keyHighlights.yearsOfExperience || 0,
          currentRole: current?.title || 'Candidate',
          currentCompany: current?.company || '',
        },
        education: parsed.education.map((item) => ({
          degree: item.degree,
          field: item.field,
          institution: item.institution,
          year: item.graduationYear ?? 0,
        })),
      },
      matchData: {
        score: atsScore,
        justification: summary,
        tier,
        skillMatch: Math.round(output.core.componentScores.skillsMatch),
        experienceMatch: Math.round(output.core.componentScores.experienceRelevance),
        domainFit: Math.round(output.core.componentScores.educationFit),
        semanticFit: Math.round(output.core.componentScores.keywordCoverage),
        strengths: output.explanation.strengths ?? [],
        concerns: [...output.explanation.gaps, ...output.explanation.riskFlags],
        recommendedAction: 'manual_review',
        aiSummary: summary,
        fileName,
      },
      jobId: job.id,
    });
    await candidateRepository.upsertParsedResume(saved.candidate.id, {
      contentHash: createHash('sha256').update(buffer).digest('hex'),
      fileName,
      extractedText: output.extractedText || '',
      normalizedText: output.normalizedText || null,
      justification: summary,
      jobId: job.id,
      jobTitle: job.title,
      matchScore: atsScore,
      tier,
      skills: parsed.skills,
      workExperience: parsed.workExperience,
      education: parsed.education,
      totalYearsExperience: parsed.totalYearsExperience,
      highestSeniority: parsed.highestSeniority ?? null,
      source: 'generated',
    });
    if (tier === 'top' || tier === 'qualified') {
      shortlisted.push(`${fallbackName} (${atsScore})`);
    }
  }

  console.log(`${job.slug}: shortlisted ${shortlisted.length} -> ${shortlisted.join(', ')}`);
}

async function main() {
  const jobs = await prisma.job.findMany({
    where: { slug: { in: ['fullstack', 'frontend'] } },
  });
  if (jobs.length < 2) {
    throw new Error('Seed the fullstack and frontend jobs first (pnpm exec tsx prisma/seed.ts).');
  }
  for (const job of jobs.sort((a, b) => a.slug.localeCompare(b.slug))) {
    await reviewJob(job);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
