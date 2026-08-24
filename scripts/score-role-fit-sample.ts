import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createJobInput, scoreCandidate } from '../src/ats-engine/index';

const dir = path.join(process.cwd(), 'data', 'generated-resumes');

const fullstack = createJobInput(
  'fs',
  'Senior Full Stack Engineer',
  'React TypeScript Node.js PostgreSQL REST APIs Git full stack',
  {
    mustHave: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'REST APIs', 'Git'],
    niceToHave: ['GraphQL', 'AWS', 'Docker'],
  },
  { requiredExperienceYears: 5 }
);

const frontend = createJobInput(
  'fe',
  'Frontend Developer',
  'Next.js React TypeScript Tailwind CMS marketing site',
  {
    mustHave: ['Next.js', 'React', 'TypeScript'],
    niceToHave: ['Tailwind CSS', 'CSS', 'Headless CMS'],
  },
  { requiredExperienceYears: 4 }
);

async function scoreFile(fileName, job) {
  const buffer = await readFile(path.join(dir, fileName));
  const out = await scoreCandidate({
    candidate: {
      name: fileName,
      email: '',
      phone: '',
      linkedinUrl: '',
      resumeBuffer: buffer,
      resumeMimeType: 'application/pdf',
      resumeFileName: fileName,
    },
    job,
  });
  return {
    fileName,
    score: out.core.overallScore,
    band: out.core.decisionBand,
    missing: out.core.missingCriticalSkills,
    skills: out.core.componentScores.skillsMatch,
  };
}

const files = [
  'resume_1_Maya_Chen.pdf',
  'resume_2_Jordan_Hale.pdf',
  'resume_3_Priya_Nair.pdf',
  'resume_4_Alex_Romero.pdf',
  'resume_5_Elena_Voss.pdf',
  'resume_6_Sam_Okonkwo.pdf',
  'resume_7_Riley_Cho.pdf',
  'resume_8_Harper_Quinn.pdf',
  'resume_9_Anita_Brooks.pdf',
  'resume_12_Marcus_Cole.pdf',
];

async function main() {
  const rows = [];
  for (const file of files) {
    const fs = await scoreFile(file, fullstack);
    const fe = await scoreFile(file, frontend);
    rows.push({ file, fullstack: fs, frontend: fe });
  }
  console.log(JSON.stringify(rows, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
