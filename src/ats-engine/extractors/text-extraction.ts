/**
 * Text Extraction Service
 * Extracts text from PDF, DOCX, DOC, and TXT files
 * Supports both Buffer input and URL-based resume fetching
 */

import type { ExtractionResult } from "../types";
import { ExtractionError } from "../errors";
import { createRequire } from "node:module";
import { join } from "node:path";

const requireFromProject = createRequire(join(process.cwd(), "package.json"));

class DOMMatrixPolyfill {
    readonly a: number = 1;
    readonly b: number = 0;
    readonly c: number = 0;
    readonly d: number = 1;
    readonly e: number = 0;
    readonly f: number = 0;
}

// Polyfill DOMMatrix for pdf-parse in serverless environments (e.g. Vercel)
// @ts-expect-error polyfill for serverless pdf.js runtime
globalThis.DOMMatrix ??= DOMMatrixPolyfill;

// Supported MIME types matching jobs-pendent-fe
export const SUPPORTED_MIME_TYPES = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "text/plain",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

// File extension to MIME type mapping
const EXTENSION_TO_MIME: Record<string, SupportedMimeType> = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT = 30000; // 30 seconds

/**
 * Resume input - supports Buffer or URL
 */
export interface ResumeInput {
    buffer?: Buffer;
    url?: string;
    mimeType?: string;
    fileName?: string;
}

/**
 * Extract text from resume - accepts Buffer or URL
 */
export async function extractTextFromResume(
    input: Buffer | ResumeInput,
    mimeType?: string
): Promise<ExtractionResult> {
    // Handle legacy Buffer input
    if (Buffer.isBuffer(input)) {
        return extractFromBuffer(input, mimeType ?? "application/pdf");
    }

    // Handle ResumeInput object
    if (input.buffer) {
        const mime = input.mimeType ?? guessMimeType(input.fileName);
        if (!mime) {
            return {
                success: false,
                text: null,
                error: "MIME type is required when providing a buffer",
            };
        }
        return extractFromBuffer(input.buffer, mime);
    }

    if (input.url) {
        return extractFromURL(input.url, input.mimeType);
    }

    return {
        success: false,
        text: null,
        error: "Either buffer or url must be provided",
    };
}

/**
 * Extract text from a buffer
 */
async function extractFromBuffer(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
    try {
        // Validate MIME type
        if (!SUPPORTED_MIME_TYPES.includes(mimeType as SupportedMimeType)) {
            return {
                success: false,
                text: null,
                error: `Unsupported file type: ${mimeType}. Supported: PDF, DOC, DOCX, TXT`,
            };
        }

        // Validate file size
        if (buffer.length > MAX_FILE_SIZE) {
            return {
                success: false,
                text: null,
                error: "File size exceeds 10MB limit",
            };
        }

        // Validate not empty
        if (!buffer || buffer.length === 0) {
            return {
                success: false,
                text: null,
                error: "Resume file is empty",
            };
        }

        let text: string;
        let metadata: ExtractionResult["metadata"] = { wordCount: 0 };

        switch (mimeType) {
            case "application/pdf": {
                const pdfResult = await extractFromPDF(buffer);
                text = pdfResult.text;
                metadata = pdfResult.metadata;
                break;
            }

            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
                text = await extractFromDOCX(buffer);
                break;
            }

            case "application/msword": {
                text = await extractFromDOC(buffer);
                break;
            }

            case "text/plain": {
                text = buffer.toString("utf-8");
                break;
            }

            default:
                return {
                    success: false,
                    text: null,
                    error: `Unsupported file type: ${mimeType}`,
                };
        }

        // Validate extracted content
        if (!text || text.trim().length < 50) {
            return {
                success: false,
                text: null,
                error: "Extracted text is too short or empty. The file may be corrupted or image-based.",
            };
        }

        if (metadata) {
            metadata.wordCount = text.split(/\s+/).filter(Boolean).length;
        }

        return {
            success: true,
            text,
            metadata,
        };
    } catch (error) {
        return {
            success: false,
            text: null,
            error: error instanceof Error ? error.message : "Unknown extraction error",
        };
    }
}

/**
 * Extract text from a URL
 */
