/**
 * Utilities Module
 * Re-exports all utility functions
 */

export {
    // Skill Normalizer
    SKILL_ALIASES,
    SKILL_CATEGORIES,
    normalizeSkill,
    normalizeSkills,
    getSkillCategory,
    areSkillsSimilar,
    getRelatedSkills,
    stringSimilarity,
    extractKeywords,
    extractNGrams,
    calculateTermFrequency,
    findFuzzyMatches,
    calculateKeywordSimilarity,
    calculateSkillMatchPercentage,
    scoreSkillsMatch,
} from "./skill-normalizer";
