/**
 * Structure Analyzer
 * Analyzes resume sections (0-10 points)
 */

import type { StructureResult } from "../types";

const MAX_SCORE = 10;

const REQUIRED_SECTIONS = ["experience", "education", "skills"];
const IDEAL_ORDER = ["summary", "experience", "skills", "education", "projects", "certifications"];

type IssueType = StructureResult["issues"][0]["type"];

interface DetectedIssue {
    type: IssueType;
    severity: "critical" | "warning";
    description: string;
    section?: string;
    impact: number;
}

/**
 * Analyze resume structure
 */
export function analyzeStructure(text: string): StructureResult {
    const lines = text.split("\n");
    const issues: DetectedIssue[] = [];

    // Detect sections
    const detectedSections = detectSections(lines);
    const found = detectedSections.map((s) => s.name);

    // Check for required sections
    const missing: string[] = [];
    for (const required of REQUIRED_SECTIONS) {
        if (!found.some((f) => f.toLowerCase().includes(required))) {
            missing.push(required);
            issues.push({
                type: "missing-section",
                severity: "critical",
                description: `Missing required section: ${required.toUpperCase()}`,
                section: required,
                impact: 3,
            });
        }
    }

    // Check section order
    const orderScore = checkSectionOrder(found);
    if (orderScore < 70) {
        issues.push({
            type: "wrong-order",
            severity: "warning",
            description: "Section order could be improved",
            impact: 1,
        });
    }

    // Check for duplicates
    const duplicates = findDuplicateSections(found);
    for (const dup of duplicates) {
        issues.push({
            type: "duplicate-section",
            severity: "warning",
            description: `Duplicate section detected: ${dup}`,
            section: dup,
            impact: 1,
        });
    }

    // Check naming conventions
    const unclearNaming = checkNamingConventions(detectedSections);
    for (const unclear of unclearNaming) {
        issues.push({
            type: "unclear-naming",
            severity: "warning",
            description: `Unclear section name: "${unclear}"`,
            section: unclear,
            impact: 1,
        });
    }

    // Calculate score
    const totalPenalty = issues.reduce((sum, issue) => sum + issue.impact, 0);
    const score = Math.max(0, MAX_SCORE - totalPenalty);
    const percentage = Math.round((score / MAX_SCORE) * 100);

    return {
        score,
        percentage,
        sections: {
            found,
            missing,
            order: found,
        },
        issues,
    };
}

interface DetectedSection {
    name: string;
    lineNumber: number;
    confidence: number;
}

function detectSections(lines: string[]): DetectedSection[] {
    const sections: DetectedSection[] = [];
    const sectionPatterns = [
        /^(experience|work\s*experience|employment|work\s*history|professional\s*experience)/i,
        /^(education|academic|qualifications)/i,
        /^(skills|technical\s*skills|core\s*competencies|competencies)/i,
        /^(summary|profile|objective|about|about\s*me)/i,
        /^(projects|personal\s*projects|key\s*projects)/i,
        /^(certifications?|certificates?|licenses?)/i,
        /^(awards?|honors?|achievements?)/i,
        /^(publications?|papers?)/i,
        /^(languages?|spoken\s*languages?)/i,
        /^(interests?|hobbies?)/i,
        /^(volunteer|volunteering)/i,
        /^(references?)/i,
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty or very long lines
        if (!line || line.length > 50) continue;

        // Check if line matches a section pattern
        for (const pattern of sectionPatterns) {
            if (pattern.test(line)) {
                sections.push({
                    name: line.toLowerCase().replace(/[:\s]+$/, ""),
                    lineNumber: i,
                    confidence: 0.9,
                });
                break;
            }
        }

        // Check for all-caps short lines (likely headers)
        if (
            line === line.toUpperCase() &&
            line.length >= 4 &&
            line.length <= 30 &&
            /^[A-Z\s]+$/.test(line)
        ) {
            const exists = sections.some((s) => s.lineNumber === i);
            if (!exists) {
                sections.push({
                    name: line.toLowerCase(),
                    lineNumber: i,
                    confidence: 0.7,
                });
            }
        }
    }

    return sections;
}

function checkSectionOrder(found: string[]): number {
    if (found.length < 2) return 100;

    let orderScore = 100;
    const idealPositions: Record<string, number> = {};
    IDEAL_ORDER.forEach((section, idx) => {
        idealPositions[section] = idx;
    });

    for (let i = 0; i < found.length - 1; i++) {
        const current = found[i].toLowerCase();
        const next = found[i + 1].toLowerCase();

        let currentPos = -1;
        let nextPos = -1;

        for (const [key, pos] of Object.entries(idealPositions)) {
            if (current.includes(key)) currentPos = pos;
            if (next.includes(key)) nextPos = pos;
        }

        if (currentPos !== -1 && nextPos !== -1 && currentPos > nextPos) {
            orderScore -= 10;
        }
    }

    return Math.max(0, orderScore);
}

function findDuplicateSections(found: string[]): string[] {
    const normalized = found.map((s) => {
        const lower = s.toLowerCase();
        if (lower.includes("experience") || lower.includes("work")) return "experience";
        if (lower.includes("education") || lower.includes("academic")) return "education";
        if (lower.includes("skill")) return "skills";
        return lower;
    });

    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const section of normalized) {
        if (seen.has(section)) {
            duplicates.push(section);
        }
        seen.add(section);
    }

    return duplicates;
}

function checkNamingConventions(sections: DetectedSection[]): string[] {
    const unclear: string[] = [];
    const standardNames = new Set([
        "experience",
        "work experience",
        "professional experience",
        "employment",
        "education",
        "academic background",
        "skills",
        "technical skills",
        "core competencies",
        "summary",
        "professional summary",
        "profile",
        "objective",
        "projects",
        "certifications",
        "awards",
        "publications",
        "languages",
        "interests",
    ]);

    for (const section of sections) {
        const name = section.name.toLowerCase().replace(/[:\s]+$/, "");
        if (!standardNames.has(name) && section.confidence < 0.9) {
            unclear.push(section.name);
        }
    }

    return unclear;
}
