/**
 * @pendent/ats-engine
 * Error Classes
 */

/**
 * Base error class for all ATS engine errors
 */
export class ATSError extends Error {
    readonly code: string;
    readonly status?: number;
    type: string;
    readonly cause?: Error;

    constructor(
        message: string,
        code: string,
        options?: { status?: number; cause?: Error; type?: string }
    ) {
        super(message);
        this.name = "ATSError";
        this.code = code;
        this.type = options?.type ?? "ats_error";
        this.status = options?.status;
        this.cause = options?.cause;

        // Maintains proper stack trace for where error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            type: this.type,
            status: this.status,
        };
    }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends ATSError {
    readonly field?: string;
    readonly details?: Record<string, string[]>;

    constructor(
        message: string,
        options?: {
            field?: string;
            details?: Record<string, string[]>;
            cause?: Error;
        }
    ) {
        super(message, "validation_error", {
            status: 400,
            cause: options?.cause,
            type: "invalid_request_error",
        });
        this.name = "ValidationError";
        this.field = options?.field;
        this.details = options?.details;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            field: this.field,
            details: this.details,
        };
    }
}

/**
 * Error thrown when file extraction fails
 */
export class ExtractionError extends ATSError {
    readonly fileName?: string;
    readonly mimeType?: string;
    readonly stage: "download" | "parse" | "extract";

    constructor(
        message: string,
        stage: "download" | "parse" | "extract",
        options?: {
            fileName?: string;
            mimeType?: string;
            cause?: Error;
        }
    ) {
        super(message, "extraction_error", {
            status: 422,
            cause: options?.cause,
            type: "extraction_error",
        });
        this.name = "ExtractionError";
        this.stage = stage;
        this.fileName = options?.fileName;
        this.mimeType = options?.mimeType;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            stage: this.stage,
            fileName: this.fileName,
            mimeType: this.mimeType,
        };
    }
}

/**
 * Error thrown when LLM API calls fail
 */
export class LLMError extends ATSError {
    readonly provider: string;
    readonly retryable: boolean;
    readonly retryAfter?: number;

    constructor(
        message: string,
        provider: string,
        options?: {
            retryable?: boolean;
            retryAfter?: number;
            status?: number;
            cause?: Error;
        }
    ) {
        super(message, "llm_error", {
            status: options?.status ?? 502,
            cause: options?.cause,
            type: "llm_error",
        });
        this.name = "LLMError";
        this.provider = provider;
        this.retryable = options?.retryable ?? false;
        this.retryAfter = options?.retryAfter;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            provider: this.provider,
            retryable: this.retryable,
            retryAfter: this.retryAfter,
        };
    }
}

/**
 * Error thrown when scoring fails
 */
export class ScoringError extends ATSError {
    readonly stage: "analysis" | "validation" | "calculation" | "output";

    constructor(
        message: string,
        stage: "analysis" | "validation" | "calculation" | "output",
        options?: {
            cause?: Error;
        }
    ) {
        super(message, "scoring_error", {
            status: 500,
            cause: options?.cause,
            type: "scoring_error",
        });
        this.name = "ScoringError";
        this.stage = stage;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            stage: this.stage,
        };
    }
}

/**
 * Error thrown when rate limited
 */
export class RateLimitError extends ATSError {
    readonly retryAfter: number;
    readonly limit: number;
    readonly remaining: number;

    constructor(
        message: string,
        options: {
            retryAfter: number;
            limit: number;
            remaining: number;
        }
    ) {
        super(message, "rate_limit_error", { status: 429, type: "rate_limit_error" });
        this.name = "RateLimitError";
        this.retryAfter = options.retryAfter;
        this.limit = options.limit;
        this.remaining = options.remaining;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            retryAfter: this.retryAfter,
            limit: this.limit,
            remaining: this.remaining,
        };
    }
}

/**
 * Error thrown when network/connection fails
 */
export class ConnectionError extends ATSError {
    readonly endpoint?: string;
    readonly timeout?: boolean;

    constructor(
        message: string,
        options?: {
            endpoint?: string;
            timeout?: boolean;
            cause?: Error;
        }
    ) {
        super(message, "connection_error", {
            status: 503,
            cause: options?.cause,
            type: "connection_error",
        });
        this.name = "ConnectionError";
        this.endpoint = options?.endpoint;
        this.timeout = options?.timeout;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            endpoint: this.endpoint,
            timeout: this.timeout,
        };
    }
}

/**
 * Error thrown for unsupported file types
 */
export class UnsupportedFileError extends ATSError {
    readonly mimeType: string;
    readonly supportedTypes: string[];

    constructor(mimeType: string, supportedTypes: string[]) {
        super(
            `Unsupported file type: ${mimeType}. Supported types: ${supportedTypes.join(", ")}`,
            "unsupported_file_error",
            { status: 415, type: "unsupported_file_error" }
        );
        this.name = "UnsupportedFileError";
        this.mimeType = mimeType;
        this.supportedTypes = supportedTypes;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            mimeType: this.mimeType,
            supportedTypes: this.supportedTypes,
        };
    }
}

/**
 * Error thrown when file is too large
 */
export class FileTooLargeError extends ATSError {
    readonly fileSize: number;
    readonly maxSize: number;

    constructor(fileSize: number, maxSize: number) {
        super(
            `File size ${formatBytes(fileSize)} exceeds maximum ${formatBytes(maxSize)}`,
            "file_too_large_error",
            { status: 413, type: "file_too_large_error" }
        );
        this.name = "FileTooLargeError";
        this.fileSize = fileSize;
        this.maxSize = maxSize;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            fileSize: this.fileSize,
            maxSize: this.maxSize,
        };
    }
}

/**
 * Helper to format bytes for error messages
 */
function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Type guard to check if error is an ATSError
 */
export function isATSError(error: unknown): error is ATSError {
    return error instanceof ATSError;
}

/**
 * Type guard for specific error types
 */
export function isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
}

export function isExtractionError(error: unknown): error is ExtractionError {
    return error instanceof ExtractionError;
}

export function isLLMError(error: unknown): error is LLMError {
    return error instanceof LLMError;
}

export function isScoringError(error: unknown): error is ScoringError {
    return error instanceof ScoringError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
    return error instanceof RateLimitError;
}

export function isConnectionError(error: unknown): error is ConnectionError {
    return error instanceof ConnectionError;
}

export function isUnsupportedFileError(error: unknown): error is UnsupportedFileError {
    return error instanceof UnsupportedFileError;
}

export function isFileTooLargeError(error: unknown): error is FileTooLargeError {
    return error instanceof FileTooLargeError;
}
