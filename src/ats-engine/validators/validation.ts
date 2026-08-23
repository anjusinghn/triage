/**
 * Validation Service
 * Validates LLM output against resume text
 */

import type { LLMOutput, ValidatedLLMOutput, JobInput } from "../types";

const SCORE_CAPS = {
    semantic: 30,
    skills: 10,
    experience: 10,
    education: 10,
};

/**
 * Validate LLM analysis output
 */
export function validateLLMOutput(
    llmOutput: LLMOutput,
    resumeText: string,
    job: JobInput
): ValidatedLLMOutput {
    const normalizedResume = resumeText.toLowerCase();
    const requiredSkills = job.mustHaveSkills ?? [];
    const niceToHaveSkills = job.niceToHaveSkills ?? [];

    // Validate skills against resume
    const verifiedSkills = validateSkills(
        llmOutput.skillsAnalysis.matched,
        normalizedResume,
        requiredSkills,
        niceToHaveSkills
    );

    // Compute scores (capped)
    const semanticScore = Math.min(
        Math.round((llmOutput.semanticScore / 100) * SCORE_CAPS.semantic),
        SCORE_CAPS.semantic
    );

    const skillsScore = computeSkillsScore(verifiedSkills, requiredSkills, niceToHaveSkills);

    const experienceScore = computeExperienceScore(
        llmOutput.experienceAnalysis,
        job.requiredExperienceYears
    );

    const educationScore = computeEducationScore(llmOutput.educationAnalysis);

    // Find unverified claims
    const unverifiedClaims = llmOutput.skillsAnalysis.missing ?? [];

    return {
        semanticScore,
        skillsScore,
        experienceScore,
        educationScore,
        verifiedSkills,
        unverifiedClaims,
        strengths: llmOutput.keyFindings.strengths,
        gaps: llmOutput.keyFindings.gaps,
        risks: llmOutput.keyFindings.risks,
        totalYears: llmOutput.experienceAnalysis.totalYears,
        relevantYears: llmOutput.experienceAnalysis.relevantYears,
        educationLevel: llmOutput.educationAnalysis.level,
        educationRelevance: llmOutput.educationAnalysis.relevance,
        confidence: llmOutput.confidence,
    };
}

interface VerifiedSkill {
    skill: string;
    evidence: string;
    confidence: number;
}

function validateSkills(
    matchedSkills: string[],
    resumeText: string,
    requiredSkills: string[],
    niceToHaveSkills: string[]
): VerifiedSkill[] {
    const verified: VerifiedSkill[] = [];
    const allTargetSkills = [...requiredSkills, ...niceToHaveSkills];

    for (const skill of matchedSkills) {
        // Extract just the skill name if LLM included evidence (e.g., "Flutter: 'some evidence'")
        const skillName = extractSkillName(skill);
        const normalizedSkill = skillName.toLowerCase();

        // Check if skill is in resume
        if (resumeText.includes(normalizedSkill)) {
            // Find evidence
            const evidence = findEvidence(resumeText, normalizedSkill);
            const isRequired = requiredSkills.some((r) => r.toLowerCase() === normalizedSkill);

            verified.push({
                skill: skillName,
                evidence,
                confidence: isRequired ? 0.95 : 0.85,
            });
        } else {
            // Check for partial matches or variations
            const partialMatch = findPartialMatch(resumeText, normalizedSkill, allTargetSkills);
            if (partialMatch) {
                verified.push({
                    skill: skillName,
                    evidence: partialMatch.evidence,
                    confidence: partialMatch.confidence,
                });
            }
        }
    }

    return verified;
}

/**
 * Extract just the skill name from LLM response that may include evidence
 * Examples:
 * - "Flutter: 'Built an interactive...'" -> "Flutter"
 * - "Node.js" -> "Node.js"
 * - "PostgreSQL (mentioned in project)" -> "PostgreSQL"
 */
