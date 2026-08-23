import type { ReviewProgress, ReviewedCandidate } from '@/lib/ats-types';

export interface AtsSession {
  sessionId: string;
  jobId: string;
  jobTitle: string;
  startedAt: number;
  clientIp: string;
  progress: ReviewProgress;
  results: ReviewedCandidate[];
}

const globalForAts = globalThis as typeof globalThis & {
  __atsReviewSessions?: Map<string, AtsSession>;
};

const sessions = globalForAts.__atsReviewSessions ?? new Map<string, AtsSession>();
globalForAts.__atsReviewSessions = sessions;

export function createAtsSession(session: AtsSession): AtsSession {
  sessions.set(session.sessionId, session);
  return session;
}

export function getAtsSession(sessionId: string): AtsSession | undefined {
  return sessions.get(sessionId);
}

export function snapshotProgress(session: AtsSession): ReviewProgress {
  return {
    ...session.progress,
    elapsedTimeMs: Date.now() - session.startedAt,
    candidates: session.progress.candidates.map((candidate) => ({ ...candidate })),
    currentCandidate: session.progress.currentCandidate
      ? { ...session.progress.currentCandidate }
      : undefined,
  };
}

export function getAtsSessionResults(sessionId: string): ReviewedCandidate[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return [...session.results];
}