async function extractFromURL(url: string, mimeType?: string): Promise<ExtractionResult> {
    // Validate URL
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return {
            success: false,
            text: null,
            error: `Invalid URL: ${url}`,
        };
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return {
            success: false,
            text: null,
            error: "URL must use http or https protocol",
        };
    }

    try {
        // Fetch with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                "User-Agent": "ATS-Engine/1.0",
            },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return {
                success: false,
                text: null,
                error: `Failed to fetch resume: HTTP ${response.status} ${response.statusText}`,
            };
        }

        // Check content length
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
            return {
                success: false,
                text: null,
                error: `File size ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB exceeds 10MB limit`,
            };
        }

        // Get MIME type from response or guess from URL
        const contentType = response.headers.get("content-type")?.split(";")[0];
        const detectedMime = mimeType ?? contentType ?? guessMimeType(parsedUrl.pathname);

        if (!detectedMime) {
            return {
                success: false,
                text: null,
                error: "Could not determine file type. Please provide mimeType explicitly.",
            };
        }

        // Get buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate size after download
        if (buffer.length > MAX_FILE_SIZE) {
            return {
                success: false,
                text: null,
                error: `File size ${Math.round(buffer.length / 1024 / 1024)}MB exceeds 10MB limit`,
            };
        }

        return extractFromBuffer(buffer, detectedMime);
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return {
                success: false,
                text: null,
                error: "Request timeout while fetching resume",
            };
        }

        return {
            success: false,
            text: null,
            error: `Failed to fetch resume: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
    }
}

/**
 * Fallback for simple uncompressed PDFs whose `(text) Tj` streams trip pdf.js.
 */
function extractUncompressedPdfText(buffer: Buffer): string | null {
    const raw = buffer.toString("latin1");
    const matches = raw.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g);
    const lines: string[] = [];
    for (const match of matches) {
        const inner = match[0].replace(/\)\s*Tj$/, "").slice(1);
        const text = inner
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\t/g, "\t")
            .replace(/\\\(/g, "(")
            .replace(/\\\)/g, ")")
            .replace(/\\\\/g, "\\");
        lines.push(text);
    }
    const joined = lines.join("\n").trim();
    return joined.length >= 10 ? joined : null;
}

/**
 * Extract from PDF using pdf-parse.
 * Avoids pdfjs-dist/legacy which breaks under Next.js.
 */
async function extractFromPDF(buffer: Buffer): Promise<{
    text: string;
    metadata: ExtractionResult["metadata"];
}> {
    const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const fallbackText = extractUncompressedPdfText(bytes);
    const looksSimple =
        bytes.length < 20_000 && bytes.toString("latin1").includes(") Tj") && Boolean(fallbackText);

    if (looksSimple && fallbackText) {
        return { text: fallbackText, metadata: { pageCount: 1 } };
    }

    try {
        // Load pdf-parse at runtime from the project so bundlers cannot rewrite it.
        // Use lib/pdf-parse.js: the package index.js demo-parses a fixture when
        // `module.parent` is missing (ESM / Next.js) and corrupts pdf.js state.
        const pdfParse = requireFromProject("pdf-parse/lib/pdf-parse.js");
        const pdf = typeof pdfParse === "function" ? pdfParse : pdfParse.default;
        const data = await pdf(bytes);
        const fullText = (typeof data?.text === "string" ? data.text : "").trim();

        if (!fullText || fullText.length < 10) {
            if (fallbackText) {
                return { text: fallbackText, metadata: { pageCount: 1 } };
            }
            throw new Error("PDF appears to be empty or image-based (no extractable text)");
        }

        return {
            text: fullText,
            metadata: {
                pageCount: typeof data?.numpages === "number" ? data.numpages : undefined,
            },
        };
    } catch (error) {
        if (fallbackText) {
            return { text: fallbackText, metadata: { pageCount: 1 } };
        }
        throw new ExtractionError(
            `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            "parse",
            { mimeType: "application/pdf", cause: error instanceof Error ? error : undefined }
        );
    }
}

/**
 * Extract from DOCX
 */
async function extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        throw new ExtractionError(
            `DOCX extraction failed: ${error instanceof Error ? error.message : "Unknown"}`,
            "parse",
            {
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                cause: error instanceof Error ? error : undefined,
            }
        );
    }
}

