/**
 * Formatting Analyzer
 * Checks formatting consistency (0-20 points)
 */

import type { FormattingResult } from "../types";

const MAX_SCORE = 20;

type IssueType = FormattingResult["issues"][0]["type"];

interface DetectedIssue {
    type: IssueType;
    severity: "critical" | "warning" | "minor";
    description: string;
    suggestion: string;
    impact: number;
}

/**
 * Analyze resume formatting consistency
 */
export function analyzeFormatting(text: string): FormattingResult {
    const issues: DetectedIssue[] = [];
    const lines = text.split("\n");

    // Check bullet consistency
    const bulletResult = checkBulletConsistency(lines);
    if (bulletResult.issue) {
        issues.push(bulletResult.issue);
    }

    // Check date format consistency
    const dateResult = checkDateConsistency(text);
    if (dateResult.issue) {
        issues.push(dateResult.issue);
    }

    // Check section headers
    const headerResult = checkSectionHeaders(lines);
    if (headerResult.issue) {
        issues.push(headerResult.issue);
    }

    // Check whitespace issues
    const whitespaceResult = checkWhitespace(text);
    if (whitespaceResult.issue) {
        issues.push(whitespaceResult.issue);
    }

    // Check length
    const lengthResult = checkLength(text);
    if (lengthResult.issue) {
        issues.push(lengthResult.issue);
    }

    // Calculate score
    const totalPenalty = issues.reduce((sum, issue) => sum + issue.impact, 0);
    const score = Math.max(0, MAX_SCORE - totalPenalty);
    const percentage = Math.round((score / MAX_SCORE) * 100);

    return {
        score,
        percentage,
        issues,
        metrics: {
            bulletConsistency: bulletResult.score,
            dateConsistency: dateResult.score,
            sectionClarity: headerResult.score,
            lengthScore: lengthResult.score,
        },
    };
}

function checkBulletConsistency(lines: string[]): { score: number; issue?: DetectedIssue } {
    const bulletPatterns = [
        /^[\s]*[•]\s/,
        /^[\s]*[-]\s/,
        /^[\s]*[*]\s/,
        /^[\s]*[○◦◘►▸→]\s/,
        /^[\s]*\d+[.)]\s/,
    ];

    const bulletCounts: Record<number, number> = {};
    let totalBullets = 0;

    for (const line of lines) {
        for (let i = 0; i < bulletPatterns.length; i++) {
            if (bulletPatterns[i].test(line)) {
                bulletCounts[i] = (bulletCounts[i] || 0) + 1;
                totalBullets++;
                break;
            }
        }
    }

    if (totalBullets === 0) {
        return { score: 50 }; // No bullets - neutral
    }

    const bulletTypes = Object.keys(bulletCounts).length;
    const consistency = bulletTypes === 1 ? 100 : Math.max(0, 100 - (bulletTypes - 1) * 30);

    if (bulletTypes > 2) {
        return {
            score: consistency,
            issue: {
                type: "bullet-inconsistency",
                severity: "warning",
                description: `Using ${bulletTypes} different bullet styles`,
                suggestion: "Use a single bullet style (• or -) throughout",
                impact: 3,
            },
        };
    }

    return { score: consistency };
}

function checkDateConsistency(text: string): { score: number; issue?: DetectedIssue } {
    const datePatterns = [
        /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi,
        /\b\d{1,2}\/\d{4}\b/g,
        /\b\d{4}\s*[-–—]\s*(Present|Current|\d{4})\b/gi,
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
    ];

    const foundFormats: number[] = [];
    for (let i = 0; i < datePatterns.length; i++) {
        const matches = text.match(datePatterns[i]);
        if (matches && matches.length > 0) {
            foundFormats.push(i);
        }
    }

    if (foundFormats.length === 0) {
        return { score: 50 }; // No dates - neutral
    }

    const consistency =
        foundFormats.length === 1 ? 100 : Math.max(0, 100 - (foundFormats.length - 1) * 25);

    if (foundFormats.length > 2) {
        return {
            score: consistency,
            issue: {
                type: "date-format",
                severity: "minor",
                description: "Inconsistent date formats detected",
                suggestion: "Use consistent date format (e.g., Jan 2020 - Dec 2022)",
                impact: 2,
            },
        };
    }

    return { score: consistency };
}

function checkSectionHeaders(lines: string[]): { score: number; issue?: DetectedIssue } {
    const commonHeaders = [
        "experience",
        "education",
        "skills",
        "summary",
        "objective",
        "projects",
        "certifications",
        "awards",
        "publications",
        "work history",
        "professional experience",
        "technical skills",
    ];

    let foundHeaders = 0;
    let clearHeaders = 0;

    for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        for (const header of commonHeaders) {
            if (
                trimmed === header ||
                trimmed === header.toUpperCase() ||
                trimmed.startsWith(header + ":") ||
                trimmed.startsWith(header.toUpperCase() + ":")
            ) {
                foundHeaders++;
                if (line.trim().length < 30) {
                    clearHeaders++;
                }
                break;
            }
        }
    }

    if (foundHeaders === 0) {
        return {
            score: 30,
            issue: {
                type: "section-headers",
                severity: "warning",
                description: "No clear section headers detected",
                suggestion: "Add clear headers: EXPERIENCE, EDUCATION, SKILLS",
                impact: 4,
            },
        };
    }

    const clarity = Math.round((clearHeaders / foundHeaders) * 100);

    if (clarity < 50) {
        return {
            score: clarity,
            issue: {
                type: "section-headers",
                severity: "minor",
                description: "Section headers could be clearer",
                suggestion: "Use standalone section headers on their own line",
                impact: 2,
            },
        };
    }

    return { score: clarity };
}

function checkWhitespace(text: string): { score: number; issue?: DetectedIssue } {
    const lines = text.split("\n");
    const blankLines = lines.filter((l) => l.trim() === "").length;
    const ratio = blankLines / lines.length;

    if (ratio > 0.4) {
        return {
            score: 50,
            issue: {
                type: "whitespace",
                severity: "minor",
                description: "Excessive blank lines detected",
                suggestion: "Reduce whitespace to fit more content",
                impact: 2,
            },
        };
    }

    if (ratio < 0.05) {
        return {
            score: 60,
            issue: {
                type: "whitespace",
                severity: "minor",
                description: "Very dense text with little spacing",
                suggestion: "Add spacing between sections for readability",
                impact: 1,
            },
        };
    }

    return { score: 100 };
}

function checkLength(text: string): { score: number; issue?: DetectedIssue } {
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    if (wordCount < 150) {
        return {
            score: 40,
            issue: {
                type: "length",
                severity: "warning",
                description: `Resume is too short (${wordCount} words)`,
                suggestion: "Add more detail about your experience and skills",
                impact: 4,
            },
        };
    }

    if (wordCount > 1500) {
        return {
            score: 70,
            issue: {
                type: "length",
                severity: "minor",
                description: `Resume is quite long (${wordCount} words)`,
                suggestion: "Consider condensing to 1-2 pages",
                impact: 2,
            },
        };
    }

    return { score: 100 };
}