function extractSkillName(skill: string): string {
    // Handle "Skill: 'evidence'" format
    if (skill.includes(":")) {
        const colonIndex = skill.indexOf(":");
        const potentialSkill = skill.substring(0, colonIndex).trim();
        // Only use the part before colon if it looks like a skill name (short, no sentences)
        if (
            potentialSkill.length < 50 &&
            !potentialSkill.includes(" is ") &&
            !potentialSkill.includes(" with ")
        ) {
            return potentialSkill;
        }
    }

    // Handle "Skill (notes)" format
    if (skill.includes("(")) {
        const parenIndex = skill.indexOf("(");
        const potentialSkill = skill.substring(0, parenIndex).trim();
        if (potentialSkill.length > 0 && potentialSkill.length < 50) {
            return potentialSkill;
        }
    }

    // Handle "Skill - notes" format
    if (skill.includes(" - ")) {
        const dashIndex = skill.indexOf(" - ");
        const potentialSkill = skill.substring(0, dashIndex).trim();
        if (potentialSkill.length > 0 && potentialSkill.length < 50) {
            return potentialSkill;
        }
    }

    return skill.trim();
}

function findEvidence(text: string, skill: string): string {
    const idx = text.indexOf(skill.toLowerCase());
    if (idx === -1) return "";

    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + skill.length + 50);
    return "..." + text.slice(start, end) + "...";
}

function findPartialMatch(
    text: string,
    skill: string,
    _targetSkills: string[]
): { evidence: string; confidence: number } | null {
    // Try common variations
    const variations = [
        skill,
        skill.replace(/\./g, ""),
        skill.replace(/js$/i, "javascript"),
        skill.replace(/javascript$/i, "js"),
        skill.replace(/-/g, " "),
        skill.replace(/ /g, "-"),
    ];

    for (const variant of variations) {
        if (text.includes(variant.toLowerCase())) {
            return {
                evidence: findEvidence(text, variant),
                confidence: 0.7,
            };
        }
    }

    return null;
}

function computeSkillsScore(
    verifiedSkills: VerifiedSkill[],
    requiredSkills: string[],
    niceToHaveSkills: string[]
): number {
    if (requiredSkills.length === 0 && niceToHaveSkills.length === 0) {
        return 5; // No skills specified, give partial credit
    }

    const verifiedSkillNames = verifiedSkills.map((s) => s.skill.toLowerCase());

    // Count matched required skills
    const matchedRequired = requiredSkills.filter((skill) =>
        verifiedSkillNames.some(
            (v) => v.includes(skill.toLowerCase()) || skill.toLowerCase().includes(v)
        )
    ).length;

    // Count matched nice-to-have skills
    const matchedNiceToHave = niceToHaveSkills.filter((skill) =>
        verifiedSkillNames.some(
            (v) => v.includes(skill.toLowerCase()) || skill.toLowerCase().includes(v)
        )
    ).length;

    // Required skills are worth 70% of skill score, nice-to-have 30%
    const requiredRatio = requiredSkills.length > 0 ? matchedRequired / requiredSkills.length : 0.5;
    const niceToHaveRatio =
        niceToHaveSkills.length > 0 ? matchedNiceToHave / niceToHaveSkills.length : 0.5;

    const rawScore = (requiredRatio * 0.7 + niceToHaveRatio * 0.3) * 100;
    const computedScore = Math.min(
        Math.round((rawScore / 100) * SCORE_CAPS.skills),
        SCORE_CAPS.skills
    );

    // Ensure minimum baseline score of 3 (LLM analysis should enhance, not completely zero out)
    return Math.max(computedScore, 3);
}

function computeExperienceScore(
    experienceAnalysis: LLMOutput["experienceAnalysis"],
    requiredYears?: number
): number {
    if (!requiredYears || requiredYears === 0) {
        // No requirement, give partial credit based on having experience
        return experienceAnalysis.totalYears > 0 ? 7 : 3;
    }

    const relevantYears = experienceAnalysis.relevantYears;
    const ratio = Math.min(relevantYears / requiredYears, 1.5);

    let score: number;
    if (ratio >= 1) {
        score = SCORE_CAPS.experience; // Meets or exceeds
    } else if (ratio >= 0.8) {
        score = Math.round(SCORE_CAPS.experience * 0.9);
    } else if (ratio >= 0.5) {
        score = Math.round(SCORE_CAPS.experience * 0.7);
    } else {
        score = Math.round(SCORE_CAPS.experience * ratio);
    }

    // Ensure minimum baseline score of 3 (LLM analysis should enhance, not completely zero out)
    return Math.max(score, 3);
}

