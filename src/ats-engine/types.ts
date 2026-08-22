/**
 * @pendent/ats-engine
 * Complete Type Definitions
 *
 * 5-Layer Output Structure:
 * 1. Core ATS Output (Machine-readable)
 * 2. Explainability Output (Recruiter-facing)
 * 3. Evidence Mapping (Audit-grade)
 * 4. ATS Decision Output (Workflow-level)
 * 5. Candidate Feedback (Optional)
 */

// ============================================================================
// LLM Provider Configuration
// ============================================================================

export type LLMProvider = "openai" | "custom";

export interface LLMConfig {
    provider: LLMProvider;
    apiKey: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    baseURL?: string;
    headers?: Record<string, string>;
}

// ============================================================================
// Candidate Input (from jobs-pendent-fe apply form)
// ============================================================================

/**
 * Candidate input supporting both buffer and URL-based resume input.
 *
 * Resume can be provided either as:
 * 1. Buffer: resumeBuffer + resumeMimeType (for direct uploads)
 * 2. URL: resumeUrl (for MinIO/S3 stored files)
 *
 * If both are provided, resumeBuffer takes precedence.
 */
export interface CandidateInput {
    // Required fields
    name: string;
    email: string;
    phone: string;
    linkedinUrl: string;

    // Optional fields
    githubUrl?: string;
    portfolioUrl?: string;
    coverLetter?: string;

    // Resume (Option 1: Buffer-based)
    resumeBuffer?: Buffer;
    resumeMimeType?: string;
    resumeFileName?: string;

    // Resume (Option 2: URL-based for MinIO/S3 stored files)
    resumeUrl?: string;
}

// ============================================================================
// Job Input (from pendent-dashboard-be seed-jobs structure)
// ============================================================================

export type LocationType = "REMOTE" | "HYBRID" | "ONSITE";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP" | "FREELANCE";
export type ExperienceLevel = "FRESHER" | "ENTRY" | "MID" | "SENIOR" | "LEAD" | "EXECUTIVE";
export type Urgency = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SalaryPeriod = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface JobInput {
    // Required
    id: string;
    title: string;
    description: string;

    // Job details
    category?: string;
    department?: string;
    summary?: string;
    location?: string;
    locationType?: LocationType;
    employmentType?: EmploymentType;
    experienceLevel?: ExperienceLevel;
    urgency?: Urgency;

    // Salary
    salaryMin?: number;
    salaryMax?: number;
    salaryCurrency?: string;
    salaryPeriod?: SalaryPeriod;
    salaryDisclosed?: boolean;

    // Skills (CRITICAL for ATS scoring)
    skills?: string[];
    mustHaveSkills?: string[];
    niceToHaveSkills?: string[];

    // Experience
    requiredExperienceYears?: number;
    preferredIndustries?: string[];
}

// ============================================================================
// ATS Engine Input (combines candidate + job)
// ============================================================================

export interface ATSEngineInput {
    candidate: CandidateInput;
    job: JobInput;
    llmConfig?: LLMConfig;
    options?: ATSEngineOptions;
}

/**
 * Scoring weights for screening (must sum to 1.0)
 * These determine how much each component contributes to the final score.
 */
export interface ScreeningScoringWeights {
    /** Weight for skills/requirement coverage (default: 0.30) */
    skillsWeight?: number;
    /** Weight for experience match (default: 0.20) */
    experienceWeight?: number;
    /** Weight for domain/industry fit (default: 0.10) */
    domainWeight?: number;
    /** Weight for semantic/AI analysis fit (default: 0.10) */
    semanticWeight?: number;
    /** Weight for education match (default: 0.10) */
    educationWeight?: number;
    /** Weight for resume quality/parseability (default: 0.20) */
    resumeQualityWeight?: number;
}

/**
 * Penalty configuration for score deductions
 */
