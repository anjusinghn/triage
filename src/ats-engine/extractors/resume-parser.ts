/**
 * Resume Parser Utility
 * Extracts structured data from resume text
 */

import type { ParsedSkill, WorkExperience, Education, ParsedResume } from "../types";
import { normalizeSkill, SKILL_CATEGORIES } from "../utils/skill-normalizer";

// Common degree patterns
const DEGREE_PATTERNS = [
    { pattern: /\b(ph\.?d|doctorate|doctor of philosophy)\b/i, level: "phd" as const },
    { pattern: /\b(m\.?s\.?|master'?s?|mba|m\.?tech|m\.?eng)\b/i, level: "master" as const },
    {
        pattern: /\b(b\.?s\.?|bachelor'?s?|b\.?tech|b\.?eng|b\.?a\.?)\b/i,
        level: "bachelor" as const,
    },
    { pattern: /\b(associate'?s?|a\.?s\.?|a\.?a\.?)\b/i, level: "associate" as const },
    {
        pattern: /\b(bootcamp|certificate|certification|certified)\b/i,
        level: "certification" as const,
    },
    { pattern: /\b(high school|ged|diploma)\b/i, level: "high_school" as const },
];

// Seniority patterns
const SENIORITY_PATTERNS = [
    { pattern: /\b(ceo|cto|cfo|coo|chief|founder|co-founder)\b/i, level: "executive" as const },
    { pattern: /\b(vp|vice president|director|head of)\b/i, level: "director" as const },
    { pattern: /\b(manager|engineering manager|team lead)\b/i, level: "manager" as const },
    { pattern: /\b(lead|principal|staff|architect)\b/i, level: "lead" as const },
    { pattern: /\b(senior|sr\.?|iii)\b/i, level: "senior" as const },
    { pattern: /\b(mid-?level|intermediate|ii)\b/i, level: "mid" as const },
    { pattern: /\b(junior|jr\.?|entry|associate|i\b|intern)\b/i, level: "entry" as const },
];

// Industry keywords - expanded for all sectors
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    // Tech
    fintech: [
        "fintech",
        "banking",
        "payment",
        "financial services",
        "trading",
        "investment",
        "insurance",
        "wealth management",
        "crypto",
        "blockchain",
    ],
    healthtech: [
        "health",
        "medical",
        "healthcare",
        "hospital",
        "clinical",
        "pharma",
        "biotech",
        "telemedicine",
        "patient care",
        "life sciences",
    ],
    edtech: [
        "education",
        "learning",
        "school",
        "university",
        "training",
        "e-learning",
        "lms",
        "curriculum",
        "academic",
    ],
    ecommerce: [
        "ecommerce",
        "e-commerce",
        "retail",
        "shop",
        "marketplace",
        "store",
        "fulfillment",
        "inventory",
        "consumer goods",
    ],
    saas: ["saas", "software", "platform", "enterprise", "b2b", "cloud", "subscription", "product"],
    gaming: ["game", "gaming", "esports", "entertainment", "interactive", "virtual reality", "vr"],
    ai: [
        "ai",
        "artificial intelligence",
        "machine learning",
        "ml",
        "data science",
        "nlp",
        "computer vision",
        "deep learning",
    ],
    cybersecurity: [
        "security",
        "cyber",
        "infosec",
        "privacy",
        "compliance",
        "threat",
        "vulnerability",
        "penetration testing",
    ],

    // Non-Tech Industries
    consulting: [
        "consulting",
        "advisory",
        "strategy",
        "management consulting",
        "big four",
        "deloitte",
        "mckinsey",
        "bcg",
        "bain",
    ],
    legal: [
        "law",
        "legal",
        "attorney",
        "lawyer",
        "litigation",
        "compliance",
        "regulatory",
        "contract",
        "patent",
    ],
    "real-estate": [
        "real estate",
        "property",
        "commercial real estate",
        "residential",
        "development",
        "construction",
        "mortgage",
    ],
    manufacturing: [
        "manufacturing",
        "production",
        "factory",
        "assembly",
        "supply chain",
        "lean",
        "quality control",
    ],
    energy: ["energy", "oil", "gas", "renewable", "solar", "wind", "utilities", "power", "grid"],
    telecommunications: [
        "telecom",
        "telecommunications",
        "wireless",
        "5g",
        "networking",
        "carrier",
        "mobile operator",
    ],
    media: [
        "media",
        "publishing",
        "content",
        "advertising",
        "marketing",
        "broadcast",
        "digital media",
        "streaming",
    ],
    hospitality: [
        "hospitality",
        "hotel",
        "restaurant",
        "travel",
        "tourism",
        "food service",
        "catering",
    ],
    nonprofit: [
        "nonprofit",
        "ngo",
        "charity",
        "foundation",
        "social impact",
        "philanthropy",
        "development",
    ],
    government: [
        "government",
        "federal",
        "state",
        "municipal",
        "public sector",
        "defense",
        "military",
    ],
    automotive: [
        "automotive",
        "automobile",
        "vehicle",
        "ev",
        "electric vehicle",
        "autonomous",
        "transportation",
    ],
    aerospace: ["aerospace", "aviation", "airline", "defense", "space", "satellite", "rocket"],
    agriculture: ["agriculture", "farming", "agtech", "food production", "crops", "livestock"],
};

// Comprehensive skill keywords across all industries
const SKILL_KEYWORDS = [
    // ===== TECH - Programming Languages =====
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "go",
    "golang",
    "rust",
    "ruby",
    "php",
    "swift",
    "kotlin",
    "scala",
    "r",
    "matlab",
    "perl",
    "haskell",
    "elixir",
    "clojure",
    "fortran",
    "cobol",
    "vba",
    "lua",
    "dart",

    // ===== TECH - Frontend =====
    "react",
    "vue",
    "angular",
    "next.js",
    "nuxt",
    "svelte",
    "gatsby",
    "remix",
    "html",
    "css",
    "sass",
    "tailwind",
    "bootstrap",
    "material ui",
    "chakra ui",
    "styled components",
    "webpack",
    "vite",
    "storybook",

    // ===== TECH - Backend =====
    "node.js",
    "rest apis",
    "rest api",
    "express",
    "nestjs",
    "django",
    "flask",
    "fastapi",
    "spring",
    "spring boot",
    "rails",
    "laravel",
    ".net",
    "asp.net",

    // ===== TECH - Databases =====
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "elasticsearch",
    "dynamodb",
    "sql server",
    "oracle",
    "cassandra",
    "neo4j",
    "sqlite",
    "mariadb",
    "couchdb",
    "firebase",
    "supabase",

    // ===== TECH - Cloud & DevOps =====
    "aws",
    "azure",
    "gcp",
    "google cloud",
    "docker",
    "kubernetes",
    "terraform",
    "ansible",
    "jenkins",
    "github actions",
    "gitlab ci",
    "circleci",
    "helm",
    "istio",
    "prometheus",
    "grafana",
    "datadog",
    "nginx",
    "linux",
    "bash",

    // ===== TECH - AI/ML =====
    "machine learning",
    "deep learning",
    "tensorflow",
    "pytorch",
    "langchain",
    "openai",
    "nlp",
    "computer vision",
    "scikit-learn",
    "keras",
    "huggingface",
    "pandas",
    "numpy",
    "scipy",
    "jupyter",
    "mlops",
    "llm",

    // ===== TECH - Data =====
    "spark",
    "hadoop",
    "kafka",
    "airflow",
    "dbt",
    "snowflake",
    "redshift",
    "bigquery",
    "tableau",
    "power bi",
    "looker",
    "databricks",
    "etl",
    "data warehouse",
    "data lake",
    "data modeling",

    // ===== TECH - Mobile =====
    "react native",
    "flutter",
    "ios",
    "android",
    "swiftui",
    "jetpack compose",
    "expo",

    // ===== TECH - Testing & Tools =====
    "git",
    "github",
    "gitlab",
    "jira",
    "confluence",
    "figma",
    "postman",
    "jest",
    "cypress",
    "selenium",
    "playwright",

    // ===== FINANCE & ACCOUNTING =====
    "financial analysis",
    "financial modeling",
    "budgeting",
    "forecasting",
    "fp&a",
    "gaap",
    "ifrs",
    "auditing",
    "accounts payable",
    "accounts receivable",
    "general ledger",
    "quickbooks",
    "sap",
    "netsuite",
    "erp",
    "excel",
    "pivot tables",
    "vlookup",
    "macros",
    "bloomberg",
    "factset",
    "capital iq",
    "investment banking",
    "private equity",
    "venture capital",
    "m&a",
    "valuation",
    "dcf",
    "lbo",
    "portfolio management",
    "risk management",
    "derivatives",
    "fixed income",
    "equities",

    // ===== MARKETING =====
    "digital marketing",
    "content marketing",
    "seo",
    "sem",
    "ppc",
    "google ads",
    "facebook ads",
    "meta ads",
    "google analytics",
    "hubspot",
    "marketo",
    "salesforce marketing cloud",
    "mailchimp",
    "klaviyo",
    "social media marketing",
    "email marketing",
    "marketing automation",
    "brand management",
    "copywriting",
    "content strategy",
    "a/b testing",
    "conversion optimization",
    "growth marketing",
    "product marketing",

    // ===== SALES =====
    "b2b sales",
    "enterprise sales",
    "saas sales",
    "account executive",
    "account management",
    "customer success",
    "business development",
    "lead generation",
    "pipeline management",
    "salesforce",
    "hubspot crm",
    "solution selling",
    "consultative selling",
    "negotiation",
    "cold calling",
    "prospecting",
    "sales operations",
    "revenue operations",
    "sales enablement",

    // ===== HR & RECRUITING =====
    "talent acquisition",
    "recruiting",
    "sourcing",
    "interviewing",
    "onboarding",
    "employee relations",
    "workday",
    "bamboohr",
    "adp",
    "payroll",
    "compensation",
    "benefits",
    "hris",
    "performance management",
    "learning and development",
    "dei",
    "employer branding",
    "greenhouse",
    "lever",
    "linkedin recruiter",

    // ===== PROJECT MANAGEMENT =====
    "project management",
    "product management",
    "agile",
    "scrum",
    "kanban",
    "waterfall",
    "pmp",
    "prince2",
    "jira",
    "asana",
    "trello",
    "monday.com",
    "notion",
    "linear",
    "roadmapping",
    "stakeholder management",
    "sprint planning",
    "backlog management",
    "okrs",
    "kpis",

    // ===== HEALTHCARE =====
    "ehr",
    "emr",
    "epic",
    "cerner",
    "hl7",
    "fhir",
    "hipaa",
    "medical coding",
    "medical billing",
    "clinical trials",
    "clinical research",
    "fda",
    "regulatory affairs",
    "pharmacology",
    "diagnostics",
    "patient care",
    "nursing",
    "telemedicine",
    "healthcare analytics",
    "population health",

    // ===== OPERATIONS & SUPPLY CHAIN =====
    "supply chain",
    "logistics",
    "procurement",
    "inventory management",
    "warehouse management",
    "demand planning",
    "s&op",
    "lean",
    "six sigma",
    "lean six sigma",
    "continuous improvement",
    "process improvement",
    "operations management",
    "vendor management",

    // ===== LEGAL =====
    "contract drafting",
    "contract review",
    "litigation",
    "corporate law",
    "intellectual property",
    "patent law",
    "compliance",
    "regulatory",
    "due diligence",
    "legal research",
    "westlaw",
    "lexisnexis",

    // ===== DESIGN =====
    "ui design",
    "ux design",
    "ui/ux",
    "product design",
    "graphic design",
    "figma",
    "sketch",
    "adobe xd",
    "adobe photoshop",
    "adobe illustrator",
    "invision",
    "prototyping",
    "wireframing",
    "user research",
    "design systems",
    "typography",
    "branding",
    "visual design",

    // ===== SOFT SKILLS =====
    "leadership",
    "communication",
    "presentation",
    "public speaking",
    "problem solving",
    "critical thinking",
    "teamwork",
    "collaboration",
    "mentoring",
    "coaching",
    "negotiation",
    "conflict resolution",
    "time management",
    "adaptability",
    "creativity",
    "strategic thinking",

    // ===== CERTIFICATIONS =====
    "aws certified",
    "google cloud certified",
    "azure certified",
    "pmp",
    "scrum master",
    "csm",
    "cissp",
    "cfa",
    "cpa",
    "series 7",
    "series 63",
    "six sigma black belt",
    "itil",
    "comptia",
];

/**
 * Extract skills from resume text
 */
export function extractSkills(text: string): ParsedSkill[] {
    const skills: ParsedSkill[] = [];
    const foundSkills = new Set<string>();

    const lowerText = text.toLowerCase();

    for (const skill of SKILL_KEYWORDS) {
        if (lowerText.includes(skill) && !foundSkills.has(normalizeSkill(skill))) {
            const normalizedName = normalizeSkill(skill);
            foundSkills.add(normalizedName);

            skills.push({
                name: skill,
                normalizedName,
                proficiency: estimateProficiency(text, skill),
            });
        }
    }

    return skills;
}

/**
 * Estimate skill proficiency based on context
 */
function estimateProficiency(text: string, skill: string): ParsedSkill["proficiency"] {
    const lowerText = text.toLowerCase();
    const skillLower = skill.toLowerCase();

    // Look for proficiency indicators near the skill mention
    const expertPatterns = [
        "expert",
        "advanced",
        "extensive experience",
        "5+ years",
        "lead",
        "architect",
    ];
    const advancedPatterns = ["proficient", "strong", "3+ years", "4+ years"];
    const intermediatePatterns = ["2+ years", "experienced", "competent"];
    const beginnerPatterns = ["basic", "familiar", "learning", "beginner", "junior"];

    // Check for patterns
    for (const pattern of expertPatterns) {
        if (
            lowerText.includes(`${pattern} ${skillLower}`) ||
            lowerText.includes(`${skillLower} ${pattern}`)
        ) {
            return "expert";
        }
    }

    for (const pattern of advancedPatterns) {
        if (
            lowerText.includes(`${pattern} ${skillLower}`) ||
            lowerText.includes(`${skillLower} ${pattern}`)
        ) {
            return "advanced";
        }
    }

    for (const pattern of intermediatePatterns) {
        if (
            lowerText.includes(`${pattern} ${skillLower}`) ||
            lowerText.includes(`${skillLower} ${pattern}`)
        ) {
            return "intermediate";
        }
    }

    for (const pattern of beginnerPatterns) {
        if (
            lowerText.includes(`${pattern} ${skillLower}`) ||
            lowerText.includes(`${skillLower} ${pattern}`)
        ) {
            return "beginner";
        }
    }

    return "intermediate"; // Default
}

/**
 * Extract work experience from resume text
 */
export function extractWorkExperience(text: string): WorkExperience[] {
    const experiences: WorkExperience[] = [];

    // Split by common section headers
    const sections = text.split(/\b(experience|work history|employment|career)\b/i);

    if (sections.length < 2) {
        return experiences;
    }

    // Get the experience section (usually after the header)
    const expSection = sections.slice(1).join(" ");

    // Stop at the next major section (education, skills, etc.)
    const nextSectionMatch = expSection.match(
        /\b(education|skills|certifications|projects|references)\b/i
    );
    const relevantSection = nextSectionMatch
        ? expSection.substring(0, nextSectionMatch.index)
        : expSection;

    // Look for date patterns to identify experience entries
    const lines = relevantSection.split("\n").filter((l) => l.trim());

    let currentExp: Partial<WorkExperience> | null = null;
    let previousLine = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for date patterns
        const dateMatch = line.match(/(\d{4})\s*[-–]\s*(present|\d{4})/i);

        if (dateMatch) {
            // Save previous experience if exists
            if (currentExp && currentExp.title) {
                experiences.push(currentExp as WorkExperience);
            }

            // Start new experience
            currentExp = {
                startDate: dateMatch[1],
                endDate: dateMatch[2].toLowerCase() === "present" ? undefined : dateMatch[2],
                isCurrent: dateMatch[2].toLowerCase() === "present",
                title: "",
                company: "",
            };

            // Try to extract title and company from the same line first
            const cleanLine = line.replace(/\d{4}\s*[-–]\s*(present|\d{4})/i, "").trim();

            if (cleanLine) {
                // Date on the same line as title/company
                const parts = cleanLine.split(/\s+at\s+|\s*[-–|]\s*/i);
                if (parts.length >= 2) {
                    currentExp.title = parts[0].trim();
                    currentExp.company = parts[1].trim();
                } else if (parts.length === 1) {
                    currentExp.title = parts[0].trim();
                }
            } else if (previousLine) {
                // Date on a separate line - look at previous line for title/company
                const parts = previousLine.split(/\s+at\s+|\s*[-–|,]\s*/i);
                if (parts.length >= 2) {
                    currentExp.title = parts[0].trim();
                    currentExp.company = parts[1].trim();
                } else if (parts.length === 1 && !previousLine.match(/^[-•]\s/)) {
                    currentExp.title = parts[0].trim();
                }
            }

            // Detect seniority from title line or current line
            const senioritySource = currentExp.title || line;
            for (const { pattern, level } of SENIORITY_PATTERNS) {
                if (pattern.test(senioritySource)) {
                    currentExp.seniorityLevel = level;
                    break;
                }
            }

            // Detect industry
            for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
                if (keywords.some((kw) => (currentExp?.company || "").toLowerCase().includes(kw))) {
                    currentExp.industry = industry;
                    break;
                }
            }
        } else if (currentExp && line.match(/^[-•]\s/)) {
            // Add bullet points to description
            currentExp.description = (currentExp.description || "") + " " + line;
        }

        previousLine = line;
    }

    // Don't forget the last experience
    if (currentExp && currentExp.title) {
        experiences.push(currentExp as WorkExperience);
    }

    return experiences;
}

/**
 * Extract education from resume text
 */
export function extractEducation(text: string): Education[] {
    const educations: Education[] = [];

    // Split by common section headers
    const sections = text.split(/\b(education|academic|qualifications|degrees)\b/i);

    if (sections.length < 2) {
        return educations;
    }

    // Get education section and stop at next major section
    let eduSection = sections.slice(1).join(" ");
    const nextSectionMatch = eduSection.match(
        /\b(experience|work|skills|certifications|projects|references)\b/i
    );
    if (nextSectionMatch) {
        eduSection = eduSection.substring(0, nextSectionMatch.index);
    }

    const lines = eduSection.split("\n").filter((l) => l.trim());

    let currentEdu: Partial<Education> | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1] || "";
        const prevLine = i > 0 ? lines[i - 1] : "";

        // Look for degree patterns
        for (const { pattern, level } of DEGREE_PATTERNS) {
            if (pattern.test(line)) {
                // Save previous education if exists
                if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
                    educations.push(currentEdu as Education);
                }

                // Extract graduation year - check current line and nearby lines
                let graduationYear: number | undefined;
                const yearMatch =
                    line.match(/\b(20\d{2}|19\d{2})\b/) ||
                    nextLine.match(/\b(20\d{2}|19\d{2})\b/) ||
                    (lines[i + 2] || "").match(/\b(20\d{2}|19\d{2})\b/);

                if (yearMatch) {
                    graduationYear = parseInt(yearMatch[1]);
                }

                // Look for institution in current, next, or previous lines
                let institution = extractInstitution(line);
                if (institution === "Unknown Institution") {
                    institution = extractInstitution(nextLine);
                }
                if (institution === "Unknown Institution") {
                    institution = extractInstitution(prevLine);
                }

                currentEdu = {
                    institution,
                    degree: extractDegree(line),
                    field: extractField(line),
                    graduationYear,
                    level,
                };
                break;
            }
        }

        // Also check for institution on a line by itself (looking ahead for year)
        if (!currentEdu) {
            const instMatch = extractInstitution(line);
            if (instMatch !== "Unknown Institution") {
                // Check next line for year
                const yearMatch = nextLine.match(/\b(20\d{2}|19\d{2})\b/);
                if (yearMatch) {
                    currentEdu = {
                        institution: instMatch,
                        degree: "Degree",
                        graduationYear: parseInt(yearMatch[1]),
                        level: "bachelor" as const,
                    };
                }
            }
        }
    }

    // Don't forget the last education
    if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
        educations.push(currentEdu as Education);
    }

    return educations;
}

