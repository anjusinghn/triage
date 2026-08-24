import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'data', 'generated-resumes');

function escapePdfText(value) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(line, max = 88) {
  const text = String(line).replace(/[^\x20-\x7E]/g, '?');
  if (text.length <= max) return [text];
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= max) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    if (word.length > max) {
      for (let i = 0; i < word.length; i += max) {
        lines.push(word.slice(i, i + max));
      }
      current = '';
    } else {
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSimplePdf(lines) {
  const wrapped = [];
  for (const line of lines) {
    if (line === '') wrapped.push('');
    else wrapped.push(...wrapLine(line));
  }

  const ops = ['BT', '/F1 11 Tf', '50 750 Td'];
  for (let i = 0; i < wrapped.length; i++) {
    if (i > 0) ops.push('0 -14 Td');
    ops.push(`(${escapePdfText(wrapped[i])}) Tj`);
  }
  ops.push('ET');
  const stream = `${ops.join('\n')}\n`;

  const bodies = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < bodies.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${bodies[i]}\nendobj\n`;
  }
  const xrefPos = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${bodies.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

async function writeResumePdf(dest, lines) {
  await writeFile(dest, buildSimplePdf(lines));
}

function resumeLines(profile) {
  return [
    profile.name.toUpperCase(),
    `${profile.email} | ${profile.phone} | ${profile.location}`,
    '',
    'SUMMARY',
    profile.summary,
    '',
    'SKILLS',
    profile.skills,
    '',
    'EXPERIENCE',
    ...profile.experience.flatMap((job) => [
      `${job.title} | ${job.company} | ${job.dates}`,
      ...job.bullets.map((bullet) => `- ${bullet}`),
      '',
    ]),
    'EDUCATION',
    profile.education,
    profile.extraDegree ? profile.extraDegree : '',
  ];
}

const fullstackFit = [
  {
    file: 'resume_1_Maya_Chen.pdf',
    name: 'Maya Chen',
    email: 'maya.chen@email.com',
    phone: '415-555-0142',
    location: 'San Francisco, CA',
    summary:
      'Senior Full Stack Engineer with 8 years building customer-facing products in React, TypeScript, Node.js, and PostgreSQL. Owns REST APIs, Git workflows, and production delivery.',
    skills:
      'React, TypeScript, Node.js, PostgreSQL, REST APIs, Git, Docker, Redis, GraphQL, AWS',
    experience: [
      {
        title: 'Senior Full Stack Engineer',
        company: 'Northstar Labs',
        dates: '2019 - Present',
        bullets: [
          'Lead React and TypeScript features on a Node.js and PostgreSQL stack, shipping REST APIs used by 200k monthly users.',
          'Mentored engineers through Git code reviews, pairing, and short design docs.',
          'Added metrics, feature flags, and progressive delivery to keep reliability high.',
        ],
      },
      {
        title: 'Full Stack Engineer',
        company: 'Harbor Software',
        dates: '2017 - 2019',
        bullets: [
          'Built Node.js REST APIs and React dashboards against PostgreSQL.',
          'Used Git, CI, and TypeScript to keep a 6-person team shipping weekly.',
        ],
      },
    ],
    education: 'B.S. Computer Science, UC San Diego, 2017',
  },
  {
    file: 'resume_2_Jordan_Hale.pdf',
    name: 'Jordan Hale',
    email: 'jordan.hale@email.com',
    phone: '628-555-0190',
    location: 'Oakland, CA',
    summary:
      'Hands-on Senior Full Stack Engineer (7 years) who turns ambiguous product problems into React, TypeScript, Node.js, and PostgreSQL features. Strong REST APIs and Git discipline.',
    skills: 'React, TypeScript, Node.js, PostgreSQL, REST APIs, Git, Python, Redis, Docker',
    experience: [
      {
        title: 'Senior Full Stack Engineer',
        company: 'Kepler Health',
        dates: '2020 - Present',
        bullets: [
          'Delivered React and TypeScript product surfaces backed by Node.js REST APIs and PostgreSQL.',
          'Owned service contracts, Git branching, and pragmatic tests.',
          'Instrumented APIs with logs and alerts; closed incidents with reviews.',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Brightline',
        dates: '2018 - 2020',
        bullets: [
          'Wrote TypeScript services on Node.js with PostgreSQL and REST APIs.',
          'Shipped React UI and used Git daily.',
        ],
      },
    ],
    education: 'B.S. Software Engineering, Cal Poly, 2018',
  },
  {
    file: 'resume_3_Priya_Nair.pdf',
    name: 'Priya Nair',
    email: 'priya.nair@email.com',
    phone: '510-555-0177',
    location: 'San Jose, CA',
    summary:
      'Full stack engineer with 6 years on React, TypeScript, Node.js, PostgreSQL, REST APIs, and Git. Comfortable mentoring and making delivery tradeoffs.',
    skills: 'React, TypeScript, Node.js, PostgreSQL, REST APIs, Git, GraphQL, AWS, Docker',
    experience: [
      {
        title: 'Full Stack Engineer',
        company: 'Atlas Freight',
        dates: '2019 - Present',
        bullets: [
          'Built React and TypeScript customer portals on Node.js REST APIs with PostgreSQL.',
          'Used Git, code review, and pairing to keep quality high.',
          'Tuned PostgreSQL queries and Node.js performance budgets.',
        ],
      },
      {
        title: 'Junior Software Engineer',
        company: 'Oak Systems',
        dates: '2018 - 2019',
        bullets: [
          'Implemented REST APIs in Node.js and UI in React and TypeScript.',
          'Learned Git workflows and PostgreSQL schema design.',
        ],
      },
    ],
    education: 'B.S. Computer Science, San Jose State, 2018',
  },
  {
    file: 'resume_4_Alex_Romero.pdf',
    name: 'Alex Romero',
    email: 'alex.romero@email.com',
    phone: '415-555-0118',
    location: 'San Francisco, CA',
    summary:
      'Senior Full Stack Engineer, 9 years. React, TypeScript, Node.js, PostgreSQL, REST APIs, and Git. Ships reliable features and unblocks teammates.',
    skills: 'React, TypeScript, Node.js, PostgreSQL, REST APIs, Git, Kubernetes, Redis, AWS',
    experience: [
      {
        title: 'Senior Full Stack Engineer',
        company: 'Pilot Commerce',
        dates: '2018 - Present',
        bullets: [
          'Led React and TypeScript storefront work with Node.js REST APIs and PostgreSQL.',
          'Established Git conventions, design docs, and on-call for the full stack team.',
          'Partnered with GTM on feasibility without overpromising.',
        ],
      },
      {
        title: 'Software Engineer',
        company: 'Redwood Apps',
        dates: '2016 - 2018',
        bullets: [
          'Delivered Node.js services, PostgreSQL schemas, and React TypeScript UI.',
          'Used REST APIs and Git across all projects.',
        ],
      },
    ],
    education: 'M.S. Computer Science, Stanford, 2016',
  },
];

const frontendFit = [
  {
    file: 'resume_5_Elena_Voss.pdf',
    name: 'Elena Voss',
    email: 'elena.voss@email.com',
    phone: '206-555-0133',
    location: 'Remote',
    summary:
      'Frontend developer with 6 years leading marketing-site rebuilds in Next.js, React, and TypeScript. Strong Tailwind CSS and headless CMS (Contentful, Sanity).',
    skills: 'Next.js, React, TypeScript, Tailwind CSS, CSS, Contentful, Sanity, Git',
    experience: [
      {
        title: 'Senior Frontend Developer',
        company: 'Lumen Marketing',
        dates: '2020 - Present',
        bullets: [
          'Led a Next.js and React rebuild of the marketing site in TypeScript.',
          'Implemented Tailwind CSS design system and Contentful headless CMS models.',
          'Shipped production UI weekly with Sanity previews and CSS performance budgets.',
        ],
      },
      {
        title: 'Frontend Developer',
        company: 'Cove Studio',
        dates: '2018 - 2020',
        bullets: [
          'Built React and TypeScript landing pages with Tailwind CSS.',
          'Integrated Sanity CMS for editors; maintained Next.js app router pages.',
        ],
      },
    ],
    education: 'B.A. Interaction Design, University of Washington, 2018',
  },
  {
    file: 'resume_6_Sam_Okonkwo.pdf',
    name: 'Sam Okonkwo',
    email: 'sam.okonkwo@email.com',
    phone: '347-555-0164',
    location: 'Remote',
    summary:
      'Senior frontend engineer, 7 years. Expert Next.js, React, and TypeScript. Ships production UI with Tailwind CSS and headless CMS (Contentful).',
    skills: 'Next.js, React, TypeScript, Tailwind CSS, CSS, Contentful, Accessibility, Git',
    experience: [
      {
        title: 'Senior Frontend Engineer',
        company: 'Northwind Media',
        dates: '2019 - Present',
        bullets: [
          'Rebuilt the marketing site in Next.js, React, and TypeScript.',
          'Contentful CMS, Tailwind CSS, and production CSS architecture.',
          'Comfortable shipping production UI with design partners.',
        ],
      },
      {
        title: 'UI Engineer',
        company: 'Paperclip',
        dates: '2017 - 2019',
        bullets: [
          'React and TypeScript component libraries; later migrated pages to Next.js.',
          'Tailwind CSS utility systems and CMS-driven pages.',
        ],
      },
    ],
    education: 'B.S. Information Systems, NYU, 2017',
  },
  {
    file: 'resume_7_Riley_Cho.pdf',
    name: 'Riley Cho',
    email: 'riley.cho@email.com',
    phone: '503-555-0188',
    location: 'Portland, OR',
    summary:
      'Frontend developer specializing in Next.js, React, and TypeScript for 5 years. Tailwind CSS, CSS, Sanity and Contentful headless CMS.',
    skills: 'Next.js, React, TypeScript, Tailwind CSS, CSS, Sanity, Contentful',
    experience: [
      {
        title: 'Frontend Developer',
        company: 'Fieldstone',
        dates: '2021 - Present',
        bullets: [
          'Shipped production Next.js and React UI in TypeScript.',
          'Tailwind CSS and CSS modules; Sanity CMS for marketing content.',
          'Worked with brand teams on Contentful migrations.',
        ],
      },
      {
        title: 'Junior Frontend Developer',
        company: 'Orbit Sites',
        dates: '2019 - 2021',
        bullets: [
          'React and TypeScript pages; introduced Next.js for SEO.',
          'CSS and Tailwind CSS for campaign microsites.',
        ],
      },
    ],
    education: 'B.S. Computer Science, University of Oregon, 2019',
  },
  {
    file: 'resume_8_Harper_Quinn.pdf',
    name: 'Harper Quinn',
    email: 'harper.quinn@email.com',
    phone: '512-555-0104',
    location: 'Austin, TX',
    summary:
      'Frontend developer, 8 years. Next.js, React, TypeScript expert. Strong Tailwind CSS and headless CMS (Contentful, Sanity). Ships production marketing UI.',
    skills: 'Next.js, React, TypeScript, Tailwind CSS, CSS, Contentful, Sanity, Figma',
    experience: [
      {
        title: 'Lead Frontend Developer',
        company: 'Marble Brand',
        dates: '2018 - Present',
        bullets: [
          'Led Next.js and React TypeScript rebuild of a high-traffic marketing site.',
          'Headless CMS on Contentful and Sanity; Tailwind CSS design tokens.',
          'Production CSS, performance, and accessibility for shipped UI.',
        ],
      },
      {
        title: 'Frontend Developer',
        company: 'Sundial',
        dates: '2016 - 2018',
        bullets: [
          'React and TypeScript UI; later Next.js for the public site.',
          'CSS architecture before adopting Tailwind CSS.',
        ],
      },
    ],
    education: 'B.F.A. Graphic Design, UT Austin, 2016',
  },
];

const fillers = [
  {
    file: 'resume_9_Anita_Brooks.pdf',
    name: 'Anita Brooks',
    email: 'anita.brooks@email.com',
    phone: '312-555-0191',
    location: 'Chicago, IL',
    summary: 'Registered nurse with 10 years of acute care experience. No software engineering background.',
    skills: 'Patient care, EMR, ACLS, Charge nurse, HIPAA',
    experience: [
      {
        title: 'Registered Nurse',
        company: 'Lakeside Hospital',
        dates: '2016 - Present',
        bullets: ['Managed med-surg unit workflows and EMR documentation.', 'Trained new graduates on clinical protocols.'],
      },
    ],
    education: 'B.S. Nursing, University of Illinois, 2015',
  },
  {
    file: 'resume_10_Derek_Lang.pdf',
    name: 'Derek Lang',
    email: 'derek.lang@email.com',
    phone: '214-555-0120',
    location: 'Dallas, TX',
    summary: 'Enterprise account executive focused on SaaS quota attainment. Not a software developer.',
    skills: 'Salesforce, MEDDIC, Negotiation, Pipeline, Excel',
    experience: [
      {
        title: 'Account Executive',
        company: 'CloudQuota',
        dates: '2019 - Present',
        bullets: ['Closed six-figure ARR deals.', 'Forecasted pipeline in Salesforce.'],
      },
    ],
    education: 'B.B.A. Marketing, SMU, 2018',
  },
  {
    file: 'resume_11_Helen_Wu.pdf',
    name: 'Helen Wu',
    email: 'helen.wu@email.com',
    phone: '917-555-0155',
    location: 'New York, NY',
    summary: 'Corporate accountant. Excel and GAAP, not web engineering.',
    skills: 'GAAP, Excel, QuickBooks, Month-end close, SOX',
    experience: [
      {
        title: 'Staff Accountant',
        company: 'Pinnacle Foods',
        dates: '2018 - Present',
        bullets: ['Owned month-end close and reconciliations.', 'Supported audit with SOX evidence.'],
      },
    ],
    education: 'B.S. Accounting, Baruch College, 2018',
  },
  {
    file: 'resume_12_Marcus_Cole.pdf',
    name: 'Marcus Cole',
    email: 'marcus.cole@email.com',
    phone: '404-555-0172',
    location: 'Atlanta, GA',
    summary: 'Java backend engineer. Spring Boot and Kafka for payments services. Does not ship browser product UI.',
    skills: 'Java, Spring Boot, Kafka, MySQL, Jenkins',
    experience: [
      {
        title: 'Backend Engineer',
        company: 'Ledger Bank',
        dates: '2017 - Present',
        bullets: ['Built Spring Boot services and Kafka consumers.', 'Tuned MySQL for payments batch jobs.'],
      },
    ],
    education: 'B.S. Computer Science, Georgia Tech, 2017',
  },
  {
    file: 'resume_13_Sofia_Patel.pdf',
    name: 'Sofia Patel',
    email: 'sofia.patel@email.com',
    phone: '408-555-0139',
    location: 'Sunnyvale, CA',
    summary: 'Data analyst. SQL and Tableau. Does not build product UI or APIs.',
    skills: 'SQL, Tableau, Excel, Python pandas, A/B reporting',
    experience: [
      {
        title: 'Data Analyst',
        company: 'ShopKart',
        dates: '2019 - Present',
        bullets: ['Built Tableau dashboards for growth.', 'Wrote SQL for weekly KPI packs.'],
      },
    ],
    education: 'M.S. Statistics, UC Davis, 2019',
  },
  {
    file: 'resume_14_Ben_Ortiz.pdf',
    name: 'Ben Ortiz',
    email: 'ben.ortiz@email.com',
    phone: '602-555-0181',
    location: 'Phoenix, AZ',
    summary: 'IT helpdesk specialist. Ticketing and Windows admin, not application development.',
    skills: 'Windows, Active Directory, Jira Service Management, Hardware, VPN',
    experience: [
      {
        title: 'IT Support Specialist',
        company: 'Desert Mutual',
        dates: '2018 - Present',
        bullets: ['Resolved 40+ tickets per day.', 'Imaged laptops and managed Active Directory.'],
      },
    ],
    education: 'A.S. Information Technology, Phoenix College, 2017',
  },
  {
    file: 'resume_15_Claire_Ng.pdf',
    name: 'Claire Ng',
    email: 'claire.ng@email.com',
    phone: '206-555-0127',
    location: 'Seattle, WA',
    summary: 'Product manager for mobile apps. Writes specs and launch plans, not production web services.',
    skills: 'Roadmaps, Jira, User research, SQL basics, Stakeholder management',
    experience: [
      {
        title: 'Product Manager',
        company: 'Trail Apps',
        dates: '2018 - Present',
        bullets: ['Owned a consumer app roadmap.', 'Ran discovery interviews and launch plans.'],
      },
    ],
    education: 'B.A. Economics, University of Washington, 2016',
  },
  {
    file: 'resume_16_Owen_Grant.pdf',
    name: 'Owen Grant',
    email: 'owen.grant@email.com',
    phone: '303-555-0144',
    location: 'Denver, CO',
    summary: 'Junior HTML intern. Some CSS and WordPress page edits. Under one year, no production web stack.',
    skills: 'HTML, CSS, WordPress, Canva',
    experience: [
      {
        title: 'Web Intern',
        company: 'Peak Nonprofit',
        dates: '2024 - Present',
        bullets: ['Edited WordPress pages in HTML and CSS.', 'Created Canva graphics for campaigns.'],
      },
    ],
    education: 'B.A. Communications, in progress, 2026',
  },
  {
    file: 'resume_17_Nina_Vasquez.pdf',
    name: 'Nina Vasquez',
    email: 'nina.vasquez@email.com',
    phone: '713-555-0166',
    location: 'Houston, TX',
    summary: 'HR generalist. Recruiting operations, not engineering.',
    skills: 'Greenhouse, Onboarding, Employee relations, Excel, Benefits',
    experience: [
      {
        title: 'HR Generalist',
        company: 'Gulf Energy',
        dates: '2017 - Present',
        bullets: ['Ran recruiting coordination and onboarding.', 'Advised managers on policy.'],
      },
    ],
    education: 'B.S. Human Resources, University of Houston, 2017',
  },
  {
    file: 'resume_18_Tom_Bradley.pdf',
    name: 'Tom Bradley',
    email: 'tom.bradley@email.com',
    phone: '615-555-0111',
    location: 'Nashville, TN',
    summary: 'PHP WordPress contractor. Themes, plugins, and WooCommerce. Not a product frontend engineer.',
    skills: 'PHP, WordPress, MySQL, jQuery, CSS',
    experience: [
      {
        title: 'WordPress Developer',
        company: 'Freelance',
        dates: '2015 - Present',
        bullets: ['Built PHP themes and WooCommerce sites.', 'Maintained MySQL and jQuery scripts.'],
      },
    ],
    education: 'Self-taught web development, 2015',
  },
  {
    file: 'resume_19_Grace_Kim.pdf',
    name: 'Grace Kim',
    email: 'grace.kim@email.com',
    phone: '213-555-0199',
    location: 'Los Angeles, CA',
    summary: 'UX researcher. Interviews and usability tests. Does not write production application code.',
    skills: 'User interviews, Figma, Usability testing, Survey design, Dovetail',
    experience: [
      {
        title: 'UX Researcher',
        company: 'Studio North',
        dates: '2019 - Present',
        bullets: ['Ran usability studies for consumer apps.', 'Synthesized findings in Dovetail.'],
      },
    ],
    education: 'M.S. HCI, USC, 2019',
  },
  {
    file: 'resume_20_Luis_Mendez.pdf',
    name: 'Luis Mendez',
    email: 'luis.mendez@email.com',
    phone: '305-555-0182',
    location: 'Miami, FL',
    summary: 'iOS engineer. Swift and UIKit. Does not build web product surfaces.',
    skills: 'Swift, UIKit, Combine, Xcode, Fastlane',
    experience: [
      {
        title: 'iOS Engineer',
        company: 'Palm Apps',
        dates: '2018 - Present',
        bullets: ['Shipped Swift UIKit features.', 'Owned App Store releases with Fastlane.'],
      },
    ],
    education: 'B.S. Computer Science, FIU, 2018',
  },
  {
    file: 'resume_21_Paula_Reed.pdf',
    name: 'Paula Reed',
    email: 'paula.reed@email.com',
    phone: '617-555-0148',
    location: 'Boston, MA',
    summary: 'DevOps engineer. Terraform, AWS, and cluster operations. Does not build product UI.',
    skills: 'Terraform, AWS, Kubernetes, Prometheus, Linux',
    experience: [
      {
        title: 'DevOps Engineer',
        company: 'Harbor Cloud',
        dates: '2017 - Present',
        bullets: ['Managed Kubernetes clusters on AWS.', 'Wrote Terraform for networking.'],
      },
    ],
    education: 'B.S. Computer Engineering, Northeastern, 2017',
  },
  {
    file: 'resume_22_Chris_Dalton.pdf',
    name: 'Chris Dalton',
    email: 'chris.dalton@email.com',
    phone: '919-555-0134',
    location: 'Raleigh, NC',
    summary: 'QA analyst. Manual test cases and regression. Does not write production application code.',
    skills: 'TestRail, Selenium basics, Jira, Regression, Exploratory testing',
    experience: [
      {
        title: 'QA Analyst',
        company: 'BrightPath',
        dates: '2019 - Present',
        bullets: ['Wrote regression suites in TestRail.', 'Logged defects in Jira.'],
      },
    ],
    education: 'B.S. Information Science, NC State, 2019',
  },
  {
    file: 'resume_23_Ivy_Shah.pdf',
    name: 'Ivy Shah',
    email: 'ivy.shah@email.com',
    phone: '858-555-0170',
    location: 'San Diego, CA',
    summary: 'Machine learning intern. Notebooks and PyTorch. No full stack or frontend product work.',
    skills: 'Python, PyTorch, Jupyter, Pandas, CUDA basics',
    experience: [
      {
        title: 'ML Intern',
        company: 'Coastal AI',
        dates: '2024 - Present',
        bullets: ['Trained small PyTorch models.', 'Cleaned datasets in Pandas.'],
      },
    ],
    education: 'B.S. Computer Science, UCSD, expected 2026',
  },
  {
    file: 'resume_24_Noah_Bennett.pdf',
    name: 'Noah Bennett',
    email: 'noah.bennett@email.com',
    phone: '612-555-0122',
    location: 'Minneapolis, MN',
    summary: 'Operations coordinator in logistics. Spreadsheets and vendors, not software.',
    skills: 'Excel, SAP, Vendor management, Scheduling, Inventory',
    experience: [
      {
        title: 'Operations Coordinator',
        company: 'Midwest Freight',
        dates: '2016 - Present',
        bullets: ['Scheduled inbound trucks.', 'Tracked inventory in SAP and Excel.'],
      },
    ],
    education: 'B.A. Business Administration, UMN, 2016',
  },
  {
    file: 'resume_25_Tara_Singh.pdf',
    name: 'Tara Singh',
    email: 'tara.singh@email.com',
    phone: '416-555-0108',
    location: 'Toronto, ON',
    summary: 'Ruby on Rails engineer. Sidekiq jobs and RSpec. Does not use the product frontend stack.',
    skills: 'Ruby, Rails, Sidekiq, RSpec, Heroku',
    experience: [
      {
        title: 'Rails Developer',
        company: 'Maple Apps',
        dates: '2018 - Present',
        bullets: ['Built Rails APIs and Sidekiq jobs.', 'Wrote RSpec coverage for billing.'],
      },
    ],
    education: 'B.S. Computer Science, University of Toronto, 2018',
  },
  {
    file: 'resume_26_Evan_Cole.pdf',
    name: 'Evan Cole',
    email: 'evan.cole@email.com',
    phone: '702-555-0159',
    location: 'Las Vegas, NV',
    summary: 'High school computer teacher. Classroom tech, not production engineering.',
    skills: 'Curriculum, Scratch, Google Classroom, Classroom management',
    experience: [
      {
        title: 'Computer Science Teacher',
        company: 'Desert Ridge High',
        dates: '2014 - Present',
        bullets: ['Taught intro programming with Scratch.', 'Managed Google Classroom.'],
      },
    ],
    education: 'B.A. Education, UNLV, 2014',
  },
  {
    file: 'resume_27_Mia_Torres.pdf',
    name: 'Mia Torres',
    email: 'mia.torres@email.com',
    phone: '505-555-0194',
    location: 'Albuquerque, NM',
    summary: 'Graphic designer. Print and brand kits. Does not ship web applications.',
    skills: 'Adobe Illustrator, InDesign, Photoshop, Brand, Print production',
    experience: [
      {
        title: 'Graphic Designer',
        company: 'Mesa Creative',
        dates: '2017 - Present',
        bullets: ['Designed brand kits in Illustrator.', 'Prepared print files in InDesign.'],
      },
    ],
    education: 'B.F.A. Graphic Design, UNM, 2017',
  },
  {
    file: 'resume_28_Kyle_Foster.pdf',
    name: 'Kyle Foster',
    email: 'kyle.foster@email.com',
    phone: '314-555-0161',
    location: 'St. Louis, MO',
    summary: 'C# desktop engineer. WinForms internal tools and SQL Server. Does not ship web product UI.',
    skills: 'C#, .NET, WinForms, SQL Server, Azure DevOps',
    experience: [
      {
        title: 'Desktop Developer',
        company: 'Midwest Industrial',
        dates: '2015 - Present',
        bullets: ['Maintained WinForms C# tools.', 'Wrote SQL Server stored procedures.'],
      },
    ],
    education: 'B.S. Computer Science, Missouri S&T, 2015',
  },
  {
    file: 'resume_29_Olivia_Park.pdf',
    name: 'Olivia Park',
    email: 'olivia.park@email.com',
    phone: '808-555-0136',
    location: 'Honolulu, HI',
    summary: 'Customer success manager. Renewals and onboarding, not coding.',
    skills: 'Gainsight, Zendesk, QBR, Onboarding, Churn analysis',
    experience: [
      {
        title: 'Customer Success Manager',
        company: 'Island SaaS',
        dates: '2018 - Present',
        bullets: ['Owned 40 SMB accounts.', 'Ran QBRs and onboarding playbooks.'],
      },
    ],
    education: 'B.A. Communications, University of Hawaii, 2018',
  },
  {
    file: 'resume_30_Ryan_Peters.pdf',
    name: 'Ryan Peters',
    email: 'ryan.peters@email.com',
    phone: '207-555-0129',
    location: 'Portland, ME',
    summary: 'Recent bootcamp graduate. Tutorial HTML, CSS, and JavaScript only. Under 1 year, no production team delivery.',
    skills: 'HTML, CSS, JavaScript, WordPress basics',
    experience: [
      {
        title: 'Bootcamp Student',
        company: 'Coastal Coding Bootcamp',
        dates: '2025 - 2026',
        bullets: ['Completed HTML, CSS, and JavaScript tutorials.', 'No production APIs or team delivery at work.'],
      },
    ],
    education: 'Coding bootcamp certificate, 2026',
  },
];

const profiles = [...fullstackFit, ...frontendFit, ...fillers];

async function removeOldNumberedResumes() {
  const entries = await readdir(OUT_DIR);
  await Promise.all(
    entries
      .filter((name) => {
        const match = name.match(/^resume_(\d+)_/);
        if (!match) return false;
        const n = Number(match[1]);
        return n >= 1 && n <= 30;
      })
      .map((name) => unlink(path.join(OUT_DIR, name)))
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await removeOldNumberedResumes();
  for (const profile of profiles) {
    const dest = path.join(OUT_DIR, profile.file);
    await writeResumePdf(dest, resumeLines(profile));
    console.log('wrote', profile.file);
  }
  console.log(`Generated ${profiles.length} role-fit resumes (4 fullstack, 4 frontend, 22 fillers).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
