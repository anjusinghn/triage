/**
 * @pendent/ats-engine
 * Comprehensive ATS Scoring Engine with Multi-LLM Support
 *
 * 5-Layer Output Structure:
 * 1. Core ATS Output (Machine-readable)
 * 2. Explainability Output (Recruiter-facing)
 * 3. Evidence Mapping (Audit-grade)
 * 4. ATS Decision Output (Workflow-level)
 * 5. Candidate Feedback (Optional)
 */

// ============================================================================
// Error Exports
// ============================================================================
export {
    ATSError,
    ValidationError as ATSValidationError,
    ExtractionError,
    LLMError,
    ScoringError,
    RateLimitError,
    ConnectionError,
    UnsupportedFileError,
    FileTooLargeError,
    // Type guards
    isATSError,
    isValidationError,
    isExtractionError,
    isLLMError,
    isScoringError,
    isRateLimitError,
    isConnectionError,
    isUnsupportedFileError,
    isFileTooLargeError,
} from "./errors";

// ============================================================================
// Type Exports
// ============================================================================
export type {
    // Input types
    LLMProvider,
    LLMConfig,
    CandidateInput,
    JobInput,
    ATSEngineInput,
    ATSEngineOptions,
    ATSConfig,
    LocationType,
    EmploymentType,
    ExperienceLevel,
    Urgency,
    SalaryPeriod,

    // Screening Configuration types (NEW)
    ScreeningScoringWeights,
    PenaltySettings,
    AutoRejectRules,
    AdvancedFilters,
    LocationPreferences,
    BiasReductionSettings,

    // Batch processing types
    BatchProcessingOptions,
    BatchProgress,
    BatchCandidateInput,
    BatchATSEngineInput,
    BatchCandidateResult,
    BatchATSEngineOutput,

    // Output types
    ATSEngineOutput,
    CoreATSOutput,
    ExplainabilityOutput,
    EvidenceMapping,
    ATSDecisionOutput,
    CandidateFeedback,
    DecisionBand,
    RecommendedAction,
    ReasonCode,
    ReadinessLevel,

    // Internal types
    ExtractionResult,
    ParseabilityResult,
    FormattingResult,
    StructureResult,
    LLMOutput,
    ValidatedLLMOutput,
    ScoreCaps,
    ValidationError,
    ATSEngineError,

    // Resume Parsing types
    ParsedSkill,
    WorkExperience,
    Education,
    ParsedResume,

    // Scoring Configuration types
    ScoringWeights,
    PenaltyConfig,
    ThresholdConfig,
    ScoringConfig,
    SkillMatchResult,
} from "./types";

export {
    DEFAULT_SCORE_CAPS,
    DEFAULT_ATS_CONFIG,
    // Screening Defaults (NEW)
    DEFAULT_SCREENING_WEIGHTS,
    DEFAULT_PENALTY_SETTINGS,
    DEFAULT_AUTO_REJECT_RULES,
    DEFAULT_ADVANCED_FILTERS,
    DEFAULT_LOCATION_PREFERENCES,
    DEFAULT_BIAS_REDUCTION,
} from "./types";

// ============================================================================
// Utility Exports
// ============================================================================
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
} from "./utils/index";

// ============================================================================
// Resume Parser Exports
// ============================================================================
export {
    extractSkills,
    extractWorkExperience,
    extractEducation,
    calculateTotalExperience,
    getHighestSeniority,
    parseResume,
    getSkillsByCategory,
    getDetectedIndustries,
} from "./extractors/resume-parser";

// ============================================================================
// Configuration Exports
// ============================================================================
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
} from "./config/index";

// ============================================================================
// Feedback Generator Exports
// ============================================================================
export {
    generateCandidateFeedback,
    generateRecruiterSummary,
    generateDetailedFeedback,
    formatFeedbackAsEmail,
    generateBatchSummary,
} from "./feedback/index";

// ============================================================================
// Service Exports
// ============================================================================
export {
    extractTextFromResume,
    normalizeResumeText,
    validateResumeInput,
    getSupportedFileTypes,
    SUPPORTED_MIME_TYPES,
    type ResumeInput,
    type SupportedMimeType,
} from "./extractors/text-extraction";
export { analyzeParseability } from "./analyzers/parseability";
export { analyzeFormatting } from "./analyzers/formatting";
export { analyzeStructure } from "./analyzers/structure";
export {
    analyzeWithLLM,
    createMockLLMOutput,
    shouldRejectLLMOutput,
} from "./analyzers/llm-analysis";
export { validateLLMOutput, createRuleBasedValidatedOutput } from "./validators/validation";
export {
    calculateCoreOutput,
    calculateRuleBasedScore,
    getGrade,
} from "./scoring/score-calculator";
export { generateATSOutput } from "./output/generator";