export interface PenaltySettings {
    /** Points deducted per missing critical skill (default: 5) */
    missingCriticalSkillPenalty?: number;
    /** Points deducted per year of experience gap (default: 2) */
    experienceGapPenaltyPerYear?: number;
    /** Points deducted for seniority level mismatch (default: 10) */
    seniorityMismatchPenalty?: number;
    /** Points deducted for poor ATS-friendly formatting (default: 5) */
    poorATSFormatPenalty?: number;
    /** Maximum total penalty that can be applied (default: 30) */
    maxTotalPenalty?: number;
}

/**
 * Auto-reject rules for automatic candidate disqualification
 */
export interface AutoRejectRules {
    /** Enable employment gap check (default: false) */
    employmentGapEnabled?: boolean;
    /** Maximum allowed employment gap in months (default: 6) */
    employmentGapMonths?: number;

    /** Enable job hopping check (default: false) */
    jobHoppingEnabled?: boolean;
    /** Number of jobs in period to trigger job hopping (default: 3) */
    jobHoppingCount?: number;
    /** Years to look back for job hopping (default: 2) */
    jobHoppingYears?: number;

    /** Enable no recent experience check (default: false) */
    noRecentExperienceEnabled?: boolean;
    /** Years without relevant experience to trigger (default: 3) */
    noRecentExperienceYears?: number;

    /** Require cover letter (default: false) */
    missingCoverLetterReject?: boolean;
}

/**
 * Advanced screening filters
 */
export interface AdvancedFilters {
    /** Minimum skill match percentage to pass (default: 50) */
    skillMatchThreshold?: number;
    /** Years of experience tolerance +/- (default: 2) */
    experienceTolerance?: number;

    /** Enable salary expectation filter (default: false) */
    salaryFilterEnabled?: boolean;
    /** Salary tolerance percentage (default: 10) */
    salaryTolerance?: number;

    /** Minimum education level: none, high_school, bachelors, masters, phd (default: "none") */
    minEducationLevel?: string;
    /** Allow experience to substitute for education (default: true) */
    educationEquivalence?: boolean;
}

/**
 * Location and remote work preferences
 */
export interface LocationPreferences {
    /** Preferred work mode: onsite, hybrid, remote, any (default: "any") */
    workModePreference?: "onsite" | "hybrid" | "remote" | "any";
    /** List of preferred/allowed countries (empty = all allowed) */
    preferredCountries?: string[];
    /** Accept candidates willing to relocate (default: true) */
    acceptRelocation?: boolean;
    /** Timezone restriction, e.g., "UTC-8 to UTC-5" (default: null) */
    timezoneRestriction?: string;
}

/**
 * Bias reduction settings for fair screening
 */
export interface BiasReductionSettings {
    /** Hide candidate names during scoring (default: false) */
    anonymizeNames?: boolean;
    /** Hide education institution names (default: false) */
    anonymizeEducationInstitution?: boolean;
    /** Hide graduation years to mask age (default: false) */
    anonymizeGraduationYear?: boolean;
}

/**
 * ATS Configuration
 * Allows customizing scoring behavior and decision thresholds.
 * These settings can be configured via the dashboard's ATS Preset builder.
 */
export interface ATSConfig {
    // === PASS/FAIL THRESHOLDS ===
    /** Score threshold for PASS decision (0-100, default: 60) */
    passThreshold?: number;

    // === HUMAN REVIEW THRESHOLDS ===
    /** Score below this on PASS requires human review (0-100, default: 75) */
    passReviewThreshold?: number;
    /** Score above this on FAIL requires human review (0-100, default: 50) */
    failReviewThreshold?: number;

    // === AUTO-REJECT RULES (legacy - use autoRejectRules instead) ===
    /** Number of missing critical skills to trigger auto-reject (default: 3) */
    missingSkillsAutoRejectCount?: number;

