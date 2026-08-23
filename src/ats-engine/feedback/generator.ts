/**
 * Feedback Generator
 * Generates detailed, actionable feedback for candidates and recruiters
 */

import type {
    ATSEngineOutput,
    CandidateFeedback,
    ExplainabilityOutput,
    ReadinessLevel,
    DecisionBand,
} from "../types";

// ============================================================================
// FEEDBACK TEMPLATES
// ============================================================================

const SKILL_IMPROVEMENT_TEMPLATES: Record<string, string[]> = {
    "missing-critical": [
        "Add {skill} to your resume - this is a critical requirement for this role",
        "Consider gaining experience in {skill} through projects or certifications",
        "Highlight any experience with {skill}, even if it's from personal projects",
    ],
    "missing-preferred": [
        "Adding {skill} would strengthen your application",
        "Consider learning {skill} to become a stronger candidate",
        "{skill} is a nice-to-have - mention any exposure you have",
    ],
    "weak-proficiency": [
        "Quantify your experience with {skill} (e.g., years, projects, impact)",
        "Provide specific examples of how you've used {skill}",
        "Consider getting certified in {skill} to demonstrate proficiency",
    ],
};

const FORMAT_IMPROVEMENT_TEMPLATES = [
    "Use a single-column layout for better ATS parsing",
    "Avoid tables and text boxes - they confuse ATS systems",
    "Use standard section headers (Experience, Education, Skills)",
    "Save as PDF or DOCX - avoid images and graphics",
    "Use consistent date formats (e.g., Jan 2020 - Present)",
    "Include relevant keywords from the job description",
    "Keep bullet points concise (1-2 lines each)",
    "Use standard fonts like Arial, Calibri, or Times New Roman",
];

