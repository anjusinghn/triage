'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AiBrain01Icon,
  AttachmentIcon,
  FilterIcon,
  File01Icon,
  Loading03Icon,
  PlayIcon,
  RefreshIcon,
  Cancel01Icon,
  UserGroupIcon,
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getTierColor } from '@/lib/ats-tiers';
import type {
  ATSJobPosting,
  PastScan,
  ReviewedCandidate,
  ReviewProgress,
} from '@/lib/ats-types';
import { DEFAULT_JOB_SLUG } from '@/lib/ats-types';
import { defaultFullstackJobPosting } from '@/lib/ats-default-jobs';
import {
  getAtsJobs,
  listGeneratedResumes,
  startAtsReview,
  getAtsReviewProgress,
  getAtsReviewResults,
  listPastShortlistedScans,
  getReviewSecurityState,
  submitReviewAccessCode,
} from '@/src/actions/ats-review';
import { Input } from '@/components/ui/input';
import {
  AIReviewerHeroHeader,
  ReviewStatsCards,
  JobDetailsCard,
  JobContextBanner,
  JobPositionEditor,
  ReviewProgressBar,
  LiveReviewPanel,
  ShortlistedSection,
  CandidatesRankingTable,
  CandidateDetailModal,
  ATSResumeModal,
  PastScansPanel,
  type SortField,
  type SortOrder,
} from '@/components/ats';
import { selectShortlisted } from '@/lib/ats-shortlist';

function pickDefaultJobId(jobs: ATSJobPosting[]): string {
  return jobs.find((job) => job.slug === DEFAULT_JOB_SLUG)?.id ?? jobs[0]?.id ?? '';
}

function jobsForFirstPaint(initialJobs?: ATSJobPosting[]): ATSJobPosting[] {
  if (initialJobs && initialJobs.length > 0) return sortJobList(initialJobs);
  return [defaultFullstackJobPosting()];
}

function sortJobList(jobs: ATSJobPosting[]): ATSJobPosting[] {
  const order: Record<string, number> = { fullstack: 0, frontend: 1 };
  return [...jobs].sort((a, b) => {
    const orderA = order[a.slug] ?? 2;
    const orderB = order[b.slug] ?? 2;
    if (orderA !== orderB) return orderA - orderB;
    return a.title.localeCompare(b.title);
  });
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

const GENERATED_RESUME_CAP = 30;

function publicClientError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback;
  if (/fireworks|gemini|google|anthropic|groq|openrouter|openai|api[_-]?key|bearer|sk-|fw_/i.test(message)) {
    return fallback;
  }
  return message;
}