// ============================================================================
// Main Imports
// ============================================================================
import {
    extractTextFromResume,
    normalizeResumeText,
    validateResumeInput,
    type ResumeInput,
} from "./extractors/text-extraction";
import { analyzeParseability } from "./analyzers/parseability";
import { analyzeFormatting } from "./analyzers/formatting";
import { analyzeStructure } from "./analyzers/structure";
import {
    analyzeWithLLM,
    createMockLLMOutput,
    shouldRejectLLMOutput,
} from "./analyzers/llm-analysis";
import { validateLLMOutput, createRuleBasedValidatedOutput } from "./validators/validation";
import { generateATSOutput } from "./output/generator";
import { ValidationError, ExtractionError, LLMError, isATSError } from "./errors";
import type { ATSEngineInput, ATSEngineOutput, LLMConfig, LLMOutput, JobInput } from "./types";

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Run ATS scoring for a candidate against a job
 *
 * Supports all resume input types:
 * - PDF: Via resumeBuffer with mimeType "application/pdf"
 * - DOCX: Via resumeBuffer with mimeType "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
 * - DOC: Via resumeBuffer with mimeType "application/msword"
 * - TXT: Via resumeBuffer with mimeType "text/plain"
 * - URL: Via resumeUrl (for MinIO/S3 stored files)
 *
 * LLM Config is OPTIONAL:
 * - If provided: Uses LLM for enhanced analysis + rule-based scoring
 * - If not provided: Uses rule-based scoring only (faster, still accurate)
 *
 * @param input - Candidate info, job details, optional LLM config
 * @returns Complete 5-layer ATS output
 * @throws {ValidationError} If resume input is invalid
 * @throws {ExtractionError} If text extraction fails
 *
 * @example
 * // Without LLM (rule-based only)
 * const result = await scoreCandidate({
 *   candidate: { name: "John", resumeBuffer, resumeMimeType: "application/pdf" },
 *   job: jobData
 * });
 *
 * @example
 * // With LLM (enhanced analysis)
 * const result = await scoreCandidate({
 *   candidate: { name: "John", resumeBuffer, resumeMimeType: "application/pdf" },
 *   job: jobData,
 *   llmConfig: createLLMConfig("openai", apiKey)
 * });
 */
export async function scoreCandidate(input: ATSEngineInput): Promise<ATSEngineOutput> {
    const startTime = Date.now();
    const options = input.options ?? {};

    // Build resume input from candidate data
    const resumeInput: ResumeInput = {};

    if (input.candidate.resumeBuffer) {
        resumeInput.buffer = input.candidate.resumeBuffer;
        resumeInput.mimeType = input.candidate.resumeMimeType;
        resumeInput.fileName = input.candidate.resumeFileName;
    } else if (input.candidate.resumeUrl) {
        resumeInput.url = input.candidate.resumeUrl;
    } else {
        throw new ValidationError("Resume is required. Provide either resumeBuffer or resumeUrl.", {
            field: "candidate.resume",
        });
    }

    // Validate resume input
    const validation = validateResumeInput(resumeInput);
    if (!validation.valid) {
        throw new ValidationError(`Invalid resume: ${validation.errors.join(", ")}`, {
            field: "candidate.resume",
        });
    }

    // Extract text from resume (handles both buffer and URL)
    const extraction = await extractTextFromResume(resumeInput);
    if (!extraction.success || !extraction.text) {
        throw new ExtractionError(extraction.error ?? "Text extraction failed", "extract", {
            mimeType: input.candidate.resumeMimeType ?? "unknown",
        });
    }

    const normalizedText = normalizeResumeText(extraction.text);

    // Run rule-based analyzers
    const parseability = analyzeParseability(normalizedText);
    const formatting = analyzeFormatting(normalizedText);
    const structure = analyzeStructure(normalizedText);

    // Run LLM analysis if configured
    let llmOutput: LLMOutput | null = null;
    let llmUsed = false;

    if (input.llmConfig && !options.skipLLM) {
        try {
            llmOutput = await analyzeWithLLM(normalizedText, input.job, input.llmConfig);
            llmUsed = !shouldRejectLLMOutput(llmOutput);
        } catch (error) {
            // Log but don't throw - fall back to rule-based scoring
            console.warn("LLM analysis failed:", error);
            llmOutput = null;

            // If error is already an ATSError, rethrow if strict mode
            if (options.strictLLM && isATSError(error)) {
                throw error;
            }

            // In strict mode, throw LLM error
            if (options.strictLLM) {
                throw new LLMError(
                    error instanceof Error ? error.message : "LLM analysis failed",
                    input.llmConfig.provider,
                    { status: 500 }
                );
            }
        }
    }

    // Use mock output if LLM not available
    if (!llmOutput || shouldRejectLLMOutput(llmOutput)) {
        llmOutput = createMockLLMOutput();
        llmUsed = false;
    }

    // Validate LLM output
    const validated = llmUsed
        ? validateLLMOutput(llmOutput, normalizedText, input.job)
        : createRuleBasedValidatedOutput(normalizedText, input.job);

    // Generate complete output
    return generateATSOutput({
        jobId: input.job.id,
        candidateId: undefined,
        parseability,
        formatting,
        structure,
        validated,
        job: input.job,
        extractedText: extraction.text,
        normalizedText,
        llmUsed,
        llmProvider: llmUsed ? input.llmConfig?.provider : undefined,
        startTime,
        includeEvidence: options.includeEvidence,
        includeCandidateFeedback: options.includeCandidateFeedback,
        config: options.config,
    });
}