    // === QUEUE PRIORITY THRESHOLDS ===
    /** Score for priority 1 queue (default: 85) */
    priority1Threshold?: number;
    /** Score for priority 2 queue (default: 70) */
    priority2Threshold?: number;
    /** Score for priority 3 queue (default: 55) */
    priority3Threshold?: number;

    // === SCORING WEIGHTS ===
    /** Custom scoring weights for this preset */
    scoringWeights?: ScreeningScoringWeights;

    // === PENALTY CONFIGURATION ===
    /** Custom penalty settings */
    penalties?: PenaltySettings;

    // === AUTO-REJECT RULES ===
    /** Automatic disqualification rules */
    autoRejectRules?: AutoRejectRules;

    // === ADVANCED FILTERS ===
    /** Advanced screening filters */
    advancedFilters?: AdvancedFilters;

    // === LOCATION PREFERENCES ===
    /** Location and remote work preferences */
    locationPreferences?: LocationPreferences;

    // === BIAS REDUCTION ===
    /** Bias reduction settings for fair screening */
    biasReduction?: BiasReductionSettings;
}

/**
 * Default screening scoring weights
 */
/**
 * Default screening weights (sum to 1.0)
 */
export const DEFAULT_SCREENING_WEIGHTS: Required<ScreeningScoringWeights> = {
    skillsWeight: 0.3,
    experienceWeight: 0.2,
    domainWeight: 0.1,
    semanticWeight: 0.1,
    educationWeight: 0.1,
    resumeQualityWeight: 0.2,
};

/**
 * Default penalty settings
 */
export const DEFAULT_PENALTY_SETTINGS: Required<PenaltySettings> = {
    missingCriticalSkillPenalty: 5,
    experienceGapPenaltyPerYear: 2,
    seniorityMismatchPenalty: 10,
    poorATSFormatPenalty: 5,
    maxTotalPenalty: 30,
};

/**
 * Default auto-reject rules (all disabled by default)
 */
export const DEFAULT_AUTO_REJECT_RULES: Required<AutoRejectRules> = {
    employmentGapEnabled: false,
    employmentGapMonths: 6,
    jobHoppingEnabled: false,
    jobHoppingCount: 3,
    jobHoppingYears: 2,
    noRecentExperienceEnabled: false,
    noRecentExperienceYears: 3,
    missingCoverLetterReject: false,
};

/**
 * Default advanced filters
 */
export const DEFAULT_ADVANCED_FILTERS: Required<AdvancedFilters> = {
    skillMatchThreshold: 50,
    experienceTolerance: 2,
    salaryFilterEnabled: false,
    salaryTolerance: 10,
    minEducationLevel: "none",
    educationEquivalence: true,
};

/**
 * Default location preferences
 */
export const DEFAULT_LOCATION_PREFERENCES: Required<LocationPreferences> = {
    workModePreference: "any",
    preferredCountries: [],
    acceptRelocation: true,
    timezoneRestriction: "",
};

/**
 * Default bias reduction settings
 */
export const DEFAULT_BIAS_REDUCTION: Required<BiasReductionSettings> = {
    anonymizeNames: false,
    anonymizeEducationInstitution: false,
    anonymizeGraduationYear: false,
};

/**
 * Default ATS configuration values
 */
export const DEFAULT_ATS_CONFIG: Required<
    Omit<
        ATSConfig,
        | "scoringWeights"
        | "penalties"
        | "autoRejectRules"
        | "advancedFilters"
        | "locationPreferences"
        | "biasReduction"
    >
