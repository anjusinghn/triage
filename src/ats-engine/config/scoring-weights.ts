/**
 * Scoring Configuration
 * Configurable weights, penalties, and thresholds for ATS scoring
 */

import type { ScoringWeights, PenaltyConfig, ThresholdConfig, ScoringConfig } from "../types";

// ============================================================================
// DEFAULT SCORING WEIGHTS
// ============================================================================

/**
 * Default weights for component scores
 * All weights should sum to 1.0
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
    requirementCoverage: 0.25, // 25% - How many required skills are covered
    skillDepth: 0.15, // 15% - Years of experience per skill
    domainFit: 0.1, // 10% - Industry/domain alignment
    semanticFit: 0.2, // 20% - Semantic similarity (LLM-based)
    assessment: 0.1, // 10% - Assessment/test scores
    interview: 0.1, // 10% - Interview scores
    compensationLocationFit: 0.1, // 10% - Salary & location match
};

/**
 * Weights optimized for screening stage (more emphasis on requirements)
 */
export const SCREENING_WEIGHTS: ScoringWeights = {
    requirementCoverage: 0.35,
    skillDepth: 0.2,
    domainFit: 0.15,
    semanticFit: 0.15,
    assessment: 0.0, // No assessment at screening
    interview: 0.0, // No interview at screening
    compensationLocationFit: 0.15,
};

/**
 * Weights for final stage (more emphasis on interviews/assessments)
 */
export const FINAL_STAGE_WEIGHTS: ScoringWeights = {
    requirementCoverage: 0.15,
    skillDepth: 0.1,
    domainFit: 0.1,
    semanticFit: 0.1,
    assessment: 0.25, // Higher weight on assessment
    interview: 0.25, // Higher weight on interview
    compensationLocationFit: 0.05,
};

/**
 * Weights for technical roles (more emphasis on skills)
 */
export const TECHNICAL_ROLE_WEIGHTS: ScoringWeights = {
    requirementCoverage: 0.3,
    skillDepth: 0.25,
    domainFit: 0.1,
    semanticFit: 0.15,
    assessment: 0.1,
    interview: 0.05,
    compensationLocationFit: 0.05,
};

/**
 * Weights for management roles (more emphasis on experience)
 */
export const MANAGEMENT_ROLE_WEIGHTS: ScoringWeights = {
    requirementCoverage: 0.2,
    skillDepth: 0.15,
    domainFit: 0.2,
    semanticFit: 0.15,
    assessment: 0.05,
    interview: 0.15,
    compensationLocationFit: 0.1,
};

// ============================================================================
// PENALTY CONFIGURATION
// ============================================================================

/**
 * Default penalty values for scoring deductions
 */
export const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
    missingCriticalSkill: 5, // -5 points per missing critical skill
    experienceGapPerYear: 2, // -2 points per year of experience gap
    seniorityMismatch: 10, // -10 points for seniority mismatch
    poorATSFormat: 5, // -5 points for poor ATS formatting
    maxTotalPenalty: 30, // Maximum total penalty is 30 points
};

/**
 * Strict penalty configuration (for high-bar roles)
 */
export const STRICT_PENALTY_CONFIG: PenaltyConfig = {
    missingCriticalSkill: 10,
    experienceGapPerYear: 3,
    seniorityMismatch: 15,
    poorATSFormat: 10,
    maxTotalPenalty: 50,
};

/**
 * Lenient penalty configuration (for roles with high volume)
 */
export const LENIENT_PENALTY_CONFIG: PenaltyConfig = {
    missingCriticalSkill: 3,
    experienceGapPerYear: 1,
    seniorityMismatch: 5,
    poorATSFormat: 2,
    maxTotalPenalty: 20,
};

// ============================================================================
// THRESHOLD CONFIGURATION
// ============================================================================

/**
 * Default threshold values for decision bands
 */
export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
    strongMatch: 85, // 85+ = Strong Match
    goodMatch: 70, // 70-84 = Good Match
    moderateMatch: 55, // 55-69 = Moderate Match
    weakMatch: 40, // 40-54 = Weak Match
    autoReject: 30, // Below 30 = Auto Reject (consider reject)
};

/**
 * High-bar thresholds (for competitive roles)
 */
