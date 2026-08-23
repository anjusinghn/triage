/**
 * Output Generator
 * Generates all 5 layers of ATS output with customizable configuration
 */

import type {
    ATSEngineOutput,
    CoreATSOutput,
    ExplainabilityOutput,
    EvidenceMapping,
    ATSDecisionOutput,
    CandidateFeedback,
    RecommendedAction,
    ReasonCode,
    ReadinessLevel,
    ParseabilityResult,
    FormattingResult,
    StructureResult,
    ValidatedLLMOutput,
    JobInput,
    LLMProvider,
    ATSConfig,
    AutoRejectRules,
    AdvancedFilters,
} from "../types";
import {
    DEFAULT_ATS_CONFIG,
    DEFAULT_AUTO_REJECT_RULES,
    DEFAULT_ADVANCED_FILTERS,
    DEFAULT_LOCATION_PREFERENCES,
    DEFAULT_BIAS_REDUCTION,
} from "../types";
import { calculateCoreOutput, getGrade } from "../scoring/score-calculator";

interface GenerateOutputParams {
    jobId: string;
    candidateId?: string;
    parseability: ParseabilityResult;
    formatting: FormattingResult;
    structure: StructureResult;
    validated: ValidatedLLMOutput;
    job: JobInput;
    extractedText: string;
    normalizedText: string;
    llmUsed: boolean;
    llmProvider?: LLMProvider;
    startTime: number;
    includeEvidence?: boolean;
    includeCandidateFeedback?: boolean;
    /** ATS configuration for customizing thresholds */
    config?: ATSConfig;
}

/**
 * Generate complete 5-layer ATS output with full configuration support
 */
export function generateATSOutput(params: GenerateOutputParams): ATSEngineOutput {
    const {
        jobId,
        candidateId,
        parseability,
        formatting,
        structure,
        validated,
        job,
        extractedText,
        normalizedText,
        llmUsed,
        llmProvider,
        startTime,
        includeEvidence = false,
        includeCandidateFeedback = false,
        config,
    } = params;

    // Merge all config sections with defaults
    const atsConfig = {
        ...DEFAULT_ATS_CONFIG,
        ...config,
        autoRejectRules: { ...DEFAULT_AUTO_REJECT_RULES, ...config?.autoRejectRules },
        advancedFilters: { ...DEFAULT_ADVANCED_FILTERS, ...config?.advancedFilters },
        locationPreferences: { ...DEFAULT_LOCATION_PREFERENCES, ...config?.locationPreferences },
        biasReduction: { ...DEFAULT_BIAS_REDUCTION, ...config?.biasReduction },
    };

    // Layer 1: Core ATS Output (with custom weights and penalties)
    const core = calculateCoreOutput(parseability, formatting, structure, validated, job, config);

    // Check auto-reject rules
    const autoRejectResult = checkAutoRejectRules(
        validated,
        job,
        core,
        atsConfig.autoRejectRules as Required<AutoRejectRules>
    );

    // Check advanced filters
    const filterResult = checkAdvancedFilters(
        core,
        validated,
        job,
        atsConfig.advancedFilters as Required<AdvancedFilters>
    );

    // Layer 2: Explainability Output
    const explanation = generateExplanation(core, validated, job);

    // Layer 4: Decision Output (with auto-reject and filter results)
    const decision = generateDecision(
        core,
        validated,
        parseability,
        atsConfig,
        autoRejectResult,
        filterResult
    );

    // Build output
    const output: ATSEngineOutput = {
        candidateId,
        jobId,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        llmUsed,
        llmProvider,
        core,
        explanation,
        decision,
        extractedText,
        normalizedText,
    };

    // Layer 3: Evidence (optional)
    if (includeEvidence) {
        output.evidence = generateEvidence(validated, normalizedText);
    }

    // Layer 5: Candidate Feedback (optional)
    if (includeCandidateFeedback) {
        output.candidateFeedback = generateCandidateFeedback(
            core,
            parseability,
            formatting,
            structure,
            validated
        );
    }

    return output;
}

/**
 * Check auto-reject rules and return triggered rules
 */