// ============================================================================
// Batch Processing
// ============================================================================

import type {
    BatchATSEngineInput,
    BatchATSEngineOutput,
    BatchCandidateResult,
    DecisionBand,
    RecommendedAction,
} from "./types";

/**
 * Process multiple candidates in batch with concurrency control
 *
 * Supports 1-1000 candidates per batch with configurable concurrency.
 * LLM is optional - if not provided, uses rule-based scoring only.
 *
 * @param input - Batch input with candidates, job, and options
 * @returns Complete batch output with rankings and statistics
 *
 * @example
 * ```typescript
 * const result = await scoreCandidateBatch({
 *   candidates: candidates.map((c, i) => ({ ...c, candidateId: `candidate-${i}` })),
 *   job: jobData,
 *   llmConfig: createLLMConfig("custom", apiKey), // Optional
 *   batchOptions: {
 *     concurrency: 10,
 *     onProgress: (p) => console.log(`Progress: ${p.percentage}%`)
 *   }
 * });
 * ```
 */
export async function scoreCandidateBatch(
    input: BatchATSEngineInput
): Promise<BatchATSEngineOutput> {
    const startTime = Date.now();
    const { candidates, job, llmConfig, options = {}, batchOptions = {} } = input;

    // Validate batch size
    const maxBatchSize = batchOptions.maxBatchSize ?? 1000;
    if (candidates.length === 0) {
        throw new ValidationError("Batch must contain at least one candidate", {
            field: "candidates",
        });
    }
    if (candidates.length > maxBatchSize) {
        throw new ValidationError(
            `Batch size ${candidates.length} exceeds maximum ${maxBatchSize}`,
            { field: "candidates" }
        );
    }

    // Set defaults
    const concurrency = Math.min(Math.max(1, batchOptions.concurrency ?? 10), 50);
    const continueOnError = batchOptions.continueOnError ?? true;
    const onProgress = batchOptions.onProgress;

    // Progress tracking
    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const processingTimes: number[] = [];

    const results: BatchCandidateResult[] = [];

    // Report initial progress
    if (onProgress) {
        onProgress({
            total: candidates.length,
            processed: 0,
            succeeded: 0,
            failed: 0,
            percentage: 0,
        });
    }

    // Process candidates in batches with concurrency control
    for (let i = 0; i < candidates.length; i += concurrency) {
        const batch = candidates.slice(i, i + concurrency);

        const batchPromises = batch.map(async (candidate): Promise<BatchCandidateResult> => {
            const candidateStartTime = Date.now();

            try {
                // Score using the main scoreCandidate function
                const output = await scoreCandidate({
                    candidate: {
                        name: candidate.name,
                        email: candidate.email,
                        phone: candidate.phone,
                        linkedinUrl: candidate.linkedinUrl,
                        githubUrl: candidate.githubUrl,
                        portfolioUrl: candidate.portfolioUrl,
                        coverLetter: candidate.coverLetter,
                        resumeBuffer: candidate.resumeBuffer,
                        resumeMimeType: candidate.resumeMimeType,
                        resumeFileName: candidate.resumeFileName,
                        resumeUrl: candidate.resumeUrl,
                    },
                    job,
                    llmConfig,
                    options,
                });

                const processingTimeMs = Date.now() - candidateStartTime;
                processingTimes.push(processingTimeMs);
                succeeded++;

                return {
                    candidateId: candidate.candidateId,
                    candidateName: candidate.name,
                    success: true,
                    output,
                    processingTimeMs,
                };
            } catch (error) {
                const processingTimeMs = Date.now() - candidateStartTime;
                processingTimes.push(processingTimeMs);
                failed++;

                const errorMessage = error instanceof Error ? error.message : "Unknown error";

                if (!continueOnError) {
                    throw error;
                }

                return {
                    candidateId: candidate.candidateId,
                    candidateName: candidate.name,
                    success: false,
                    error: errorMessage,
                    processingTimeMs,
                };
            }
        });

        // Wait for this batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Update progress
        processed += batch.length;
        if (onProgress) {
            const avgTime =
                processingTimes.length > 0
                    ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
                    : 0;
            const remaining = candidates.length - processed;
            const estimatedTimeRemaining = Math.round(avgTime * remaining);

            onProgress({
                total: candidates.length,
                processed,
                succeeded,
                failed,
                currentCandidate: batch[batch.length - 1]?.name,
                estimatedTimeRemaining,
                percentage: Math.round((processed / candidates.length) * 100),
            });
        }
    }

    // Calculate statistics
    const successfulResults = results.filter((r) => r.success && r.output);
    const scores = successfulResults.map((r) => r.output!.core.overallScore);
    const sortedScores = [...scores].sort((a, b) => a - b);

    const totalProcessingTimeMs = Date.now() - startTime;

    // Count decision bands
    const scoreDistribution = {
        strongMatch: 0,
        goodMatch: 0,
        moderateMatch: 0,
        weakMatch: 0,
        noMatch: 0,
    };

    for (const result of successfulResults) {
        const band = result.output!.core.decisionBand;
        switch (band) {
            case "STRONG_MATCH":
                scoreDistribution.strongMatch++;
                break;
            case "GOOD_MATCH":
                scoreDistribution.goodMatch++;
                break;
            case "MODERATE_MATCH":
                scoreDistribution.moderateMatch++;
                break;
            case "WEAK_MATCH":
                scoreDistribution.weakMatch++;
                break;
            case "NO_MATCH":
                scoreDistribution.noMatch++;
                break;
        }
    }

    // Calculate median
    const medianScore =
        sortedScores.length > 0
            ? sortedScores.length % 2 === 0
                ? (sortedScores[sortedScores.length / 2 - 1] +
                      sortedScores[sortedScores.length / 2]) /
                  2
                : sortedScores[Math.floor(sortedScores.length / 2)]
            : 0;

    // Create ranked candidates list
    const rankedCandidates = successfulResults
        .map((r) => ({
            candidateId: r.candidateId,
            candidateName: r.candidateName,
            overallScore: r.output!.core.overallScore,
            decisionBand: r.output!.core.decisionBand as DecisionBand,
            recommendedAction: r.output!.decision.recommendedAction as RecommendedAction,
        }))
        .sort((a, b) => b.overallScore - a.overallScore);

    return {
        summary: {
            totalCandidates: candidates.length,
            successfulScores: succeeded,
            failedScores: failed,
            totalProcessingTimeMs,
            averageProcessingTimeMs:
                processingTimes.length > 0
                    ? Math.round(
                          processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
                      )
                    : 0,
            llmUsed: !!llmConfig && !options.skipLLM,
        },
        results,
        rankedCandidates,
        statistics: {
            averageScore:
                scores.length > 0
                    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
                    : 0,
            medianScore: Math.round(medianScore),
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            scoreDistribution,
        },
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create LLM configuration (generic)
 */
export function createLLMConfig(
    provider: "openai" | "custom",
    apiKey: string,
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
        baseURL?: string;
        headers?: Record<string, string>;
    }
): LLMConfig {
    const defaults: Record<"openai" | "custom", { model: string }> = {
        openai: { model: "gpt-4o-mini" },
        custom: { model: "gpt-4o-mini" },
    };

    return {
        provider,
        apiKey,
        model: options?.model ?? defaults[provider].model,
        temperature: options?.temperature ?? 0.1,
        maxTokens: options?.maxTokens ?? 2000,
        baseURL: options?.baseURL,
        headers: options?.headers,
    };
}

/**
 * Create job input from minimal data
 */
export function createJobInput(
    id: string,
    title: string,
    description: string,
    skills?: {
        mustHave?: string[];
        niceToHave?: string[];
    },
    options?: Partial<JobInput>
): JobInput {
    return {
        id,
        title,
        description,
        mustHaveSkills: skills?.mustHave,
        niceToHaveSkills: skills?.niceToHave,
        ...options,
    };
}

// ============================================================================
// Alias Exports (for backwards compatibility with docs)
// ============================================================================

// Re-export resume parser functions with documented names
import {
    parseResume as _parseResume,
    extractSkills as _extractSkills,
    extractWorkExperience as _extractWorkExperience,
} from "./extractors/resume-parser";

/**
 * Parse full resume into structured data (alias for parseResume)
 * @alias parseResume
 */
export const parseFullResume = _parseResume;

/**
 * Extract skills from text (alias for extractSkills)
 * @alias extractSkills
 */
export const extractSkillsFromText = _extractSkills;

/**
 * Parse work history from text (alias for extractWorkExperience)
 * @alias extractWorkExperience
 */
export const parseWorkHistory = _extractWorkExperience;