function extractInstitution(line: string): string {
    // Common university patterns
    const uniPatterns = [
        /\b([A-Z][a-zA-Z\s]+(?:University|Institute|College|School))\b/,
        /\b(MIT|Stanford|Harvard|Yale|Berkeley|Princeton)\b/i,
        /\b(IIT|IIM|NIT)\s*[A-Za-z]*\b/i,
    ];

    for (const pattern of uniPatterns) {
        const match = line.match(pattern);
        if (match) return match[1];
    }

    return "Unknown Institution";
}

function extractDegree(line: string): string {
    const degreePatterns = [
        /\b(Bachelor of [A-Za-z]+)\b/i,
        /\b(Master of [A-Za-z]+)\b/i,
        /\b(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?|MBA)\b/i,
    ];

    for (const pattern of degreePatterns) {
        const match = line.match(pattern);
        if (match) return match[1];
    }

    return "Degree";
}

function extractField(line: string): string {
    const fieldPatterns = [
        /\bin\s+([A-Za-z\s]+?)(?:\s+from|\s+at|\s*,|\s*\d)/i,
        /\b(Computer Science|Engineering|Business|Mathematics|Physics|Chemistry|Biology)\b/i,
    ];

    for (const pattern of fieldPatterns) {
        const match = line.match(pattern);
        if (match) return match[1].trim();
    }

    return "General";
}

