import { createLLMConfig, createJobInput, scoreCandidate, type ATSEngineOutput, type JobInput, type LLMConfig } from '@/src/ats-engine/index';
import { checkInferenceRateLimit, withInferenceThrottle } from '@/lib/rate-limiter';

export { createJobInput };
export type { ATSEngineOutput, JobInput };

const DEFAULT_FIREWORKS_MODEL = 'accounts/fireworks/models/deepseek-v4-flash-0731';
const DEFAULT_GOOGLE_MODEL = 'gemini-2.0-flash';

export function getServerLLMConfig(): LLMConfig | undefined {
  const fireworksKey = process.env.FIREWORKS_API_KEY?.trim();
  if (fireworksKey) {
    return createLLMConfig('custom', fireworksKey, {
      baseURL: 'https://api.fireworks.ai/inference/v1',
      model: process.env.FIREWORKS_MODEL?.trim() || DEFAULT_FIREWORKS_MODEL,
      temperature: 0.1,
      maxTokens: 2000,
    });
  }

  const googleKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (googleKey) {
    return createLLMConfig('custom', googleKey, {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_GOOGLE_MODEL,
      temperature: 0.1,
      maxTokens: 2000,
    });
  }

  return undefined;
}

export async function scoreResumeWithFireworks(args: {
  candidateName: string;
  email?: string;
  resumeBuffer: Buffer;
  resumeFileName: string;
  job: JobInput;
  clientIp?: string;
}): Promise<ATSEngineOutput> {
  const ip = args.clientIp?.trim() || '127.0.0.1';
  const quota = checkInferenceRateLimit(ip, false, 1);
  if (!quota.allowed) {
    throw new Error(quota.message || 'Too many AI reviews right now. Please wait and try again.');
  }

  return withInferenceThrottle(() =>
    scoreCandidate({
      candidate: {
        name: args.candidateName,
        email: args.email ?? '',
        phone: '',
        linkedinUrl: '',
        resumeBuffer: args.resumeBuffer,
        resumeMimeType: 'application/pdf',
        resumeFileName: args.resumeFileName,
      },
      job: args.job,
      llmConfig: getServerLLMConfig(),
    })
  );
}

/** Deterministic ATS score from resume text. No network, no rate limit. */
export async function scoreResumeLocally(args: {
  candidateName: string;
  email?: string;
  resumeBuffer: Buffer;
  resumeFileName: string;
  resumeMimeType?: string;
  job: JobInput;
}): Promise<ATSEngineOutput> {
  return scoreCandidate({
    candidate: {
      name: args.candidateName,
      email: args.email ?? '',
      phone: '',
      linkedinUrl: '',
      resumeBuffer: args.resumeBuffer,
      resumeMimeType: args.resumeMimeType ?? 'application/pdf',
      resumeFileName: args.resumeFileName,
    },
    job: args.job,
    options: { skipLLM: true },
  });
}