> & {
    scoringWeights: Required<ScreeningScoringWeights>;
    penalties: Required<PenaltySettings>;
    autoRejectRules: Required<AutoRejectRules>;
    advancedFilters: Required<AdvancedFilters>;
    locationPreferences: Required<LocationPreferences>;
    biasReduction: Required<BiasReductionSettings>;
} = {
    passThreshold: 60,
    passReviewThreshold: 75,
    failReviewThreshold: 50,
    missingSkillsAutoRejectCount: 3,
    priority1Threshold: 85,
    priority2Threshold: 70,
    priority3Threshold: 55,
    scoringWeights: DEFAULT_SCREENING_WEIGHTS,
    penalties: DEFAULT_PENALTY_SETTINGS,
    autoRejectRules: DEFAULT_AUTO_REJECT_RULES,
    advancedFilters: DEFAULT_ADVANCED_FILTERS,
    locationPreferences: DEFAULT_LOCATION_PREFERENCES,
    biasReduction: DEFAULT_BIAS_REDUCTION,
};

export interface ATSEngineOptions {
    /** Skip LLM analysis, use rule-based only */
    skipLLM?: boolean;
    /** Include evidence mapping in output */
    includeEvidence?: boolean;
    /** Include candidate feedback in output */
    includeCandidateFeedback?: boolean;
    /** Strict mode: require higher confidence thresholds */
    strictMode?: boolean;
    /** Minimum confidence to accept LLM output */
    minConfidence?: number;
    /** Strict LLM mode: throw error if LLM fails (default: false, falls back to rule-based) */
    strictLLM?: boolean;
    /** ATS configuration for customizing scoring behavior */
    config?: ATSConfig;
}

// ============================================================================
// Batch Processing Types
// ============================================================================

export interface BatchProcessingOptions {
    /** Maximum number of candidates to process concurrently (default: 10, max: 50) */
    concurrency?: number;
    /** Continue processing if individual candidate fails (default: true) */
    continueOnError?: boolean;
    /** Progress callback for tracking batch progress */
    onProgress?: (progress: BatchProgress) => void;
    /** Maximum candidates per batch (default: 1000) */
    maxBatchSize?: number;
}

export interface BatchProgress {
    /** Total candidates in batch */
    total: number;
    /** Number of candidates processed */
    processed: number;
    /** Number of successful scores */
    succeeded: number;
    /** Number of failed scores */
    failed: number;
    /** Current candidate being processed */
    currentCandidate?: string;
    /** Estimated time remaining in milliseconds */
    estimatedTimeRemaining?: number;
    /** Progress percentage (0-100) */
    percentage: number;
}

export interface BatchCandidateInput extends CandidateInput {
    /** Unique identifier for the candidate in this batch */
    candidateId: string;
}

export interface BatchATSEngineInput {
    candidates: BatchCandidateInput[];
    job: JobInput;
    llmConfig?: LLMConfig;
    options?: ATSEngineOptions;
    batchOptions?: BatchProcessingOptions;
}

export interface BatchCandidateResult {
    candidateId: string;
    candidateName: string;
    success: boolean;
    output?: ATSEngineOutput;
    error?: string;
    processingTimeMs: number;
}

export interface BatchATSEngineOutput {
    /** Summary of the batch processing */
    summary: {
        totalCandidates: number;
        successfulScores: number;
        failedScores: number;
        totalProcessingTimeMs: number;
        averageProcessingTimeMs: number;
        llmUsed: boolean;
    };
    /** Results for each candidate */
    results: BatchCandidateResult[];
    /** Candidates sorted by score (highest first) */
    rankedCandidates: Array<{
        candidateId: string;
        candidateName: string;
        overallScore: number;
        decisionBand: DecisionBand;
        recommendedAction: RecommendedAction;
    }>;
    /** Quick statistics */
    statistics: {
        averageScore: number;
        medianScore: number;
        highestScore: number;
        lowestScore: number;
        scoreDistribution: {
            strongMatch: number;
            goodMatch: number;
            moderateMatch: number;
            weakMatch: number;
            noMatch: number;
        };
    };
}

// ============================================================================
// LAYER 1: Core ATS Output (Machine-readable)
// ============================================================================

export type DecisionBand =
    | "STRONG_MATCH"
    | "GOOD_MATCH"
    | "MODERATE_MATCH"
    | "WEAK_MATCH"
    | "NO_MATCH";