function checkAutoRejectRules(
    validated: ValidatedLLMOutput,
    _job: JobInput,
    _core: CoreATSOutput,
    rules: Required<AutoRejectRules>
): { shouldReject: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // 1. Missing critical skills check (already in config)
    // This is handled in generateDecision via missingSkillsAutoRejectCount

    // 2. Employment gap check
    if (rules.employmentGapEnabled) {
        const hasLargeGap = checkEmploymentGap(validated, rules.employmentGapMonths);
        if (hasLargeGap) {
            reasons.push(`Employment gap exceeds ${rules.employmentGapMonths} months`);
        }
    }

    // 3. Job hopping check
    if (rules.jobHoppingEnabled) {
        const isJobHopper = checkJobHopping(
            validated,
            rules.jobHoppingCount,
            rules.jobHoppingYears
        );
        if (isJobHopper) {
            reasons.push(
                `Job hopping detected: ${rules.jobHoppingCount}+ jobs in ${rules.jobHoppingYears} years`
            );
        }
    }

    // 4. No recent experience check
    if (rules.noRecentExperienceEnabled) {
        const noRecentExp = checkNoRecentExperience(validated, rules.noRecentExperienceYears);
        if (noRecentExp) {
            reasons.push(`No relevant experience in last ${rules.noRecentExperienceYears} years`);
        }
    }

    // 5. Missing cover letter check (would need to be passed in candidate input)
    // This would be checked at input validation level

    return {
        shouldReject: reasons.length > 0,
        reasons,
    };
}

/**
 * Check for employment gaps
 */
function checkEmploymentGap(validated: ValidatedLLMOutput, maxGapMonths: number): boolean {
    // This would require work history analysis
    // For now, estimate based on total years vs relevant years
    const totalYears = validated.totalYears;
    const relevantYears = validated.relevantYears;

    // If there's a significant gap between total and relevant, flag it
    const gapYears = totalYears - relevantYears;
    const gapMonths = gapYears * 12;

    return gapMonths > maxGapMonths;
}

/**
 * Check for job hopping pattern
 */
function checkJobHopping(
    validated: ValidatedLLMOutput,
    maxJobs: number,
    withinYears: number
): boolean {
    // This would require detailed work history
    // Estimate based on average tenure
    if (validated.totalYears === 0) return false;

    const avgTenure = validated.totalYears / Math.max(validated.verifiedSkills.length / 3, 1);

    // If average tenure is less than withinYears/maxJobs, likely job hopping
    const expectedTenure = withinYears / maxJobs;
    return avgTenure < expectedTenure;
}

/**
 * Check for no recent experience
 */
function checkNoRecentExperience(validated: ValidatedLLMOutput, years: number): boolean {
    // This would ideally check actual dates
    // For now, use a heuristic based on skills currency
    // If no skills verified and low experience, flag it
    return validated.relevantYears === 0 && validated.totalYears > years;
}

/**
 * Check advanced filters
 */
function checkAdvancedFilters(
    core: CoreATSOutput,
    validated: ValidatedLLMOutput,
    job: JobInput,
    filters: Required<AdvancedFilters>
): { passed: boolean; failedFilters: string[] } {
    const failedFilters: string[] = [];

    // 1. Skill match threshold
    if (core.componentScores.skillsMatch < filters.skillMatchThreshold) {
        failedFilters.push(
            `Skill match ${core.componentScores.skillsMatch}% below threshold ${filters.skillMatchThreshold}%`
        );
    }

    // 2. Experience tolerance
    const requiredYears = job.requiredExperienceYears ?? 0;
    if (requiredYears > 0) {
        const minYears = Math.max(0, requiredYears - filters.experienceTolerance);
        if (validated.relevantYears < minYears) {
            failedFilters.push(
                `Experience ${validated.relevantYears} years below minimum ${minYears} years`
            );
        }
    }

    // 3. Salary filter (would need candidate salary expectation)
    // Skipped - requires candidate input

    // 4. Education level check
    if (filters.minEducationLevel !== "none") {
        const meetsEducation = checkEducationLevel(
            validated.educationLevel,
            filters.minEducationLevel,
            filters.educationEquivalence,
            validated.relevantYears
        );
        if (!meetsEducation) {
            failedFilters.push(
                `Education level ${validated.educationLevel} below required ${filters.minEducationLevel}`
            );
        }
    }

    return {
        passed: failedFilters.length === 0,
        failedFilters,
    };
}

