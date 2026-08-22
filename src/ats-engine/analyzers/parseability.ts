/**
 * Parseability Analyzer
 * Detects ATS-unfriendly formatting (0-25 points)
 */

import type { ParseabilityResult } from "../types";

const MAX_SCORE = 25;

type IssueType = ParseabilityResult["issues"][0]["type"];

interface DetectedIssue {
    type: IssueType;
    severity: "critical" | "warning";
    description: string;
    impact: number;
}

/**
 * Analyze resume parseability for ATS systems
 */
export function analyzeParseability(text: string): ParseabilityResult {
    const issues: DetectedIssue[] = [];

    // Detect multi-column layout
    if (detectMultiColumn(text)) {
        issues.push({
            type: "multi-column",
            severity: "critical",
            description: "Multi-column layout detected - may cause parsing issues",
            impact: 8,
        });
    }

    // Detect tables
    if (detectTables(text)) {
        issues.push({
            type: "table",
            severity: "critical",
            description: "Table formatting detected - content may be scrambled",
            impact: 7,
        });
    }

    // Detect text boxes
    if (detectTextBoxes(text)) {
        issues.push({
            type: "text-box",
            severity: "warning",
            description: "Text box indicators detected - may be ignored by ATS",
            impact: 5,
        });
    }

    // Detect header/footer content issues
    if (detectHeaderContent(text)) {
        issues.push({
            type: "header-content",
            severity: "warning",
            description: "Important content may be in header/footer - often ignored",
            impact: 4,
        });
    }

    // Detect problematic special characters
    if (detectSpecialChars(text)) {
        issues.push({
            type: "special-chars",
            severity: "warning",
            description: "Special characters detected that may cause parsing issues",
            impact: 3,
        });
    }

    // Calculate score
    const totalPenalty = issues.reduce((sum, issue) => sum + issue.impact, 0);
    const score = Math.max(0, MAX_SCORE - totalPenalty);
    const percentage = Math.round((score / MAX_SCORE) * 100);

    return {
        score,
        percentage,
        issues,
        isATSFriendly: score >= 20,
    };
}

function detectMultiColumn(text: string): boolean {
    const lines = text.split("\n");
    let columnarLines = 0;

    for (const line of lines) {
        // Large gaps in middle of line suggest columns
        if (/\S{3,}\s{5,}\S{3,}/.test(line)) {
            columnarLines++;
        }
        // Tab-separated content
        if (line.includes("\t") && line.split("\t").filter(Boolean).length >= 2) {
            columnarLines++;
        }
    }

    return columnarLines > 5;
}

function detectTables(text: string): boolean {
    const lines = text.split("\n");

    // Look for consistent column alignment
    let alignedLines = 0;
    for (let i = 1; i < lines.length; i++) {
        const prevSpaces = getSpacePositions(lines[i - 1]);
        const currSpaces = getSpacePositions(lines[i]);
        if (hasAlignedSpaces(prevSpaces, currSpaces)) {
            alignedLines++;
        }
    }

    // Table indicators
    const hasTableChars = /[│├┤┬┴┼╔╗╚╝═║]/.test(text);
    const hasPipeRows =
        text.split("\n").filter((l) => (l.match(/\|/g) || []).length >= 2).length > 2;

    return alignedLines > 10 || hasTableChars || hasPipeRows;
}

function getSpacePositions(line: string): number[] {
    const positions: number[] = [];
    for (let i = 0; i < line.length; i++) {
        if (line[i] === " " && line[i - 1] !== " ") {
            positions.push(i);
        }
    }
    return positions;
}

function hasAlignedSpaces(pos1: number[], pos2: number[]): boolean {
    if (pos1.length < 2 || pos2.length < 2) return false;
    let matches = 0;
    for (const p1 of pos1) {
        for (const p2 of pos2) {
            if (Math.abs(p1 - p2) <= 2) matches++;
        }
    }
    return matches >= 2;
}

function detectTextBoxes(text: string): boolean {
    // Text boxes often result in isolated blocks
    const blocks = text.split(/\n{3,}/);
    const shortBlocks = blocks.filter((b) => b.length < 100 && b.trim().length > 0);
    return shortBlocks.length > 5;
}

function detectHeaderContent(text: string): boolean {
    const lines = text.split("\n");
    if (lines.length < 10) return false;

    const first3Lines = lines.slice(0, 3).join(" ").toLowerCase();
    const hasContactInHeader = /(email|phone|linkedin|github|portfolio|@)/.test(first3Lines);

    // Name should be first, but contact info should be after name section
    return hasContactInHeader && first3Lines.length < 100;
}

function detectSpecialChars(text: string): boolean {
    // Characters that often cause issues
    const problematicChars = /[➤➢➣►▸◆●○◘■□★☆✓✔✗✘✦❖]/g;
    const matches = text.match(problematicChars) || [];
    return matches.length > 10;
}