export interface CoreATSOutput {
    overallScore: number; // 0-100
    decisionBand: DecisionBand;
    confidence: number; // 0-1

    componentScores: {
        skillsMatch: number; // 0-100
        experienceRelevance: number; // 0-100
        educationFit: number; // 0-100
        keywordCoverage: number; // 0-100
        seniorityFit: number; // 0-100
        parseability: number; // 0-100 (ATS-friendly format)
        formatting: number; // 0-100 (consistent formatting)
    };

    missingCriticalSkills: string[];

    matchedSkills: {
        exact: string[]; // Exact keyword matches
        semantic: string[]; // Semantically similar matches
    };

    /** Penalties applied to the score with explanations */
    appliedPenalties?: string[];
}

// ============================================================================
// LAYER 2: Explainability Output (Recruiter-facing)
// ============================================================================

export interface ExplainabilityOutput {
    summary: string; // One-line summary

    strengths: string[]; // What the candidate does well
    gaps: string[]; // What's missing
    riskFlags: string[]; // Red flags to review

    keyHighlights: {
        yearsOfExperience?: number;
        topSkills: string[];
        industryBackground?: string;
        educationLevel?: string;
    };
}

// ============================================================================
// LAYER 3: Evidence Mapping (Audit-grade)
// ============================================================================

export interface EvidenceMapping {
    /** Skill -> Evidence quotes from resume */
    skillEvidence: Record<string, string[]>;

    /** Experience claims with supporting text */
    experienceEvidence: Array<{
        claim: string;
        evidence: string;
        confidence: number;
    }>;

    /** Where in resume each data point was found */
    sourceLocations: Record<string, string>;
}

// ============================================================================
// LAYER 4: ATS Decision Output (Workflow-level)
// ============================================================================

export type RecommendedAction = "PASS" | "FAIL";

export type ReasonCode =
    | "STRONG_SKILLS_MATCH"
    | "EXPERIENCE_ALIGNED"
    | "MISSING_CRITICAL_SKILLS"
    | "MISSING_NON_CRITICAL_SKILLS"
    | "INSUFFICIENT_EXPERIENCE"
    | "OVERQUALIFIED"
    | "SENIORITY_MISMATCH"
    | "POOR_ATS_FORMAT"
    | "INCOMPLETE_PROFILE";

export interface ATSDecisionOutput {
    recommendedAction: RecommendedAction;
    autoReject: boolean;
    humanReviewRequired: boolean;
    reasonCodes: ReasonCode[];

    /** Priority in screening queue (1 = highest) */
    queuePriority: number;

    /** Suggested next step */
    suggestedNextStep?: string;

    /** Reasons for auto-rejection from rule-based checks */
    autoRejectReasons?: string[];

    /** Advanced filters that the candidate failed */
    failedFilters?: string[];
}

// ============================================================================
// LAYER 5: Candidate Feedback (Optional)
// ============================================================================

export type ReadinessLevel = "READY" | "NEAR_READY" | "NEEDS_WORK" | "NOT_READY";

export interface CandidateFeedback {
    readinessLevel: ReadinessLevel;

    /** What they're doing well */
    positives: string[];

    /** Specific improvements */
    improvementSuggestions: string[];

    /** Skills to add or highlight */
    skillsToHighlight: string[];

    /** Format/structure suggestions */
    formatSuggestions: string[];

    /** Estimated score improvement if suggestions followed */
    potentialScoreImprovement: number;
}

// ============================================================================
// Complete ATS Engine Output (All 5 Layers)
// ============================================================================

export interface ATSEngineOutput {
    // Metadata
    candidateId?: string;
    jobId: string;
    processedAt: string;
    processingTimeMs: number;
    llmUsed: boolean;
    llmProvider?: LLMProvider;

    // Layer 1: Core (always present)
    core: CoreATSOutput;