/**
 * Check if candidate meets education requirements
 */
function checkEducationLevel(
    candidateLevel: string,
    requiredLevel: string,
    allowEquivalence: boolean,
    experienceYears: number
): boolean {
    const levelOrder: Record<string, number> = {
        none: 0,
        high_school: 1,
        bachelors: 2,
        masters: 3,
        phd: 4,
    };

    const candidateRank = levelOrder[candidateLevel.toLowerCase()] ?? 0;
    const requiredRank = levelOrder[requiredLevel.toLowerCase()] ?? 0;

    if (candidateRank >= requiredRank) return true;

    // Check experience equivalence (4 years exp = 1 education level)
    if (allowEquivalence) {
        const equivalentLevels = Math.floor(experienceYears / 4);
        return candidateRank + equivalentLevels >= requiredRank;
    }

    return false;
}

/**
 * Layer 2: Generate Explainability Output
 */
function generateExplanation(
    core: CoreATSOutput,
    validated: ValidatedLLMOutput,
    job: JobInput
): ExplainabilityOutput {
    const summary = generateSummary(core, validated);

    return {
        summary,
        strengths:
            validated.strengths.length > 0
                ? validated.strengths
                : generateStrengths(core, validated),
        gaps: validated.gaps.length > 0 ? validated.gaps : generateGaps(core, validated, job),
        riskFlags: validated.risks.length > 0 ? validated.risks : generateRisks(core, validated),
        keyHighlights: {
            yearsOfExperience: validated.totalYears > 0 ? validated.totalYears : undefined,
            topSkills: validated.verifiedSkills.slice(0, 5).map((s) => s.skill),
            industryBackground: undefined,
            educationLevel:
                validated.educationLevel !== "other" ? validated.educationLevel : undefined,
        },
    };
}

function generateSummary(core: CoreATSOutput, _validated: ValidatedLLMOutput): string {
    const grade = getGrade(core.overallScore);

    if (core.overallScore >= 85) {
        return `Excellent candidate match (${core.overallScore}/100, Grade ${grade}). Strong alignment with job requirements.`;
    } else if (core.overallScore >= 70) {
        return `Good candidate match (${core.overallScore}/100, Grade ${grade}). ${core.missingCriticalSkills.length > 0 ? `Missing: ${core.missingCriticalSkills.slice(0, 2).join(", ")}` : "Meets the required skills for this role."}`;
    } else if (core.overallScore >= 55) {
        return `Moderate match (${core.overallScore}/100, Grade ${grade}). ${core.missingCriticalSkills.length} critical skills missing.`;
    } else {
        return `Weak match (${core.overallScore}/100, Grade ${grade}). Significant gaps in required qualifications.`;
    }
}

function generateStrengths(core: CoreATSOutput, validated: ValidatedLLMOutput): string[] {
    const strengths: string[] = [];

    if (validated.verifiedSkills.length >= 5) {
        strengths.push(`${validated.verifiedSkills.length} relevant skills verified`);
    }
    if (validated.relevantYears >= 5) {
        strengths.push(`${validated.relevantYears}+ years relevant experience`);
    }
    if (core.componentScores.parseability >= 80) {
        strengths.push("ATS-friendly resume format");
    }
    if (core.componentScores.keywordCoverage >= 70) {
        strengths.push("Strong keyword alignment");
    }
    if (core.matchedSkills.exact.length >= 3) {
        strengths.push(`Key skills present: ${core.matchedSkills.exact.slice(0, 3).join(", ")}`);
    }

    return strengths.length > 0 ? strengths : ["Resume successfully parsed"];
}

function generateGaps(core: CoreATSOutput, validated: ValidatedLLMOutput, job: JobInput): string[] {
    const gaps: string[] = [];

    if (core.missingCriticalSkills.length > 0) {
        gaps.push(`Missing required skills: ${core.missingCriticalSkills.slice(0, 3).join(", ")}`);
    }
    if (job.requiredExperienceYears && validated.relevantYears < job.requiredExperienceYears) {
        gaps.push(
            `Experience gap: ${validated.relevantYears} years vs ${job.requiredExperienceYears} required`
        );
    }
    if (core.componentScores.keywordCoverage < 50) {
        gaps.push("Low keyword coverage from job description");
    }

    return gaps;
}

