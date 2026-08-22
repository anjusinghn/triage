import 'dotenv/config';
import { prisma } from '../lib/prisma';

const FULLSTACK_DESCRIPTION = `We are looking for a hands-on Senior Full Stack Engineer who can turn ambiguous customer problems into reliable, high-performing features. You will make pragmatic tradeoffs that keep us shipping quickly while protecting quality and maintainability.

What you'll do:
- Lead customer-facing features across Next.js/React, Node.js, and PostgreSQL, from design through rollout.
- Own service contracts and API design; keep performance budgets realistic and visible.
- Mentor and unblock teammates through pairing, thoughtful code reviews, and short design docs.
- Instrument features with metrics, logs, and alerts; close the loop with incident reviews.
- Raise the bar on reliability with feature flags, progressive delivery, and targeted tests.
- Partner with GTM to scope feasibility for prospects and pilots without overpromising.`;

const FRONTEND_DESCRIPTION = `We need a frontend developer to lead the rebuild of our marketing site using Next.js.

Requirements:
- Expert Next.js and React knowledge
- Experience with headless CMS (Contentful, Sanity)
- Strong CSS/Tailwind skills
- Comfortable shipping production UI in TypeScript`;

async function main() {
  const fullstack = await prisma.job.upsert({
    where: { slug: 'fullstack' },
    create: {
      slug: 'fullstack',
      title: 'Senior Full Stack Engineer',
      description: FULLSTACK_DESCRIPTION,
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
    },
    update: {
      title: 'Senior Full Stack Engineer',
      description: FULLSTACK_DESCRIPTION,
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
    },
  });

  const frontend = await prisma.job.upsert({
    where: { slug: 'frontend' },
    create: {
      slug: 'frontend',
      title: 'Frontend Developer',
      description: FRONTEND_DESCRIPTION,
      department: 'Engineering',
      location: 'Remote',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 120000,
      salaryMax: 180000,
      requiredExperienceYears: 4,
      mustHaveSkills: ['Next.js', 'React', 'TypeScript'],
      niceToHaveSkills: ['Tailwind CSS', 'CSS', 'Headless CMS'],
    },
    update: {
      title: 'Frontend Developer',
      description: FRONTEND_DESCRIPTION,
      department: 'Engineering',
      location: 'Remote',
      locationType: 'hybrid',
      employmentType: 'full-time',
      salaryMin: 120000,
      salaryMax: 180000,
      requiredExperienceYears: 4,
      mustHaveSkills: ['Next.js', 'React', 'TypeScript'],
      niceToHaveSkills: ['Tailwind CSS', 'CSS', 'Headless CMS'],
    },
  });

  console.log('Upserted jobs:');
  console.log(`  ${fullstack.slug}: ${fullstack.title} (${fullstack.id})`);
  console.log(`  ${frontend.slug}: ${frontend.title} (${frontend.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