    // Layer 2: Explainability (always present)
    explanation: ExplainabilityOutput;

    // Layer 3: Evidence (optional, if includeEvidence=true)
    evidence?: EvidenceMapping;

    // Layer 4: Decision (always present)
    decision: ATSDecisionOutput;

    // Layer 5: Candidate Feedback (optional, if includeCandidateFeedback=true)
    candidateFeedback?: CandidateFeedback;

    // Raw extracted data
    extractedText: string;
    normalizedText: string;
}

// ============================================================================
// Internal Analysis Types (used by analyzers)
// ============================================================================

export interface ExtractionResult {
    success: boolean;
    text: string | null;
    error?: string;
    metadata?: {
        pageCount?: number;
        wordCount?: number;
        hasImages?: boolean;
    };
}

export interface ParseabilityResult {
    score: number; // 0-25 (raw score)
    percentage: number; // 0-100 (normalized)
    issues: Array<{
        type:
            | "multi-column"
            | "table"
            | "text-box"
            | "header-content"
            | "special-chars"
            | "image-heavy";
        severity: "critical" | "warning";
        description: string;
        impact: number;
    }>;
    isATSFriendly: boolean;
}

export interface FormattingResult {
    score: number; // 0-20 (raw score)
    percentage: number; // 0-100 (normalized)
    issues: Array<{
        type:
            | "bullet-inconsistency"
            | "whitespace"
            | "date-format"
            | "section-headers"
            | "length"
            | "hierarchy";
        severity: "critical" | "warning" | "minor";
        description: string;
        suggestion: string;
    }>;
    metrics: {
        bulletConsistency: number;
        dateConsistency: number;
        sectionClarity: number;
        lengthScore: number;
    };
}

export interface StructureResult {
    score: number; // 0-10 (raw score)
    percentage: number; // 0-100 (normalized)
    sections: {
        found: string[];
        missing: string[];
        order: string[];
    };
    issues: Array<{
        type: "missing-section" | "wrong-order" | "duplicate-section" | "unclear-naming";
        severity: "critical" | "warning";
        description: string;
        section?: string;
    }>;
}

// ============================================================================
// LLM Analysis Types
// ============================================================================

export interface LLMOutput {
    semanticScore: number; // 0-100
    skillsMatch: string[];
    experienceAlignment: number; // 0-100

    keyFindings: {
        strengths: string[];
        gaps: string[];
        risks: string[];
    };

    skillsAnalysis: {
        matched: string[];
        missing: string[];
        inferred: string[];
    };

    experienceAnalysis: {
        totalYears: number;
        relevantYears: number;
        highlights: string[];
    };

    educationAnalysis: {
        level: string;
        relevance: number;
        details?: string;
    };

    confidence: number;
    reasoning?: string;
}

export interface ValidatedLLMOutput {
    // Validated scores (capped to maxes)
    semanticScore: number; // 0-30
    skillsScore: number; // 0-10
    experienceScore: number; // 0-10
    educationScore: number; // 0-10

    // Verified data
    verifiedSkills: Array<{
        skill: string;
        evidence: string;
        confidence: number;
    }>;
    unverifiedClaims: string[];

    // Pass-through from LLM
    strengths: string[];
    gaps: string[];
    risks: string[];

    totalYears: number;
    relevantYears: number;
    educationLevel: string;
    educationRelevance: number;

    confidence: number;
}

// ============================================================================
// Score Caps Configuration
// ============================================================================

export interface ScoreCaps {
    parseability: number; // Default: 25
    formatting: number; // Default: 20
    structure: number; // Default: 10
    semantic: number; // Default: 30
    skills: number; // Default: 10
    experience: number; // Default: 10
    education: number; // Default: 10
}

export const DEFAULT_SCORE_CAPS: ScoreCaps = {
    parseability: 25,
    formatting: 20,
    structure: 10,
    semantic: 30,
    skills: 10,
    experience: 10,
    education: 10,
};