function generateRisks(core: CoreATSOutput, validated: ValidatedLLMOutput): string[] {
    const risks: string[] = [];

    if (core.componentScores.parseability < 60) {
        risks.push("Resume format may cause parsing issues");
    }
    if (validated.confidence < 0.5) {
        risks.push("Low confidence in analysis - manual review recommended");
    }
    if (core.missingCriticalSkills.length >= 3) {
        risks.push("Multiple critical skills missing - may not meet minimum qualifications");
    }

    return risks;
}

/**
 * Layer 3: Generate Evidence Mapping
 */
function generateEvidence(validated: ValidatedLLMOutput, _resumeText: string): EvidenceMapping {
    const skillEvidence: Record<string, string[]> = {};

    for (const skill of validated.verifiedSkills) {
        if (skill.evidence) {
            skillEvidence[skill.skill] = [skill.evidence];
        }
    }

    return {
        skillEvidence,
        experienceEvidence: validated.verifiedSkills
            .filter((s) => s.evidence)
            .map((s) => ({
                claim: s.skill,
                evidence: s.evidence,
                confidence: s.confidence,
            })),
        sourceLocations: {},
    };
}

/**
 * Layer 4: Generate Decision Output
 */
function generateDecision(
    core: CoreATSOutput,
    validated: ValidatedLLMOutput,
    parseability: ParseabilityResult,
    config: ATSConfig & {
        autoRejectRules?: Required<AutoRejectRules>;
        advancedFilters?: Required<AdvancedFilters>;
    },
    autoRejectResult?: { shouldReject: boolean; reasons: string[] },
    filterResult?: { passed: boolean; failedFilters: string[] }
): ATSDecisionOutput {
    const reasonCodes: ReasonCode[] = [];
    let action: RecommendedAction;
    let autoReject = false;
    let humanReviewRequired = false;
    const allRejectReasons: string[] = [];

    // Determine reason codes
    if (core.matchedSkills.exact.length >= 3) {
        reasonCodes.push("STRONG_SKILLS_MATCH");
    }
    if (validated.relevantYears >= 3) {
        reasonCodes.push("EXPERIENCE_ALIGNED");
    }
    if (core.missingCriticalSkills.length > 0) {
        reasonCodes.push("MISSING_CRITICAL_SKILLS");
    }
    if (core.missingCriticalSkills.length === 0 && core.componentScores.skillsMatch < 80) {
        reasonCodes.push("MISSING_NON_CRITICAL_SKILLS");
    }
    if (!parseability.isATSFriendly) {
        reasonCodes.push("POOR_ATS_FORMAT");
    }

    // Check auto-reject from rule-based evaluation
    if (autoRejectResult?.shouldReject) {
        autoReject = true;
        allRejectReasons.push(...autoRejectResult.reasons);
    }

    // Check advanced filter failures
    if (filterResult && !filterResult.passed) {
        allRejectReasons.push(...filterResult.failedFilters);
        humanReviewRequired = true; // Filters may need review
    }

    // Merge config with defaults for thresholds
    const passThreshold = config.passThreshold ?? DEFAULT_ATS_CONFIG.passThreshold;
    const passReviewThreshold =
        config.passReviewThreshold ?? DEFAULT_ATS_CONFIG.passReviewThreshold;
    const failReviewThreshold =
        config.failReviewThreshold ?? DEFAULT_ATS_CONFIG.failReviewThreshold;
    const missingSkillsAutoRejectCount =
        config.missingSkillsAutoRejectCount ?? DEFAULT_ATS_CONFIG.missingSkillsAutoRejectCount;
    const priority1Threshold = config.priority1Threshold ?? DEFAULT_ATS_CONFIG.priority1Threshold;
    const priority2Threshold = config.priority2Threshold ?? DEFAULT_ATS_CONFIG.priority2Threshold;
    const priority3Threshold = config.priority3Threshold ?? DEFAULT_ATS_CONFIG.priority3Threshold;

    // PASS/FAIL decision using configurable thresholds
    if (autoReject) {
        // Auto-reject from rules takes precedence
        action = "FAIL";
        humanReviewRequired = false; // Rules are definitive
    } else if (core.overallScore >= passThreshold) {
        action = "PASS";
        humanReviewRequired = core.overallScore < passReviewThreshold;
    } else {
        action = "FAIL";
        autoReject = core.missingCriticalSkills.length >= missingSkillsAutoRejectCount;
        humanReviewRequired = core.overallScore >= failReviewThreshold;
    }

    // Calculate queue priority using configurable thresholds (1 = highest)
    const queuePriority =
        core.overallScore >= priority1Threshold
            ? 1
            : core.overallScore >= priority2Threshold
              ? 2
              : core.overallScore >= priority3Threshold
                ? 3
                : 4;

    // Build suggested next step
    const suggestedNextStep =
        autoReject && allRejectReasons.length > 0
            ? `Auto-rejected: ${allRejectReasons.slice(0, 2).join("; ")}`
            : getSuggestedNextStep(action, reasonCodes);

    return {
        recommendedAction: action,
        autoReject,
        humanReviewRequired,
        reasonCodes,
        queuePriority,
        suggestedNextStep,
        // Add new fields for reject/filter reasons
        autoRejectReasons: autoRejectResult?.shouldReject ? autoRejectResult.reasons : undefined,
        failedFilters: filterResult?.passed === false ? filterResult.failedFilters : undefined,
    };
}