function computeEducationScore(educationAnalysis: LLMOutput["educationAnalysis"]): number {
    const levelScores: Record<string, number> = {
        phd: 10,
        masters: 9,
        bachelors: 8,
        associate: 6,
        "high school": 4,
        other: 5,
    };

    const levelScore = levelScores[educationAnalysis.level.toLowerCase()] ?? 5;
    const relevanceMultiplier = educationAnalysis.relevance / 100;
    const computedScore = Math.min(
        Math.round(levelScore * relevanceMultiplier),
        SCORE_CAPS.education
    );

    // Ensure minimum baseline score of 3 (LLM analysis should enhance, not completely zero out)
    return Math.max(computedScore, 3);
}

function skillAppearsInResume(resumeText: string, skill: string): boolean {
    return resumeText.toLowerCase().includes(skill.toLowerCase());
}

function inferEducationFromText(resumeText: string): {
    level: string;
    relevance: number;
} {
    const text = resumeText.toLowerCase();
    if (text.includes("ph.d") || text.includes("phd")) {
        return { level: "phd", relevance: 75 };
    }
    if (text.includes("m.s.") || text.includes("masters") || text.includes("m.s ")) {
        return { level: "masters", relevance: 85 };
    }
    if (
        text.includes("b.s.") ||
        text.includes("b.a.") ||
        text.includes("b.f.a") ||
        text.includes("bachelor")
    ) {
        return { level: "bachelors", relevance: 85 };
    }
    return { level: "other", relevance: 50 };
}

function inferYearsFromText(resumeText: string): number {
    const matches = [...resumeText.matchAll(/(\d+)\s+years?/gi)].map((match) => Number(match[1]));
    if (matches.length === 0) {
        return 0;
    }
    return Math.max(...matches);
}

/**
 * Create validated output for rule-based only mode.
 * Skills and years are taken from explicit resume text so role-fit resumes can
 * shortlist without an LLM, and fillers that never name the required stack do not.
 */
export function createRuleBasedValidatedOutput(
    resumeText: string,
    job: JobInput
): ValidatedLLMOutput {
    const requiredSkills = job.mustHaveSkills ?? [];
    const niceToHaveSkills = job.niceToHaveSkills ?? [];
    const verifiedSkills: VerifiedSkill[] = [];

    for (const skill of [...requiredSkills, ...niceToHaveSkills]) {
        if (!skillAppearsInResume(resumeText, skill)) {
            continue;
        }
        verifiedSkills.push({
            skill,
            evidence: skill,
            confidence: 0.9,
        });
    }

    const matchedRequired = requiredSkills.filter((skill) =>
        verifiedSkills.some(
            (verified) =>
                verified.skill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(verified.skill.toLowerCase())
        )
    );
    const requiredRatio =
        requiredSkills.length > 0 ? matchedRequired.length / requiredSkills.length : 0.5;
    const years = inferYearsFromText(resumeText);
    const relevantYears = Math.round(years * requiredRatio);
    const education = inferEducationFromText(resumeText);
    const skillsScore = computeSkillsScore(verifiedSkills, requiredSkills, niceToHaveSkills);
    const experienceScore = computeExperienceScore(
        { totalYears: years, relevantYears, highlights: [] },
        job.requiredExperienceYears
    );
    const educationScore = computeEducationScore({
        level: education.level,
        relevance: education.relevance,
    });

    const strengths: string[] = [];
    if (matchedRequired.length > 0) {
        strengths.push(`Matches required skills: ${matchedRequired.join(", ")}.`);
    }
    if (relevantYears > 0) {
        strengths.push(`${relevantYears} years of relevant experience for this role.`);
    }

    const missing = requiredSkills.filter((skill) => !matchedRequired.includes(skill));
    const gaps =
        missing.length > 0 ? [`Missing required skills: ${missing.slice(0, 4).join(", ")}.`] : [];

    return {
        semanticScore: Math.max(6, Math.round(SCORE_CAPS.semantic * requiredRatio)),
        skillsScore,
        experienceScore,
        educationScore,
        verifiedSkills,
        unverifiedClaims: missing,
        strengths,
        gaps,
        risks: [],
        totalYears: years,
        relevantYears,
        educationLevel: education.level,
        educationRelevance: education.relevance,
        confidence: Math.max(0.35, Math.min(0.9, 0.35 + requiredRatio * 0.5)),
    };
}