// ============================================================================
// Utility Types
// ============================================================================

export interface ValidationError {
    field: string;
    message: string;
    code: string;
}

export interface ATSEngineError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
}

// ============================================================================
// Resume Parsing Types
// ============================================================================

export interface ParsedSkill {
    /** Original skill name as found */
    name: string;
    /** Normalized skill name for matching */
    normalizedName: string;
    /** Years of experience with this skill */
    yearsOfExperience?: number;
    /** Last time skill was used (year) */
    lastUsed?: string;
    /** Proficiency level */
    proficiency?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface WorkExperience {
    /** Company name */
    company: string;
    /** Job title */
    title: string;
    /** Start date (YYYY or YYYY-MM) */
    startDate: string;
    /** End date (YYYY or YYYY-MM), undefined if current */
    endDate?: string;
    /** Is this the current position */
    isCurrent: boolean;
    /** Job description */
    description?: string;
    /** Industry classification */
    industry?: string;
    /** Seniority level */
    seniorityLevel?: "entry" | "mid" | "senior" | "lead" | "manager" | "director" | "executive";
}

export interface Education {
    /** Institution name */
    institution: string;
    /** Degree name */
    degree: string;
    /** Field of study */
    field: string;
    /** Graduation year */
    graduationYear?: number;
    /** Education level */
    level:
        | "high_school"
        | "associate"
        | "bachelor"
        | "master"
        | "phd"
        | "bootcamp"
        | "certification";
}

export interface ParsedResume {
    /** Extracted skills */
    skills: ParsedSkill[];
    /** Work experience history */
    workExperience: WorkExperience[];
    /** Education history */
    education: Education[];
    /** Total years of experience */
    totalYearsExperience: number;
    /** Highest seniority level achieved */
    highestSeniority: WorkExperience["seniorityLevel"];
}

// ============================================================================
// Scoring Configuration Types
// ============================================================================

export interface ScoringWeights {
    /** Weight for requirement coverage (0-1) */
    requirementCoverage: number;
    /** Weight for skill depth (0-1) */
    skillDepth: number;
    /** Weight for domain fit (0-1) */
    domainFit: number;
    /** Weight for semantic fit (0-1) */
    semanticFit: number;
    /** Weight for assessment score (0-1) */
    assessment: number;
    /** Weight for interview score (0-1) */
    interview: number;
    /** Weight for compensation/location fit (0-1) */
    compensationLocationFit: number;
}

export interface PenaltyConfig {
    /** Penalty for missing critical skill */
    missingCriticalSkill: number;
    /** Penalty for experience gap (per year) */
    experienceGapPerYear: number;
    /** Penalty for seniority mismatch */
    seniorityMismatch: number;
    /** Penalty for poor ATS formatting */
    poorATSFormat: number;
    /** Maximum total penalty */
    maxTotalPenalty: number;
}

export interface ThresholdConfig {
    /** Score threshold for strong match */
    strongMatch: number;
    /** Score threshold for good match */
    goodMatch: number;
    /** Score threshold for moderate match */
    moderateMatch: number;
    /** Score threshold for weak match */
    weakMatch: number;
    /** Score threshold for auto-reject */
    autoReject: number;
}

export interface ScoringConfig {
    weights: ScoringWeights;
    penalties: PenaltyConfig;
    thresholds: ThresholdConfig;
}

// ============================================================================
// Skill Match Types
// ============================================================================

export interface SkillMatchResult {
    /** Overall match percentage (0-100) */
    totalScore: number;
    /** Required skills match percentage */
    requiredScore: number;
    /** Preferred skills match percentage */
    preferredScore: number;
    /** Detailed breakdown */
    details: {
        requiredMatched: string[];
        requiredMissing: string[];
        preferredMatched: string[];
        preferredMissing: string[];
    };
}