const STRENGTH_TEMPLATES: Record<string, string> = {
    "skills-match": "Strong alignment with required technical skills",
    "experience-match": "Relevant experience level for this role",
    "education-match": "Education background meets requirements",
    "industry-match": "Industry experience is highly relevant",
    "seniority-match": "Seniority level matches the position",
    "format-good": "Resume is well-formatted and ATS-friendly",
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive candidate feedback from ATS output
 */
export function generateCandidateFeedback(
    output: ATSEngineOutput,
    options?: {
        verbose?: boolean;
        includeSuggestions?: boolean;
    }
): CandidateFeedback {
    const { core, explanation } = output;
    const verbose = options?.verbose ?? true;
    const includeSuggestions = options?.includeSuggestions ?? true;

    // Determine readiness level
    const readinessLevel = getReadinessLevel(core.overallScore, core.decisionBand);

    // Generate positives
    const positives = generatePositives(core, explanation);

    // Generate improvement suggestions
    const improvementSuggestions = includeSuggestions
        ? generateImprovementSuggestions(core, explanation, verbose)
        : [];

    // Skills to highlight
    const skillsToHighlight = [
        ...core.matchedSkills.exact.slice(0, 5),
        ...core.matchedSkills.semantic.slice(0, 3),
    ];

    // Format suggestions
    const formatSuggestions = generateFormatSuggestions(core);

    // Estimate potential score improvement
    const potentialScoreImprovement = estimateScoreImprovement(
        core.overallScore,
        core.missingCriticalSkills.length,
        formatSuggestions.length
    );

    return {
        readinessLevel,
        positives,
        improvementSuggestions,
        skillsToHighlight,
        formatSuggestions,
        potentialScoreImprovement,
    };
}

/**
 * Generate recruiter-facing summary
 */
export function generateRecruiterSummary(output: ATSEngineOutput): string {
    const { core, explanation, decision } = output;

    const parts: string[] = [];

    // Overall assessment
    parts.push(`Score: ${core.overallScore}/100 (${core.decisionBand.replace(/_/g, " ")})`);

    // Key strengths
    if (explanation.strengths.length > 0) {
        parts.push(`Strengths: ${explanation.strengths.slice(0, 2).join(", ")}`);
    }

    // Key gaps
    if (explanation.gaps.length > 0) {
        parts.push(`Gaps: ${explanation.gaps.slice(0, 2).join(", ")}`);
    }

    // Recommendation
    parts.push(`Recommendation: ${decision.recommendedAction}`);

    return parts.join(" | ");
}

/**
 * Generate detailed feedback text
 */
export function generateDetailedFeedback(output: ATSEngineOutput): string {
    const feedback = generateCandidateFeedback(output);

    const sections: string[] = [];

    // Header
    sections.push(`# Resume Feedback Report`);
    sections.push(`Score: ${output.core.overallScore}/100`);
    sections.push(`Readiness: ${feedback.readinessLevel.replace(/_/g, " ")}`);
    sections.push("");

    // What's Working
    sections.push(`## What's Working Well`);
    for (const positive of feedback.positives) {
        sections.push(`✓ ${positive}`);
    }
    sections.push("");

    // Areas for Improvement
    sections.push(`## Areas for Improvement`);
    for (const suggestion of feedback.improvementSuggestions) {
        sections.push(`• ${suggestion}`);
    }
    sections.push("");

    // Skills to Highlight
    if (feedback.skillsToHighlight.length > 0) {
        sections.push(`## Skills to Emphasize`);
        sections.push(`These skills matched well - make sure they're prominent:`);
        sections.push(feedback.skillsToHighlight.map((s) => `• ${s}`).join("\n"));
        sections.push("");
    }

    // Format Suggestions
    if (feedback.formatSuggestions.length > 0) {
        sections.push(`## Resume Format Tips`);
        for (const tip of feedback.formatSuggestions) {
            sections.push(`• ${tip}`);
        }
        sections.push("");
    }

    // Potential Improvement
    sections.push(`## Potential Score Improvement`);
    sections.push(
        `Following these suggestions could improve your score by up to ${feedback.potentialScoreImprovement} points.`
    );

    return sections.join("\n");
}

/**
 * Format feedback as plain text email
 */
export function formatFeedbackAsEmail(output: ATSEngineOutput, candidateName: string): string {
    const feedback = generateCandidateFeedback(output);

    const lines: string[] = [
        `Dear ${candidateName},`,
        "",
        `Thank you for your application. Here's some feedback to help you strengthen your profile:`,
        "",
    ];

    // Key strengths
    if (feedback.positives.length > 0) {
        lines.push(`WHAT WE LIKED:`);
        for (const positive of feedback.positives.slice(0, 3)) {
            lines.push(`• ${positive}`);
        }
        lines.push("");
    }

    // Suggestions
    if (feedback.improvementSuggestions.length > 0) {
        lines.push(`SUGGESTIONS FOR IMPROVEMENT:`);
        for (const suggestion of feedback.improvementSuggestions.slice(0, 5)) {
            lines.push(`• ${suggestion}`);
        }
        lines.push("");
    }

    lines.push(`Best regards,`);
    lines.push(`The Hiring Team`);

    return lines.join("\n");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getReadinessLevel(score: number, band: DecisionBand): ReadinessLevel {
    if (band === "STRONG_MATCH" || score >= 85) return "READY";
    if (band === "GOOD_MATCH" || score >= 70) return "NEAR_READY";
    if (band === "MODERATE_MATCH" || score >= 50) return "NEEDS_WORK";
    return "NOT_READY";
}

function generatePositives(
    core: ATSEngineOutput["core"],
    explanation: ExplainabilityOutput
): string[] {
    const positives: string[] = [];

    // Add strengths from explanation
    positives.push(...explanation.strengths);

    // Add component-based positives
    if (core.componentScores.skillsMatch >= 70) {
        positives.push(STRENGTH_TEMPLATES["skills-match"]);
    }
    if (core.componentScores.experienceRelevance >= 70) {
        positives.push(STRENGTH_TEMPLATES["experience-match"]);
    }
    if (core.componentScores.educationFit >= 70) {
        positives.push(STRENGTH_TEMPLATES["education-match"]);
    }
    if (core.componentScores.parseability >= 80) {
        positives.push(STRENGTH_TEMPLATES["format-good"]);
    }

    // Add matched skills as positive
    if (core.matchedSkills.exact.length > 0) {
        positives.push(`Strong match on: ${core.matchedSkills.exact.slice(0, 3).join(", ")}`);
    }

    return [...new Set(positives)]; // Remove duplicates
}

function generateImprovementSuggestions(
    core: ATSEngineOutput["core"],
    explanation: ExplainabilityOutput,
    verbose: boolean
): string[] {
    const suggestions: string[] = [];

    // Add gaps from explanation
    suggestions.push(...explanation.gaps);

    // Missing critical skills
    for (const skill of core.missingCriticalSkills.slice(0, 3)) {
        const template = SKILL_IMPROVEMENT_TEMPLATES["missing-critical"][0];
        suggestions.push(template.replace("{skill}", skill));
    }

    // Component-based suggestions
    if (core.componentScores.skillsMatch < 50) {
        suggestions.push("Focus on highlighting more relevant technical skills");
    }
    if (core.componentScores.experienceRelevance < 50) {
        suggestions.push("Emphasize experience that directly relates to this role");
    }
    if (core.componentScores.keywordCoverage < 50) {
        suggestions.push("Include more keywords from the job description");
    }

    // Parseability issues
    if (core.componentScores.parseability < 70) {
        suggestions.push("Simplify your resume format for better ATS parsing");
    }

    // Formatting issues
    if (core.componentScores.formatting < 70) {
        suggestions.push("Use consistent formatting throughout your resume");
    }

    return [...new Set(suggestions)].slice(0, verbose ? 10 : 5);
}

function generateFormatSuggestions(core: ATSEngineOutput["core"]): string[] {
    const suggestions: string[] = [];

    if (core.componentScores.parseability < 80) {
        suggestions.push(FORMAT_IMPROVEMENT_TEMPLATES[0]); // Single-column
        suggestions.push(FORMAT_IMPROVEMENT_TEMPLATES[1]); // Avoid tables
    }

    if (core.componentScores.formatting < 80) {
        suggestions.push(FORMAT_IMPROVEMENT_TEMPLATES[4]); // Date format
        suggestions.push(FORMAT_IMPROVEMENT_TEMPLATES[6]); // Bullet points
    }

    if (core.componentScores.keywordCoverage < 60) {
        suggestions.push(FORMAT_IMPROVEMENT_TEMPLATES[5]); // Keywords
    }

    return suggestions.slice(0, 4);
}

function estimateScoreImprovement(
    currentScore: number,
    missingCriticalCount: number,
    formatIssuesCount: number
): number {
    let potential = 0;

    // Each critical skill could add 3-5 points
    potential += missingCriticalCount * 4;

    // Format improvements could add 5-10 points
    potential += Math.min(formatIssuesCount * 3, 10);

    // Cap at reasonable improvement
    const maxPossible = 100 - currentScore;
    return Math.min(potential, maxPossible, 25);
}

// ============================================================================
// BATCH FEEDBACK
// ============================================================================

/**
 * Generate feedback summary for multiple candidates
 */
export function generateBatchSummary(outputs: ATSEngineOutput[]): {
    totalCandidates: number;
    averageScore: number;
    distribution: Record<DecisionBand, number>;
    topCandidates: Array<{ candidateId?: string; score: number; band: DecisionBand }>;
    commonGaps: string[];
} {
    const distribution: Record<DecisionBand, number> = {
        STRONG_MATCH: 0,
        GOOD_MATCH: 0,
        MODERATE_MATCH: 0,
        WEAK_MATCH: 0,
        NO_MATCH: 0,
    };

    const gapCounter = new Map<string, number>();

    let totalScore = 0;
    const candidates: Array<{ candidateId?: string; score: number; band: DecisionBand }> = [];

    for (const output of outputs) {
        totalScore += output.core.overallScore;
        distribution[output.core.decisionBand]++;

        candidates.push({
            candidateId: output.candidateId,
            score: output.core.overallScore,
            band: output.core.decisionBand,
        });

        // Count gaps
        for (const gap of output.explanation.gaps) {
            gapCounter.set(gap, (gapCounter.get(gap) || 0) + 1);
        }
    }

    // Sort candidates by score
    candidates.sort((a, b) => b.score - a.score);

    // Get top 5 most common gaps
    const commonGaps = Array.from(gapCounter.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([gap]) => gap);

    return {
        totalCandidates: outputs.length,
        averageScore: Math.round(totalScore / outputs.length),
        distribution,
        topCandidates: candidates.slice(0, 10),
        commonGaps,
    };
}
