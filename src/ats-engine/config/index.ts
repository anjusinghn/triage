/**
 * Configuration Module
 * Re-exports all configuration options
 */

export {
    // Weight Configurations
    DEFAULT_SCORING_WEIGHTS,
    SCREENING_WEIGHTS,
    FINAL_STAGE_WEIGHTS,
    TECHNICAL_ROLE_WEIGHTS,
    MANAGEMENT_ROLE_WEIGHTS,

    // Penalty Configurations
    DEFAULT_PENALTY_CONFIG,
    STRICT_PENALTY_CONFIG,
    LENIENT_PENALTY_CONFIG,

    // Threshold Configurations
    DEFAULT_THRESHOLD_CONFIG,
    HIGH_BAR_THRESHOLD_CONFIG,
    LOW_BAR_THRESHOLD_CONFIG,

    // Complete Configurations
    DEFAULT_SCORING_CONFIG,
    SCREENING_SCORING_CONFIG,
    FINAL_STAGE_SCORING_CONFIG,
    TECHNICAL_ROLE_SCORING_CONFIG,
    MANAGEMENT_ROLE_SCORING_CONFIG,

    // Utility Functions
    getWeightsForStage,
    getConfigForRoleType,
    validateWeights,
    createScoringConfig,
    calculateCompositeScore,
    applyPenalties,
    getDecisionBand,
    getRecommendedAction,
} from "./scoring-weights";