function getSuggestedNextStep(action: RecommendedAction, reasons: ReasonCode[]): string {
    switch (action) {
        case "PASS":
            if (reasons.includes("MISSING_CRITICAL_SKILLS")) {
                return "Verify missing skills with candidate before scheduling interview";
            }
            return "Schedule screening call";
        case "FAIL":
            return "Send rejection email";
    }
}

/**
 * Layer 5: Generate Candidate Feedback
 */
function generateCandidateFeedback(
    core: CoreATSOutput,
    parseability: ParseabilityResult,
    formatting: FormattingResult,
    structure: StructureResult,
    validated: ValidatedLLMOutput
): CandidateFeedback {
    const readinessLevel = getReadinessLevel(core.overallScore);
    const positives: string[] = [];
    const improvements: string[] = [];
    const skillsToHighlight: string[] = [];
    const formatSuggestions: string[] = [];

    // Positives
    if (validated.verifiedSkills.length > 0) {
        positives.push(
            `Strong skills demonstrated: ${validated.verifiedSkills
                .slice(0, 3)
                .map((s) => s.skill)
                .join(", ")}`
        );
    }
    if (parseability.isATSFriendly) {
        positives.push("Resume is ATS-friendly");
    }
    if (validated.relevantYears >= 3) {
        positives.push(`Solid experience: ${validated.relevantYears} years in relevant field`);
    }

    // Improvements
    if (core.missingCriticalSkills.length > 0) {
        improvements.push(
            `Add missing skills if you have them: ${core.missingCriticalSkills.join(", ")}`
        );
        skillsToHighlight.push(...core.missingCriticalSkills);
    }

    // Format suggestions
    for (const issue of parseability.issues) {
        if (issue.severity === "critical") {
            formatSuggestions.push(issue.description);
        }
    }
    for (const issue of formatting.issues) {
        if (issue.suggestion) {
            formatSuggestions.push(issue.suggestion);
        }
    }
    for (const issue of structure.issues) {
        if (issue.type === "missing-section") {
            formatSuggestions.push(`Add ${issue.section?.toUpperCase()} section`);
        }
    }

    // Estimate improvement potential
    const potentialImprovement = Math.min(
        core.missingCriticalSkills.length * 5 +
            parseability.issues.filter((i) => i.severity === "critical").length * 3 +
            structure.issues.filter((i) => i.type === "missing-section").length * 2,
        30
    );

    return {
        readinessLevel,
        positives: positives.length > 0 ? positives : ["Resume was successfully analyzed"],
        improvementSuggestions: improvements,
        skillsToHighlight: skillsToHighlight.slice(0, 5),
        formatSuggestions: formatSuggestions.slice(0, 5),
        potentialScoreImprovement: potentialImprovement,
    };
}

function getReadinessLevel(score: number): ReadinessLevel {
    if (score >= 85) return "READY";
    if (score >= 70) return "NEAR_READY";
    if (score >= 50) return "NEEDS_WORK";
    return "NOT_READY";
}