export const HIGH_BAR_THRESHOLD_CONFIG: ThresholdConfig = {
    strongMatch: 90,
    goodMatch: 80,
    moderateMatch: 65,
    weakMatch: 50,
    autoReject: 40,
};

/**
 * Low-bar thresholds (for high-volume/entry-level roles)
 */
export const LOW_BAR_THRESHOLD_CONFIG: ThresholdConfig = {
    strongMatch: 75,
    goodMatch: 60,
    moderateMatch: 45,
    weakMatch: 30,
    autoReject: 20,
};

// ============================================================================
// COMPLETE SCORING CONFIGURATIONS
// ============================================================================

/**
 * Default complete scoring configuration
 */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
    weights: DEFAULT_SCORING_WEIGHTS,
    penalties: DEFAULT_PENALTY_CONFIG,
    thresholds: DEFAULT_THRESHOLD_CONFIG,
};

/**
 * Configuration for screening stage
 */
export const SCREENING_SCORING_CONFIG: ScoringConfig = {
    weights: SCREENING_WEIGHTS,
    penalties: LENIENT_PENALTY_CONFIG,
    thresholds: DEFAULT_THRESHOLD_CONFIG,
};

/**
 * Configuration for final stage
 */
export const FINAL_STAGE_SCORING_CONFIG: ScoringConfig = {
    weights: FINAL_STAGE_WEIGHTS,
    penalties: DEFAULT_PENALTY_CONFIG,
    thresholds: HIGH_BAR_THRESHOLD_CONFIG,
};

/**
 * Configuration for technical roles
 */
export const TECHNICAL_ROLE_SCORING_CONFIG: ScoringConfig = {
    weights: TECHNICAL_ROLE_WEIGHTS,
    penalties: STRICT_PENALTY_CONFIG,
    thresholds: DEFAULT_THRESHOLD_CONFIG,
};

/**
 * Configuration for management roles
 */
