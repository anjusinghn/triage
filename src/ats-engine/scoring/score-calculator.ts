/**
 * Score Calculator
 * Computes final scores from all components with customizable weights and penalties
 */

import type {
    ParseabilityResult,
    FormattingResult,
    StructureResult,
    ValidatedLLMOutput,
    CoreATSOutput,
    DecisionBand,
    ATSConfig,
    ScreeningScoringWeights,
    PenaltySettings,
    JobInput,
} from "../types";
import {
    DEFAULT_SCREENING_WEIGHTS,
    DEFAULT_PENALTY_SETTINGS,
    DEFAULT_ATS_CONFIG,
} from "../types";

/**
 * Calculate core ATS output from all components with customizable config
 */
export function calculateCoreOutput(
    parseability: ParseabilityResult,
    formatting: FormattingResult,
    _structure: StructureResult,
    validated: ValidatedLLMOutput,
    job: JobInput,
    config?: ATSConfig
): CoreATSOutput {
    // Merge weights with defaults
    const weights: Required<ScreeningScoringWeights> = {
        ...DEFAULT_SCREENING_WEIGHTS,
        ...config?.scoringWeights,
    };

    // Merge penalties with defaults
    const penalties: Required<PenaltySettings> = {
        ...DEFAULT_PENALTY_SETTINGS,
        ...config?.penalties,
    };

    // Calculate component scores (normalized to 0-100)
    const componentScores = calculateComponentScores(parseability, formatting, validated);

    // Calculate weighted base score
    const baseScore = calculateWeightedScore(componentScores, validated, weights);

    // Apply penalties
    const { finalScore, appliedPenalties } = applyPenalties(
        baseScore,
        validated,
        job,
        parseability,
        penalties
    );

    // Ensure score is within bounds
    const overallScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    // Determine decision band using custom thresholds if provided
    const decisionBand = getDecisionBandWithConfig(overallScore, config);

    // Find missing critical skills
    const verifiedSkillNames = validated.verifiedSkills.map((s) => s.skill.toLowerCase());
    const missingCriticalSkills = (job.mustHaveSkills ?? []).filter(
        (skill) =>
            !verifiedSkillNames.some(
                (v) => v.includes(skill.toLowerCase()) || skill.toLowerCase().includes(v)
            )
    );

    // Matched skills
    const matchedSkills = {
        exact: validated.verifiedSkills.filter((s) => s.confidence >= 0.9).map((s) => s.skill),
        semantic: validated.verifiedSkills
            .filter((s) => s.confidence < 0.9 && s.confidence >= 0.6)
            .map((s) => s.skill),
    };

    return {
        overallScore,
        decisionBand,
        confidence: validated.confidence,
        componentScores,
        missingCriticalSkills,
        matchedSkills,
        appliedPenalties,
    };
}

/**
 * Calculate individual component scores (0-100 scale)
 */
function calculateComponentScores(
    parseability: ParseabilityResult,
    formatting: FormattingResult,
    validated: ValidatedLLMOutput
): CoreATSOutput["componentScores"] {
    return {
        skillsMatch: Math.round((validated.skillsScore / 10) * 100),
        experienceRelevance: Math.round((validated.experienceScore / 10) * 100),
        educationFit: Math.round((validated.educationScore / 10) * 100),
        keywordCoverage: Math.round((validated.semanticScore / 30) * 100),
        seniorityFit: computeSeniorityFit(validated),
        parseability: parseability.percentage,
        formatting: formatting.percentage,
    };
}

/**
 * Calculate weighted score using custom weights
 */
function calculateWeightedScore(
    componentScores: CoreATSOutput["componentScores"],
    validated: ValidatedLLMOutput,
    weights: Required<ScreeningScoringWeights>
): number {
    // Skills score (0-100) * weight
    const skillsContribution = componentScores.skillsMatch * weights.skillsWeight;

    // Experience score (0-100) * weight
    const experienceContribution = componentScores.experienceRelevance * weights.experienceWeight;

    // Domain/keyword coverage (0-100) * weight
    const domainContribution = componentScores.keywordCoverage * weights.domainWeight;

    // Semantic/AI fit - use confidence as a proxy (0-100) * weight
    const semanticScore = Math.round(validated.confidence * 100);
    const semanticContribution = semanticScore * weights.semanticWeight;

    // Education fit (0-100) * weight
    const educationContribution = componentScores.educationFit * weights.educationWeight;

    // Resume quality (average of parseability and formatting) (0-100) * weight
    const resumeQuality = (componentScores.parseability + componentScores.formatting) / 2;
    const resumeQualityContribution = resumeQuality * weights.resumeQualityWeight;

    // Sum weighted contributions (weights sum to 1.0, so result is 0-100)
    return (
        skillsContribution +
        experienceContribution +
        domainContribution +
        semanticContribution +
        educationContribution +
        resumeQualityContribution
    );
}

/**
 * Apply penalties to the base score
 */
