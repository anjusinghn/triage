/**
 * LLM Analysis Service
 * Supports OpenAI-compatible HTTP providers.
 *
 * Provides analysis data that backend validates and scores
 */

import type { LLMConfig, LLMOutput, JobInput } from "../types";

/**
 * System prompt for LLM analysis
 */
const SYSTEM_PROMPT = `You are an ATS (Applicant Tracking System) analyzer. Analyze resumes against job descriptions.

RULES:
1. Only identify skills that are EXPLICITLY mentioned in the resume
2. Do NOT infer or assume skills not stated
3. Be conservative with scores
4. Provide evidence quotes for skills found
5. Output ONLY valid JSON

Your output must match this exact schema:
{
  "semanticScore": <0-100>,
  "skillsMatch": ["<skill1>", "<skill2>"],
  "experienceAlignment": <0-100>,
  "keyFindings": {
    "strengths": ["..."],
    "gaps": ["..."],
    "risks": ["..."]
  },
  "skillsAnalysis": {
    "matched": ["<skill with evidence>"],
    "missing": ["<required but not found>"],
    "inferred": ["<possibly has>"]
  },
  "experienceAnalysis": {
    "totalYears": <number>,
    "relevantYears": <number>,
    "highlights": ["..."]
  },
  "educationAnalysis": {
    "level": "<high school|bachelors|masters|phd|other>",
    "relevance": <0-100>,
    "details": "<field of study>"
  },
  "confidence": <0-1>,
  "reasoning": "<brief explanation>"
}`;

/**
 * Build analysis prompt
 */
function buildPrompt(resumeText: string, job: JobInput): string {
    return `Analyze this resume against the job:

=== JOB ===
Title: ${job.title}
Required Skills: ${job.mustHaveSkills?.join(", ") || "Not specified"}
Nice-to-have: ${job.niceToHaveSkills?.join(", ") || "None"}
Experience Required: ${job.requiredExperienceYears || "Not specified"} years
Level: ${job.experienceLevel || "Not specified"}

Description:
${job.description}

=== RESUME ===
${resumeText}

Output JSON only:`;
}

/**
 * Main LLM analysis function
 */
export async function analyzeWithLLM(
    resumeText: string,
    job: JobInput,
    config: LLMConfig
): Promise<LLMOutput> {
    switch (config.provider) {
        case "openai":
            return analyzeWithOpenAI(resumeText, job, config);
        case "custom":
            return analyzeWithCustom(resumeText, job, config);
        default:
            throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
}

/**
 * OpenAI analysis
 */
async function analyzeWithOpenAI(
    resumeText: string,
    job: JobInput,
    config: LLMConfig
): Promise<LLMOutput> {
    const OpenAI = await import("openai").then((m) => m.default || m);
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });

    const response = await client.chat.completions.create({
        model: config.model,
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildPrompt(resumeText, job) },
        ],
        temperature: config.temperature ?? 0.1,
        max_tokens: config.maxTokens ?? 2000,
        response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from AI review");

    return parseResponse(content);
}

/**
 * Custom OpenAI-compatible API
 */
async function analyzeWithCustom(
    resumeText: string,
    job: JobInput,
    config: LLMConfig
): Promise<LLMOutput> {
    if (!config.baseURL) throw new Error("baseURL required for custom provider");

    const OpenAI = await import("openai").then((m) => m.default || m);
    const client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: config.baseURL,
        defaultHeaders: config.headers,
    });

    const messages = [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: buildPrompt(resumeText, job) },
    ];

    try {
        const response = await client.chat.completions.create({
            model: config.model,
            messages,
            temperature: config.temperature ?? 0.1,
            max_tokens: config.maxTokens ?? 2000,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response");

        return parseResponse(content);
    } catch {
        // Some models reject response_format; retry without it
        const response = await client.chat.completions.create({
            model: config.model,
            messages,
            temperature: config.temperature ?? 0.1,
            max_tokens: config.maxTokens ?? 2000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("Empty response");

        return parseResponse(content);
    }
}

/**
 * Parse LLM response into typed output
 */
function parseResponse(content: string): LLMOutput {
    // Extract JSON from markdown if wrapped
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr);

    return {
        semanticScore: clamp(parsed.semanticScore ?? 50, 0, 100),
        skillsMatch: parsed.skillsMatch ?? [],
        experienceAlignment: clamp(parsed.experienceAlignment ?? 50, 0, 100),
        keyFindings: {
            strengths: parsed.keyFindings?.strengths ?? [],
            gaps: parsed.keyFindings?.gaps ?? [],
            risks: parsed.keyFindings?.risks ?? [],
        },
        skillsAnalysis: {
            matched: parsed.skillsAnalysis?.matched ?? [],
            missing: parsed.skillsAnalysis?.missing ?? [],
            inferred: parsed.skillsAnalysis?.inferred ?? [],
        },
        experienceAnalysis: {
            totalYears: parsed.experienceAnalysis?.totalYears ?? 0,
            relevantYears: parsed.experienceAnalysis?.relevantYears ?? 0,
            highlights: parsed.experienceAnalysis?.highlights ?? [],
        },
        educationAnalysis: {
            level: parsed.educationAnalysis?.level ?? "other",
            relevance: clamp(parsed.educationAnalysis?.relevance ?? 50, 0, 100),
            details: parsed.educationAnalysis?.details,
        },
        confidence: clamp(parsed.confidence ?? 0.5, 0, 1),
        reasoning: parsed.reasoning,
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Create mock LLM output for rule-based only mode
 */
export function createMockLLMOutput(): LLMOutput {
    return {
        semanticScore: 50,
        skillsMatch: [],
        experienceAlignment: 50,
        keyFindings: {
            strengths: ["Resume content parsed successfully"],
            gaps: ["LLM analysis not performed"],
            risks: [],
        },
        skillsAnalysis: {
            matched: [],
            missing: [],
            inferred: [],
        },
        experienceAnalysis: {
            totalYears: 0,
            relevantYears: 0,
            highlights: [],
        },
        educationAnalysis: {
            level: "other",
            relevance: 50,
        },
        confidence: 0.3,
        reasoning: "Mock output - LLM analysis skipped",
    };
}

/**
 * Check if LLM output should be rejected
 */
export function shouldRejectLLMOutput(output: LLMOutput): boolean {
    return output.confidence < 0.3;
}