/**
 * Calculate total years of experience
 */
export function calculateTotalExperience(experiences: WorkExperience[]): number {
    const now = new Date();
    let totalMonths = 0;

    for (const exp of experiences) {
        const startYear = parseInt(exp.startDate);
        const endYear = exp.isCurrent ? now.getFullYear() : parseInt(exp.endDate || exp.startDate);

        if (!isNaN(startYear) && !isNaN(endYear)) {
            totalMonths += (endYear - startYear) * 12;
        }
    }

    return Math.round(totalMonths / 12);
}

/**
 * Get the highest seniority level from experiences
 */
export function getHighestSeniority(
    experiences: WorkExperience[]
): WorkExperience["seniorityLevel"] {
    const seniorityOrder: WorkExperience["seniorityLevel"][] = [
        "entry",
        "mid",
        "senior",
        "lead",
        "manager",
        "director",
        "executive",
    ];

    let highest: WorkExperience["seniorityLevel"] = "entry";

    for (const exp of experiences) {
        if (exp.seniorityLevel) {
            const currentIndex = seniorityOrder.indexOf(highest);
            const expIndex = seniorityOrder.indexOf(exp.seniorityLevel);
            if (expIndex > currentIndex) {
                highest = exp.seniorityLevel;
            }
        }
    }

    return highest;
}