function applyPenalties(
    baseScore: number,
    validated: ValidatedLLMOutput,
    job: JobInput,
    parseability: ParseabilityResult,
    penalties: Required<PenaltySettings>
): { finalScore: number; appliedPenalties: string[] } {
    let totalPenalty = 0;
    const appliedPenalties: string[] = [];

    // 1. Missing critical skills penalty
    const verifiedSkillNames = validated.verifiedSkills.map((s) => s.skill.toLowerCase());
    const missingCritical = (job.mustHaveSkills ?? []).filter(
        (skill) =>
            !verifiedSkillNames.some(
                (v) => v.includes(skill.toLowerCase()) || skill.toLowerCase().includes(v)
            )
    );

    if (missingCritical.length > 0) {
        const skillPenalty = missingCritical.length * penalties.missingCriticalSkillPenalty;
        totalPenalty += skillPenalty;
        appliedPenalties.push(
            `Missing ${missingCritical.length} critical skill(s): -${skillPenalty} points`
        );
    }

    // 2. Experience gap penalty
    const requiredYears = job.requiredExperienceYears ?? 0;
    const candidateYears = validated.relevantYears;
    if (requiredYears > 0 && candidateYears < requiredYears) {
        const gapYears = requiredYears - candidateYears;
        const expPenalty = gapYears * penalties.experienceGapPenaltyPerYear;
        totalPenalty += expPenalty;
        appliedPenalties.push(
            `Experience gap (${gapYears} year(s) below requirement): -${expPenalty} points`
        );
    }

    // 3. Seniority mismatch penalty
    const jobLevel = job.experienceLevel;
    if (jobLevel) {
        const seniorityMatch = checkSeniorityMatch(jobLevel, candidateYears);
        if (!seniorityMatch) {
            totalPenalty += penalties.seniorityMismatchPenalty;
            appliedPenalties.push(
                `Seniority mismatch for ${jobLevel} role: -${penalties.seniorityMismatchPenalty} points`
            );
        }
    }

    // 4. Poor ATS format penalty
    if (!parseability.isATSFriendly) {
        totalPenalty += penalties.poorATSFormatPenalty;
        appliedPenalties.push(
            `Poor ATS-friendly formatting: -${penalties.poorATSFormatPenalty} points`
        );
    }

    // Cap total penalty
    const cappedPenalty = Math.min(totalPenalty, penalties.maxTotalPenalty);
    if (cappedPenalty < totalPenalty) {
        appliedPenalties.push(`Penalty capped at maximum: ${penalties.maxTotalPenalty} points`);
    }

    return {
        finalScore: baseScore - cappedPenalty,
        appliedPenalties,
    };
}

/**
 * Check if candidate's experience matches job seniority level
 */
function checkSeniorityMatch(jobLevel: string, candidateYears: number): boolean {
    const levelYearsMap: Record<string, { min: number; max: number }> = {
        FRESHER: { min: 0, max: 1 },
        ENTRY: { min: 0, max: 2 },
        MID: { min: 2, max: 5 },
        SENIOR: { min: 5, max: 10 },
        LEAD: { min: 7, max: 15 },
        EXECUTIVE: { min: 10, max: 99 },
    };

    const range = levelYearsMap[jobLevel.toUpperCase()];
    if (!range) return true; // Unknown level, don't penalize

    return candidateYears >= range.min && candidateYears <= range.max;
}

function computeSeniorityFit(validated: ValidatedLLMOutput): number {
    const years = validated.relevantYears;
    if (years >= 10) return 100;
    if (years >= 5) return 85;
    if (years >= 3) return 70;
    if (years >= 1) return 55;
    return 40;
}

/**
 * Get decision band using custom thresholds
 */
function getDecisionBandWithConfig(score: number, config?: ATSConfig): DecisionBand {
    // Use priority thresholds to determine bands
    const p1 = config?.priority1Threshold ?? DEFAULT_ATS_CONFIG.priority1Threshold;
    const p2 = config?.priority2Threshold ?? DEFAULT_ATS_CONFIG.priority2Threshold;
    const p3 = config?.priority3Threshold ?? DEFAULT_ATS_CONFIG.priority3Threshold;
    const passThreshold = config?.passThreshold ?? DEFAULT_ATS_CONFIG.passThreshold;

    if (score >= p1) return "STRONG_MATCH";
    if (score >= p2) return "GOOD_MATCH";
    if (score >= p3) return "MODERATE_MATCH";
    if (score >= passThreshold) return "WEAK_MATCH";
    return "NO_MATCH";
}

// Keep for backward compatibility - exported for external use
export function getDecisionBand(score: number): DecisionBand {
    return getDecisionBandWithConfig(score);
}

/**
 * Get letter grade from score
 */
export function getGrade(score: number): string {
    if (score >= 85) return "A";
    if (score >= 70) return "B";
    if (score >= 55) return "C";
    if (score >= 40) return "D";
    return "F";
}

/**
 * Calculate rule-based only score (no LLM)
 */
export function calculateRuleBasedScore(
    parseability: ParseabilityResult,
    formatting: FormattingResult,
    structure: StructureResult
): { score: number; grade: string; maxPossible: number } {
    const score = parseability.score + formatting.score + structure.score;
    const maxPossible = 55;

    const normalizedScore = Math.round((score / maxPossible) * 100);

    return {
        score: normalizedScore,
        grade: getGrade(normalizedScore),
        maxPossible,
    };
}
