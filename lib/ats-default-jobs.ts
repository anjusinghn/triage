import type { ATSJobPosting } from '@/lib/ats-types';
import { DEFAULT_JOB_SLUG } from '@/lib/ats-types';

export const FULLSTACK_JOB_DESCRIPTION = `We are looking for a hands-on Senior Full Stack Engineer who can turn ambiguous customer problems into reliable, high-performing features. You will make pragmatic tradeoffs that keep us shipping quickly while protecting quality and maintainability.

What you'll do:
- Lead customer-facing features across Next.js/React, Node.js, and PostgreSQL, from design through rollout.
- Own service contracts and API design; keep performance budgets realistic and visible.
- Mentor and unblock teammates through pairing, thoughtful code reviews, and short design docs.
- Instrument features with metrics, logs, and alerts; close the loop with incident reviews.
- Raise the bar on reliability with feature flags, progressive delivery, and targeted tests.
- Partner with GTM to scope feasibility for prospects and pilots without overpromising.`;

export const FRONTEND_JOB_DESCRIPTION = `We need a frontend developer to lead the rebuild of our marketing site using Next.js.

Requirements:
- Expert Next.js and React knowledge
- Experience with headless CMS (Contentful, Sanity)
- Strong CSS/Tailwind skills
- Comfortable shipping production UI in TypeScript`;

export const FULLSTACK_JOB_SEED = {
  slug: DEFAULT_JOB_SLUG,
  title: 'Senior Full Stack Engineer',
  description: FULLSTACK_JOB_DESCRIPTION,
  department: 'Engineering',
  location: 'San Francisco, CA',
  locationType: 'hybrid',
  employmentType: 'full-time',
  salaryMin: 150000,
  salaryMax: 200000,
  requiredExperienceYears: 5,
  mustHaveSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'REST APIs', 'Git'],
  niceToHaveSkills: [
    'GraphQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'Redis',
    'MongoDB',
    'Next.js',
    'Python',
  ],
};

export const FRONTEND_JOB_SEED = {
  slug: 'frontend',
  title: 'Frontend Developer',
  description: FRONTEND_JOB_DESCRIPTION,
  department: 'Engineering',
  location: 'Remote',
  locationType: 'hybrid',
  employmentType: 'full-time',
  salaryMin: 120000,
  salaryMax: 180000,
  requiredExperienceYears: 4,
  mustHaveSkills: ['Next.js', 'React', 'TypeScript'],
  niceToHaveSkills: ['Tailwind CSS', 'CSS', 'Headless CMS'],
};

export function defaultFullstackJobPosting(id = 'default-job-id'): ATSJobPosting {
  return {
    id,
    slug: FULLSTACK_JOB_SEED.slug,
    title: FULLSTACK_JOB_SEED.title,
    department: FULLSTACK_JOB_SEED.department,
    location: FULLSTACK_JOB_SEED.location,
    locationType: 'hybrid',
    employmentType: 'full-time',
    salaryMin: FULLSTACK_JOB_SEED.salaryMin,
    salaryMax: FULLSTACK_JOB_SEED.salaryMax,
    experienceRequired: FULLSTACK_JOB_SEED.requiredExperienceYears,
    description: FULLSTACK_JOB_SEED.description,
    responsibilities: [],
    mustHaveSkills: FULLSTACK_JOB_SEED.mustHaveSkills,
    niceToHaveSkills: FULLSTACK_JOB_SEED.niceToHaveSkills,
    requiredEducation: "Bachelor's in Computer Science or related field",
    keywords: FULLSTACK_JOB_SEED.mustHaveSkills,
    createdAt: '2024-01-01T00:00:00.000Z',
  };
}