/**
 * Parse a full resume and extract all structured data
 */
export function parseResume(resumeText: string): ParsedResume {
    const skills = extractSkills(resumeText);
    const workExperience = extractWorkExperience(resumeText);
    const education = extractEducation(resumeText);
    const totalYearsExperience = calculateTotalExperience(workExperience);
    const highestSeniority = getHighestSeniority(workExperience);

    return {
        skills,
        workExperience,
        education,
        totalYearsExperience,
        highestSeniority,
    };
}

/**
 * Get skills by category from parsed skills
 */
export function getSkillsByCategory(skills: ParsedSkill[]): Record<string, ParsedSkill[]> {
    const result: Record<string, ParsedSkill[]> = {};

    for (const skill of skills) {
        for (const [category, categorySkills] of Object.entries(SKILL_CATEGORIES)) {
            if ((categorySkills as string[]).includes(skill.normalizedName)) {
                if (!result[category]) {
                    result[category] = [];
                }
                result[category].push(skill);
                break;
            }
        }
    }

    return result;
}

/**
 * Get detected industries from work experience
 */
export function getDetectedIndustries(experiences: WorkExperience[]): string[] {
    const industries = new Set<string>();

    for (const exp of experiences) {
        if (exp.industry) {
            industries.add(exp.industry);
        }
    }

    return Array.from(industries);
}