export const MANAGEMENT_ROLE_SCORING_CONFIG: ScoringConfig = {
    weights: MANAGEMENT_ROLE_WEIGHTS,
    penalties: DEFAULT_PENALTY_CONFIG,
    thresholds: DEFAULT_THRESHOLD_CONFIG,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get weights for a specific stage
 */
export function getWeightsForStage(
    stage: "screening" | "assessment" | "interview" | "final"
): ScoringWeights {
    switch (stage) {
        case "screening":
            return SCREENING_WEIGHTS;
        case "assessment":
            return { ...SCREENING_WEIGHTS, assessment: 0.2, semanticFit: 0.05 };
        case "interview":
            return { ...FINAL_STAGE_WEIGHTS, interview: 0.3, assessment: 0.1 };
        case "final":
            return FINAL_STAGE_WEIGHTS;
        default:
            return DEFAULT_SCORING_WEIGHTS;
    }
}

/**
 * Get configuration for a specific role type
 */
export function getConfigForRoleType(
    roleType: "technical" | "management" | "general"
): ScoringConfig {
    switch (roleType) {
        case "technical":
            return TECHNICAL_ROLE_SCORING_CONFIG;
        case "management":
            return MANAGEMENT_ROLE_SCORING_CONFIG;
        default:
            return DEFAULT_SCORING_CONFIG;
    }
}

/**
 * Validate that weights sum to approximately 1.0
 */
export function validateWeights(weights: ScoringWeights): {
    valid: boolean;
    sum: number;
    error?: string;
} {
    const sum = Object.values(weights).reduce((acc, val) => acc + val, 0);
    const isValid = Math.abs(sum - 1.0) < 0.001; // Allow tiny floating point errors

    return {
        valid: isValid,
        sum,
        error: isValid ? undefined : `Weights must sum to 1.0, current sum is ${sum.toFixed(3)}`,
    };
}

/**
 * Create custom scoring config with validation
 */
export function createScoringConfig(
    weights: Partial<ScoringWeights>,
    penalties?: Partial<PenaltyConfig>,
    thresholds?: Partial<ThresholdConfig>
): ScoringConfig {
    const mergedWeights: ScoringWeights = { ...DEFAULT_SCORING_WEIGHTS, ...weights };

    const validation = validateWeights(mergedWeights);
    if (!validation.valid) {
        throw new Error(`Invalid scoring config: ${validation.error}`);
    }

    return {
        weights: mergedWeights,
        penalties: { ...DEFAULT_PENALTY_CONFIG, ...penalties },
        thresholds: { ...DEFAULT_THRESHOLD_CONFIG, ...thresholds },
    };
}

/**
 * Calculate composite score from component scores using weights
 */
export function calculateCompositeScore(
    componentScores: Record<string, number>,
    weights: ScoringWeights
): number {
    let score = 0;

    if (componentScores.requirementCoverage !== undefined) {
        score += componentScores.requirementCoverage * weights.requirementCoverage;
    }
    if (componentScores.skillDepth !== undefined) {
        score += componentScores.skillDepth * weights.skillDepth;
    }
    if (componentScores.domainFit !== undefined) {
        score += componentScores.domainFit * weights.domainFit;
    }
    if (componentScores.semanticFit !== undefined) {
        score += componentScores.semanticFit * weights.semanticFit;
    }
    if (componentScores.assessment !== undefined) {
        score += componentScores.assessment * weights.assessment;
    }
    if (componentScores.interview !== undefined) {
        score += componentScores.interview * weights.interview;
    }
    if (componentScores.compensationLocationFit !== undefined) {
        score += componentScores.compensationLocationFit * weights.compensationLocationFit;
    }

    return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Apply penalties to a score
 */
export function applyPenalties(
    score: number,
    penaltyReasons: Array<{ type: keyof PenaltyConfig; count?: number }>,
    config: PenaltyConfig = DEFAULT_PENALTY_CONFIG
): {
    finalScore: number;
    totalPenalty: number;
    appliedPenalties: Array<{ type: string; value: number }>;
} {
    let totalPenalty = 0;
    const appliedPenalties: Array<{ type: string; value: number }> = [];

    for (const penalty of penaltyReasons) {
        let penaltyValue: number;

        switch (penalty.type) {
            case "missingCriticalSkill":
                penaltyValue = config.missingCriticalSkill * (penalty.count || 1);
                break;
            case "experienceGapPerYear":
                penaltyValue = config.experienceGapPerYear * (penalty.count || 1);
                break;
            case "seniorityMismatch":
                penaltyValue = config.seniorityMismatch;
                break;
            case "poorATSFormat":
                penaltyValue = config.poorATSFormat;
                break;
            default:
                penaltyValue = 0;
        }

        totalPenalty += penaltyValue;
        appliedPenalties.push({ type: penalty.type, value: penaltyValue });
    }

    // Cap at max penalty
    totalPenalty = Math.min(totalPenalty, config.maxTotalPenalty);

    return {
        finalScore: Math.max(0, score - totalPenalty),
        totalPenalty,
        appliedPenalties,
    };
}

/**
 * Get decision band based on score and thresholds
 */
export function getDecisionBand(
    score: number,
    thresholds: ThresholdConfig = DEFAULT_THRESHOLD_CONFIG
): "STRONG_MATCH" | "GOOD_MATCH" | "MODERATE_MATCH" | "WEAK_MATCH" | "NO_MATCH" {
    if (score >= thresholds.strongMatch) return "STRONG_MATCH";
    if (score >= thresholds.goodMatch) return "GOOD_MATCH";
    if (score >= thresholds.moderateMatch) return "MODERATE_MATCH";
    if (score >= thresholds.weakMatch) return "WEAK_MATCH";
    return "NO_MATCH";
}

/**
 * Get recommended action based on decision band
 */
export function getRecommendedAction(
    decisionBand: "STRONG_MATCH" | "GOOD_MATCH" | "MODERATE_MATCH" | "WEAK_MATCH" | "NO_MATCH"
): "ADVANCE" | "REVIEW" | "HOLD" | "REJECT" {
    switch (decisionBand) {
        case "STRONG_MATCH":
            return "ADVANCE";
        case "GOOD_MATCH":
            return "ADVANCE";
        case "MODERATE_MATCH":
            return "REVIEW";
        case "WEAK_MATCH":
            return "HOLD";
        case "NO_MATCH":
            return "REJECT";
    }
}