/**
 * Extract from DOC (legacy Word format)
 * Uses mammoth which has partial DOC support, or falls back to basic extraction
 */
async function extractFromDOC(buffer: Buffer): Promise<string> {
    try {
        // Try mammoth first - it has some DOC support
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });

        if (result.value && result.value.trim().length > 50) {
            return result.value;
        }

        // If mammoth fails or extracts very little, try basic text extraction
        // DOC files are OLE compound documents with embedded text
        const text = extractTextFromOLE(buffer);
        if (text && text.length > 50) {
            return text;
        }

        throw new Error("Could not extract meaningful text from DOC file");
    } catch (error) {
        throw new ExtractionError(
            `DOC extraction failed: ${error instanceof Error ? error.message : "Unknown"}. Consider converting to DOCX for better results.`,
            "parse",
            { mimeType: "application/msword", cause: error instanceof Error ? error : undefined }
        );
    }
}

/**
 * Basic text extraction from OLE compound document (DOC files)
 * This is a fallback method that extracts readable ASCII text
 */
function extractTextFromOLE(buffer: Buffer): string {
    // Convert buffer to string and extract printable characters
    const content = buffer.toString("binary");

    // DOC files have text between specific markers
    // This is a simplified extraction that gets most readable text
    const extracted: string[] = [];
    let current = "";

    for (let i = 0; i < content.length; i++) {
        const code = content.charCodeAt(i);
        // Printable ASCII characters and common whitespace
        if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
            current += content[i];
        } else if (current.length > 0) {
            // Only keep strings of reasonable length (likely actual text)
            if (current.trim().length > 5) {
                extracted.push(current.trim());
            }
            current = "";
        }
    }

    if (current.trim().length > 5) {
        extracted.push(current.trim());
    }

    return extracted.join("\n");
}

/**
 * Guess MIME type from filename
 */
function guessMimeType(fileName?: string): SupportedMimeType | undefined {
    if (!fileName) return undefined;

    const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!ext) return undefined;

    return EXTENSION_TO_MIME[ext];
}

/**
 * Normalize resume text for analysis
 */
export function normalizeResumeText(text: string): string {
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\t/g, " ")
        .replace(/ {2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

/**
 * Validate resume input before processing
 * Supports both ResumeInput object and legacy (buffer, mimeType) signature
 */
export function validateResumeInput(
    input: ResumeInput | Buffer | string,
    mimeType?: string
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Handle legacy signature: (buffer, mimeType) or (url)
    let resolvedInput: ResumeInput;
    if (Buffer.isBuffer(input)) {
        resolvedInput = { buffer: input, mimeType };
    } else if (typeof input === "string") {
        resolvedInput = { url: input };
    } else {
        resolvedInput = input as ResumeInput;
    }

    // Must have either buffer or url
    if (!resolvedInput.buffer && !resolvedInput.url) {
        errors.push("Either resume buffer or URL is required");
        return { valid: false, errors };
    }

    if (resolvedInput.url) {
        // URL validation
        try {
            const url = new URL(resolvedInput.url);
            if (!["http:", "https:"].includes(url.protocol)) {
                errors.push("URL must use http or https protocol");
            }
        } catch {
            errors.push("Invalid URL format");
        }
    }

    if (resolvedInput.buffer) {
        // Buffer validation
        if (resolvedInput.buffer.length === 0) {
            errors.push("Resume file is empty");
        }

        if (resolvedInput.buffer.length > MAX_FILE_SIZE) {
            errors.push("File size exceeds 10MB limit");
        }

        if (
            resolvedInput.mimeType &&
            !SUPPORTED_MIME_TYPES.includes(resolvedInput.mimeType as SupportedMimeType)
        ) {
            errors.push(`Unsupported file type. Accepted: PDF, DOC, DOCX, TXT`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Get supported file types info
 */
export function getSupportedFileTypes(): {
    mimeTypes: readonly string[];
    extensions: string[];
    description: string;
} {
    return {
        mimeTypes: SUPPORTED_MIME_TYPES,
        extensions: Object.keys(EXTENSION_TO_MIME),
        description: "PDF, DOC, DOCX, or TXT files up to 10MB",
    };
}