export function SmartResumeScreener({
  initialJobs = [],
}: {
  initialJobs?: ATSJobPosting[];
}) {
  const firstJobs = jobsForFirstPaint(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState(pickDefaultJobId(firstJobs));
  const [positionEditorMode, setPositionEditorMode] = useState<'view' | 'edit' | 'create'>('view');
  const [jobs, setJobs] = useState<ATSJobPosting[]>(firstJobs);
  const [generatedCount, setGeneratedCount] = useState(GENERATED_RESUME_CAP);
  const [generatedPreviews, setGeneratedPreviews] = useState<
    Array<{ fileName: string; displayName: string }>
  >([]);
  const [attachGeneratedResumes, setAttachGeneratedResumes] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const [isReviewing, setIsReviewing] = useState(false);
  const [startingReview, setStartingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [liveProgress, setLiveProgress] = useState<ReviewProgress | null>(null);
  const [reviewedCandidates, setReviewedCandidates] = useState<ReviewedCandidate[]>([]);

  const [sortBy, setSortBy] = useState<SortField>('atsScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterTier, setFilterTier] = useState<string>('all');

  const [selectedCandidate, setSelectedCandidate] = useState<ReviewedCandidate | null>(null);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeCandidate, setResumeCandidate] = useState<ReviewedCandidate | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPastScans, setShowPastScans] = useState(false);
  const [pastScans, setPastScans] = useState<PastScan[]>([]);
  const [pastScansLoading, setPastScansLoading] = useState(false);
  const [gateEnabled, setGateEnabled] = useState(false);
  const [gateUnlocked, setGateUnlocked] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedJob = useMemo(
    () =>
      jobs.find((job) => job.id === selectedJobId) ??
      jobs.find((job) => job.slug === DEFAULT_JOB_SLUG) ??
      jobs[0],
    [jobs, selectedJobId]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [jobList, generated, security] = await Promise.all([
          getAtsJobs(),
          listGeneratedResumes(),
          getReviewSecurityState(),
        ]);
        if (cancelled) return;
        const nextJobs = jobList.length > 0 ? jobList : [defaultFullstackJobPosting()];
        setJobs(nextJobs);
        setSelectedJobId((current) =>
          current && nextJobs.some((job) => job.id === current)
            ? current
            : pickDefaultJobId(nextJobs)
        );
        setGeneratedCount(Math.min(generated.count, GENERATED_RESUME_CAP));
        setGeneratedPreviews(generated.previews);
        setGateEnabled(security.gateEnabled);
        setGateUnlocked(security.unlocked);
      } catch (err) {
        if (cancelled) return;
        const message = publicClientError(err, 'Failed to load ATS jobs.');
        setErrorMessage(message);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId || !isReviewing) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const next = await getAtsReviewProgress(sessionId);
        if (cancelled) return;

        if (next) {
          setLiveProgress(next);

          if (next.status === 'completed') {
            if (next.totalCandidates > 0 && next.processedCount < next.totalCandidates) {
              timeoutId = setTimeout(poll, 400);
              return;
            }
            const results = await getAtsReviewResults(sessionId);
            if (cancelled) return;
            setReviewedCandidates(results);
            setHasReviewed(true);
            setIsReviewing(false);
            return;
          }

          if (next.status === 'failed') {
            setErrorMessage('Review failed. Please try again.');
            setIsReviewing(false);
            return;
          }
        }
      } catch (err) {
        if (cancelled) return;
        const message = publicClientError(err, 'Failed to poll review progress.');
        setErrorMessage(message);
      }

      if (!cancelled) {
        timeoutId = setTimeout(poll, 400);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, isReviewing]);

  const filteredCandidates = useMemo(() => {
    if (filterTier === 'all') return reviewedCandidates;
    return reviewedCandidates.filter((candidate) => candidate.tier === filterTier);
  }, [reviewedCandidates, filterTier]);

  const sortedCandidates = useMemo(() => {
    return [...filteredCandidates].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [filteredCandidates, sortBy, sortOrder]);

  const rankedAll = useMemo(() => {
    return [...reviewedCandidates].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [reviewedCandidates, sortBy, sortOrder]);

  const tierBreakdown = useMemo(
    () => ({
      top: reviewedCandidates.filter((c) => c.tier === 'top').length,
      qualified: reviewedCandidates.filter((c) => c.tier === 'qualified').length,
      maybe: reviewedCandidates.filter((c) => c.tier === 'maybe').length,
      unqualified: reviewedCandidates.filter((c) => c.tier === 'unqualified').length,
      rejected: reviewedCandidates.filter((c) => c.tier === 'rejected').length,
    }),
    [reviewedCandidates]
  );

  const { shortlisted, usedMaybeFallback } = useMemo(
    () => selectShortlisted(reviewedCandidates),
    [reviewedCandidates]
  );

  const remainingCandidates = useMemo(() => {
    const shortlistedIds = new Set(shortlisted.map((candidate) => candidate.id));
    return sortedCandidates.filter((candidate) => !shortlistedIds.has(candidate.id));
  }, [sortedCandidates, shortlisted]);

  const progressPercent = liveProgress
    ? liveProgress.totalCandidates > 0
      ? Math.round((liveProgress.processedCount / liveProgress.totalCandidates) * 100)
      : 0
    : 0;

  const canStartReview =
    Boolean(selectedJobId) && (files.length > 0 || attachGeneratedResumes);
  const resumeCount = files.length + (attachGeneratedResumes ? generatedCount : 0);

  const jobSelectItems = useMemo(
    () => Object.fromEntries(jobs.map((job) => [job.id, job.title])),
    [jobs]
  );

  const handleRoleChange = useCallback((value: string | null) => {
    if (!value) return;
    setSelectedJobId(value);
    setPositionEditorMode('view');
    setSessionId(null);
    setLiveProgress(null);
    setIsReviewing(false);
    setHasReviewed(false);
    setReviewedCandidates([]);
    setAttachGeneratedResumes(false);
  }, []);

  const handlePositionSaved = useCallback((job: ATSJobPosting) => {
    setJobs((prev) => {
      const exists = prev.some((item) => item.id === job.id);
      const next = exists
        ? prev.map((item) => (item.id === job.id ? job : item))
        : [...prev, job];
      return sortJobList(next);
    });
    setSelectedJobId(job.id);
    setPositionEditorMode('view');
  }, []);

  const handlePositionDeleted = useCallback((deletedId: string) => {
    const remaining = jobs.filter((job) => job.id !== deletedId);
    setJobs(remaining);
    setSelectedJobId(pickDefaultJobId(remaining));
    setPositionEditorMode('view');
  }, [jobs]);

  const beginReview = useCallback(
    async (opts: { useExistingResumes: boolean; extraFiles?: File[] }) => {
      setStartingReview(true);
      setErrorMessage(null);
      setHasReviewed(false);
      setReviewedCandidates([]);
      setLiveProgress(null);
      setFilterTier('all');
      setAttachGeneratedResumes(opts.useExistingResumes);

      try {
        const started = await startAtsReview({
          jobId: selectedJobId,
          attachGeneratedResumes: opts.useExistingResumes,
          files: opts.extraFiles && opts.extraFiles.length > 0 ? opts.extraFiles : undefined,
        });
        setSessionId(started.sessionId);
        setReviewedCandidates([]);
        setHasReviewed(false);
        setLiveProgress({
          sessionId: started.sessionId,
          jobId: selectedJobId,
          jobTitle: '',
          status: 'running',
          totalCandidates: resumeCount,
          processedCount: 0,
          completedCount: 0,
          failedCount: 0,
          candidates: [],
          elapsedTimeMs: 0,
        });
        setIsReviewing(true);
      } catch (err) {
        const message = publicClientError(err, 'Failed to start review.');
        setErrorMessage(message);
        setIsReviewing(false);
      } finally {
        setStartingReview(false);
      }
    },
    [selectedJobId, resumeCount]
  );

  const handleUseExistingResumes = useCallback(async () => {
    setAttaching(true);
    setErrorMessage(null);
    try {
      const listed = await listGeneratedResumes();
      const cappedCount = Math.min(listed.count, GENERATED_RESUME_CAP);
      setGeneratedCount(cappedCount || GENERATED_RESUME_CAP);
      setGeneratedPreviews(listed.previews);
      setAttachGeneratedResumes(true);
    } catch (err) {
      const message = publicClientError(err, 'Failed to attach pre-generated resumes.');
      setErrorMessage(message);
    } finally {
      setAttaching(false);
    }
  }, []);

  const handleFilesAdded = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((file) => {
      if (!isPdfFile(file)) return false;
      if (file.size > 2 * 1024 * 1024) return false;
      return true;
    });
    if (valid.length === 0) {
      setErrorMessage('Please upload PDF resumes of 2 MB or smaller.');
      return;
    }
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      const unique = combined.filter(
        (file, idx, self) =>
          idx === self.findIndex((other) => other.name === file.name && other.size === file.size)
      );
      return unique.slice(0, 5);
    });
    setErrorMessage(null);
  }, []);

  const handleRemoveFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleStartReview = useCallback(async () => {
    if (!canStartReview) {
      setErrorMessage('Drop or select PDF files first, or use the existing 30 resumes.');
      return;
    }
    if (files.length > 0 && gateEnabled && !gateUnlocked) {
      setErrorMessage('Enter the access code to run AI review on uploaded PDFs.');
      return;
    }
    await beginReview({
      useExistingResumes: attachGeneratedResumes,
      extraFiles: files.length > 0 ? files : undefined,
    });
  }, [attachGeneratedResumes, beginReview, canStartReview, files, gateEnabled, gateUnlocked]);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
      } else {
        setSortBy(field);
        setSortOrder('desc');
      }
    },
    [sortBy, sortOrder]
  );

  const openCandidateModal = useCallback((candidate: ReviewedCandidate) => {
    const index = rankedAll.findIndex((item) => item.id === candidate.id);
    setSelectedCandidate(candidate);
    setSelectedCandidateIndex(index >= 0 ? index : 0);
  }, [rankedAll]);

  const closeCandidateModal = useCallback(() => {
    setSelectedCandidate(null);
  }, []);

  const goToPreviousCandidate = useCallback(() => {
    if (selectedCandidateIndex > 0) {
      const newIndex = selectedCandidateIndex - 1;
      setSelectedCandidate(rankedAll[newIndex]);
      setSelectedCandidateIndex(newIndex);
    }
  }, [selectedCandidateIndex, rankedAll]);

  const goToNextCandidate = useCallback(() => {
    if (selectedCandidateIndex < rankedAll.length - 1) {
      const newIndex = selectedCandidateIndex + 1;
      setSelectedCandidate(rankedAll[newIndex]);
      setSelectedCandidateIndex(newIndex);
    }
  }, [selectedCandidateIndex, rankedAll]);

  const openResumeModal = useCallback((candidate: ReviewedCandidate, e: React.MouseEvent) => {
    e.stopPropagation();
    setResumeCandidate(candidate);
    setShowResumeModal(true);
  }, []);

  const closeResumeModal = useCallback(() => {
    setResumeCandidate(null);
    setShowResumeModal(false);
  }, []);

  const handleViewPastScans = useCallback(async () => {
    setShowPastScans(true);
    setPastScansLoading(true);
    try {
      const scans = await listPastShortlistedScans();
      setPastScans(scans);
    } catch (err) {
      const message = publicClientError(err, 'Failed to load past scans.');
      setErrorMessage(message);
    } finally {
      setPastScansLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-neutral-900">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <AIReviewerHeroHeader onViewPastScans={handleViewPastScans} />

        {errorMessage && (
          <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex-1 leading-relaxed">{errorMessage}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setErrorMessage(null)}
              className="h-7 shrink-0 px-2 text-xs text-rose-700 hover:text-rose-900"
            >
              Dismiss
            </Button>
          </div>
        )}

        {gateEnabled && !gateUnlocked && (
          <form
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 sm:flex-row sm:items-center"
            onSubmit={async (event) => {
              event.preventDefault();
              setUnlocking(true);
              setErrorMessage(null);
              try {
                await submitReviewAccessCode(accessCode);
                setGateUnlocked(true);
                setAccessCode('');
              } catch (err) {
                setErrorMessage(publicClientError(err, 'That access code is incorrect.'));
              } finally {
                setUnlocking(false);
              }
            }}
          >
            <p className="flex-1 text-sm text-neutral-600">
              Enter the access code to run AI review on uploaded PDFs.
            </p>
            <Input
              type="password"
              autoComplete="off"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              placeholder="Access code"
              className="h-10 sm:w-48"
            />
            <Button type="submit" disabled={unlocking || !accessCode.trim()} className="h-10">
              {unlocking ? 'Checking…' : 'Unlock'}
            </Button>
          </form>
        )}

        <div className="rounded-xl border border-neutral-300 bg-gray-100 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Target position
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedJobId}
                    onValueChange={handleRoleChange}
                    items={jobSelectItems}
                    disabled={jobs.length === 0 || isReviewing || startingReview}
                  >
                    <SelectTrigger className="h-11 w-[280px] rounded-xl bg-white">
                      <SelectValue placeholder="Senior Full Stack Engineer">
                        {selectedJob?.title ?? 'Senior Full Stack Engineer'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => setPositionEditorMode('create')}
                    disabled={isReviewing || startingReview}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {hasReviewed && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Filter by Tier
                  </label>
                  <Select
                    value={filterTier}
                    onValueChange={(value) => value && setFilterTier(value)}
                    items={{
                      all: 'All Tiers',
                      top: 'Top',
                      qualified: 'Qualified',
                      maybe: 'Maybe',
                      unqualified: 'Unqualified',
                      rejected: 'Rejected',
                    }}
                  >
                    <SelectTrigger className="h-11 w-[180px] rounded-xl bg-white">
                      <FilterIcon size={16} className="mr-2 text-neutral-500" />
                      <SelectValue placeholder="All Tiers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      {(['top', 'qualified', 'maybe', 'unqualified', 'rejected'] as const).map(
                        (tier) => (
                          <SelectItem key={tier} value={tier}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: getTierColor(tier) }}
                              />
                              {tier.charAt(0).toUpperCase() + tier.slice(1)} (
                              {tierBreakdown[tier]})
                            </span>
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {hasReviewed && (
                <div className="text-sm text-neutral-600">
                  <span className="font-semibold text-neutral-900">{sortedCandidates.length}</span>{' '}
                  candidates
                </div>
              )}
            </div>

            <Button
              onClick={handleStartReview}
              disabled={isReviewing || startingReview || !canStartReview}
              size="lg"
              className="h-12 px-8 text-white shadow-lg disabled:opacity-50"
              style={{ backgroundColor: '#15aabf' }}
            >
              {isReviewing || startingReview ? (
                <>
                  <Loading03Icon size={20} className="mr-2 animate-spin" />
                  {startingReview ? 'Starting...' : `Analyzing... ${progressPercent}%`}
                </>
              ) : hasReviewed ? (
                <>
                  <RefreshIcon size={20} className="mr-2" />
                  Re-run Analysis
                </>
              ) : (
                <>
                  <PlayIcon size={20} className="mr-2" />
                  Start AI review
                  {resumeCount > 0 ? ` (${resumeCount})` : ''}
                </>
              )}
            </Button>
          </div>

          {positionEditorMode === 'create' && (
            <JobPositionEditor
              key="new-position"
              job={null}
              canDelete={false}
              onCancel={() => setPositionEditorMode('view')}
              onSaved={handlePositionSaved}
              onDeleted={handlePositionDeleted}
            />
          )}
          {positionEditorMode === 'edit' && selectedJob && (
            <JobPositionEditor
              key={selectedJob.id}
              job={selectedJob}
              canDelete={jobs.length > 1}
              onCancel={() => setPositionEditorMode('view')}
              onSaved={handlePositionSaved}
              onDeleted={handlePositionDeleted}
            />
          )}
          {positionEditorMode === 'view' && selectedJob && (
            <JobDetailsCard
              job={selectedJob}
              onEdit={isReviewing || startingReview ? undefined : () => setPositionEditorMode('edit')}
            />
          )}

          <div className="mt-4 rounded-lg border border-neutral-200 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="flex min-w-0 flex-col">
                <h3 className="text-sm font-semibold text-neutral-900">Upload PDFs</h3>
                <p className="mt-1 mb-3 text-xs text-neutral-500">
                  Drag in files or select them from your computer.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files?.length) {
                      handleFilesAdded(e.dataTransfer.files);
                    }
                  }}
                  className={`flex min-h-[148px] w-full flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                    isDragging
                      ? 'border-[#15aabf] bg-[#15aabf]/10'
                      : files.length > 0
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-neutral-300 bg-neutral-50 hover:border-[#15aabf]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        handleFilesAdded(e.target.files);
                        e.target.value = '';
                      }
                    }}
                  />
                  <File01Icon size={22} className="mb-2 text-[#15aabf]" />
                  <p className="text-xs font-medium text-neutral-800">
                    Drop PDF resume(s) here, or <span className="underline">browse</span>
                  </p>
                </button>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        {files.length} file{files.length === 1 ? '' : 's'} selected
                      </span>
                      <button
                        type="button"
                        className="text-rose-600 hover:underline"
                        onClick={() => setFiles([])}
                      >
                        Clear
                      </button>
                    </div>
                    <ul className="max-h-28 space-y-1 overflow-y-auto">
                      {files.map((file, idx) => (
                        <li
                          key={`${file.name}-${file.size}-${idx}`}
                          className="flex items-center justify-between rounded-md bg-neutral-50 px-2 py-1 text-xs text-neutral-700"
                        >
                          <span className="truncate pr-2">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-neutral-400 hover:text-rose-600"
                            aria-label={`Remove ${file.name}`}
                          >
                            <Cancel01Icon size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:justify-center sm:gap-0">
                <div className="h-px flex-1 bg-neutral-200 sm:hidden" />
                <div className="hidden w-px flex-1 bg-neutral-200 sm:block" />
                <span className="shrink-0 px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400 sm:py-2">
                  or
                </span>
                <div className="h-px flex-1 bg-neutral-200 sm:hidden" />
                <div className="hidden w-px flex-1 bg-neutral-200 sm:block" />
              </div>

              <div className="flex min-w-0 flex-col">
                <h3 className="text-sm font-semibold text-neutral-900">Existing set</h3>
                <p className="mt-1 mb-3 text-xs text-neutral-500">
                  {attachGeneratedResumes
                    ? `${generatedCount} sample resumes selected`
                    : `${generatedCount} sample resumes ready to score`}
                </p>

                <div
                  className={`mb-3 flex min-h-[148px] flex-1 flex-col items-center justify-center rounded-xl border px-4 py-5 ${
                    attachGeneratedResumes
                      ? 'border-[#15aabf] bg-[#15aabf]/10'
                      : 'border-neutral-200 bg-neutral-50'
                  }`}
                >
                  <div className="relative mb-3 h-[84px] w-[148px]">
                    {(generatedPreviews.length > 0
                      ? generatedPreviews.slice(0, 3)
                      : [
                          { fileName: 'a', displayName: 'Resume' },
                          { fileName: 'b', displayName: 'Resume' },
                          { fileName: 'c', displayName: 'Resume' },
                        ]
                    ).map((preview, index) => (
                      <div
                        key={preview.fileName}
                        className="absolute flex h-[72px] w-[112px] flex-col rounded-md border border-neutral-200 bg-white p-2 shadow-sm"
                        style={{ left: index * 14, top: index * 6, zIndex: index }}
                      >
                        <File01Icon size={14} className="text-[#15aabf]" />
                        <span className="mt-auto truncate text-[10px] font-medium text-neutral-700">
                          {preview.displayName}
                        </span>
                        <span className="text-[9px] uppercase tracking-wide text-neutral-400">
                          PDF
                        </span>
                      </div>
                    ))}
                  </div>
                  {attachGeneratedResumes ? (
                    <p className="text-[11px] font-medium text-[#15aabf]">
                      {generatedCount} resumes selected
                    </p>
                  ) : generatedCount > 3 ? (
                    <p className="text-[11px] text-neutral-500">+{generatedCount - 3} more</p>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUseExistingResumes}
                  disabled={attaching || isReviewing || startingReview}
                  className="h-11 w-full border-[#15aabf] text-[#15aabf] hover:bg-[#15aabf]/10"
                >
                  {attaching ? (
                    <Loading03Icon size={16} className="mr-2 animate-spin" />
                  ) : (
                    <AttachmentIcon size={16} className="mr-2" />
                  )}
                  {attachGeneratedResumes
                    ? `${generatedCount} resumes selected`
                    : `Use ${generatedCount > 0 ? generatedCount : GENERATED_RESUME_CAP} resumes`}
                </Button>
              </div>
            </div>
          </div>

          {isReviewing && liveProgress && (
            <div className="mt-4 border-t border-neutral-200 pt-4">
              <LiveReviewPanel progress={liveProgress} />
            </div>
          )}

          {isReviewing && !liveProgress && (
            <ReviewProgressBar
              progress={0}
              totalCandidates={resumeCount}
              jobTitle={selectedJob?.title}
            />
          )}
        </div>

        {!hasReviewed && !isReviewing && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-300 bg-gray-100 py-16">
            <div
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#15aabf20' }}
            >
              <AiBrain01Icon size={32} style={{ color: '#15aabf' }} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">No review yet</h3>
            <p className="mb-6 max-w-md text-center text-neutral-600">
              {canStartReview
                ? `Ready to score ${resumeCount} resume${resumeCount === 1 ? '' : 's'}. Press Start AI review to begin.`
                : 'Import PDFs or attach the existing 30 resumes, then press Start AI review.'}
            </p>
            <Button
              onClick={handleStartReview}
              disabled={startingReview || !canStartReview}
              size="lg"
              className="h-14 px-10 text-base font-medium text-white shadow-lg disabled:opacity-50"
              style={{ backgroundColor: '#15aabf' }}
            >
              {startingReview ? (
                <>
                  <Loading03Icon size={22} className="mr-3 animate-spin" />
                  Starting Review...
                </>
              ) : (
                <>
                  <PlayIcon size={22} className="mr-3" />
                  Start AI review
                  {resumeCount > 0 ? ` for ${resumeCount} resumes` : ''}
                </>
              )}
            </Button>
            {!canStartReview && (
              <p className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
                <UserGroupIcon size={14} />
                Import PDFs or attach the existing 30 resumes to enable Start AI review
              </p>
            )}
          </div>
        )}

        {hasReviewed && (
          <>
            <p className="text-sm text-neutral-500">
              Parsed resumes saved for this role
            </p>
            <ReviewStatsCards
              totalReviewed={reviewedCandidates.length}
              tierBreakdown={tierBreakdown}
            />

            {selectedJob && <JobContextBanner job={selectedJob} />}

            <ShortlistedSection
              candidates={shortlisted}
              usedMaybeFallback={usedMaybeFallback}
              allCandidates={rankedAll}
              onCandidateClick={(candidate) => openCandidateModal(candidate)}
            />

            <CandidatesRankingTable
              candidates={remainingCandidates}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onToggleSort={toggleSort}
              onCandidateClick={(candidate) => openCandidateModal(candidate)}
              onViewResume={openResumeModal}
            />
          </>
        )}
      </main>

      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          candidateIndex={selectedCandidateIndex}
          totalCandidates={rankedAll.length}
          selectedJob={selectedJob}
          onClose={closeCandidateModal}
          onPrevious={goToPreviousCandidate}
          onNext={goToNextCandidate}
        />
      )}

      {showResumeModal && resumeCandidate && (
        <ATSResumeModal candidate={resumeCandidate} onClose={closeResumeModal} />
      )}

      <PastScansPanel
        open={showPastScans}
        onClose={() => setShowPastScans(false)}
        scans={pastScans}
        loading={pastScansLoading}
      />
    </div>
  );
}
