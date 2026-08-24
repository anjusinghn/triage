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
  ReviewedCandidate,
  ReviewProgress,
} from '@/lib/ats-types';
import { DEFAULT_JOB_SLUG } from '@/lib/ats-types';
import {
  getAtsJobs,
  listGeneratedResumes,
  startAtsReview,
  getAtsReviewProgress,
  getAtsReviewResults,
  getLatestResultsForJob,
} from '@/src/actions/ats-review';
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
  type SortField,
  type SortOrder,
} from '@/components/ats';
import { selectShortlisted } from '@/lib/ats-shortlist';

function pickDefaultJobId(jobs: ATSJobPosting[]): string {
  return jobs.find((job) => job.slug === DEFAULT_JOB_SLUG)?.id ?? jobs[0]?.id ?? '';
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
  if (/fireworks|gemini|google|anthropic|groq|openrouter|openai/i.test(message)) {
    return fallback;
  }
  return message;
}

export default function AIReviewerPage() {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [positionEditorMode, setPositionEditorMode] = useState<'view' | 'edit' | 'create'>('view');
  const [jobs, setJobs] = useState<ATSJobPosting[]>([]);
  const [generatedCount, setGeneratedCount] = useState(GENERATED_RESUME_CAP);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId),
    [jobs, selectedJobId]
  );

  const jobSelectItems = useMemo(
    () => Object.fromEntries(jobs.map((job) => [job.id, job.title])),
    [jobs]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [jobList, generated] = await Promise.all([
          getAtsJobs(),
          listGeneratedResumes(),
        ]);
        if (cancelled) return;
        setJobs(jobList);
        setSelectedJobId((current) =>
          current && jobList.some((job) => job.id === current)
            ? current
            : pickDefaultJobId(jobList)
        );
        setGeneratedCount(Math.min(generated.count, GENERATED_RESUME_CAP));
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
    if (!selectedJobId || isReviewing || startingReview) return;

    let cancelled = false;

    async function loadPastReviews() {
      try {
        const past = await getLatestResultsForJob(selectedJobId);
        if (cancelled) return;
        setReviewedCandidates(past);
        setHasReviewed(past.length > 0);
      } catch (err) {
        if (cancelled) return;
        setReviewedCandidates([]);
        setHasReviewed(false);
        const message = publicClientError(err, 'Failed to load saved reviews.');
        setErrorMessage(message);
      }
    }

    void loadPastReviews();
    return () => {
      cancelled = true;
    };
  }, [selectedJobId, isReviewing, startingReview]);

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
            const fromDb = await getLatestResultsForJob(selectedJobId);
            const results = fromDb.length > 0 ? fromDb : await getAtsReviewResults(sessionId);
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
        timeoutId = setTimeout(poll, 800);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, isReviewing, selectedJobId]);

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
    Boolean(selectedJobId) && (files.length > 0 || generatedCount > 0);
  const resumeCount = attachGeneratedResumes
    ? generatedCount + files.length
    : files.length;

  const handleRoleChange = useCallback((value: string | null) => {
    if (!value) return;
    setSelectedJobId(value);
    setPositionEditorMode('view');
    setSessionId(null);
    setLiveProgress(null);
    setIsReviewing(false);
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
        if (started.status === 'completed' && started.results.length > 0) {
          setReviewedCandidates(started.results);
          setHasReviewed(true);
          setIsReviewing(false);
          setLiveProgress(null);
          return;
        }
        setIsReviewing(true);
      } catch (err) {
        const message = publicClientError(err, 'Failed to start review.');
        setErrorMessage(message);
        setIsReviewing(false);
        setAttachGeneratedResumes(false);
      } finally {
        setStartingReview(false);
      }
    },
    [selectedJobId]
  );

  const handleUseExistingResumes = useCallback(async () => {
    setAttaching(true);
    setErrorMessage(null);
    try {
      const listed = await listGeneratedResumes();
      const cappedCount = Math.min(listed.count, GENERATED_RESUME_CAP);
      setGeneratedCount(cappedCount || GENERATED_RESUME_CAP);
      await beginReview({ useExistingResumes: true });
    } catch (err) {
      const message = publicClientError(err, 'Failed to start pre-generated review.');
      setErrorMessage(message);
    } finally {
      setAttaching(false);
    }
  }, [beginReview]);

  const handleFilesAdded = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(isPdfFile);
    if (valid.length === 0) {
      setErrorMessage('Please upload valid PDF resume files.');
      return;
    }
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      return combined.filter(
        (file, idx, self) =>
          idx === self.findIndex((other) => other.name === file.name && other.size === file.size)
      );
    });
    setErrorMessage(null);
  }, []);

  const handleRemoveFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleStartReview = useCallback(async () => {
    if (!canStartReview) {
      setErrorMessage('Drop or select PDF files first, or use the existing resume set.');
      return;
    }
    await beginReview({
      useExistingResumes: files.length === 0,
      extraFiles: files.length > 0 ? files : undefined,
    });
  }, [beginReview, canStartReview, files]);

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

  return (
    <div className="min-h-screen bg-gray-50 text-neutral-900">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <AIReviewerHeroHeader />

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
                      <SelectValue placeholder="Select position">
                        {selectedJob?.title ?? 'Select position'}
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

            {(isReviewing || hasReviewed) && (
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
                ) : (
                  <>
                    <RefreshIcon size={20} className="mr-2" />
                    Re-run Analysis
                  </>
                )}
              </Button>
            )}
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
            <h3 className="text-sm font-semibold text-neutral-900">Import PDFs</h3>
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
              className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
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
              <File01Icon size={22} className="mx-auto mb-2 text-[#15aabf]" />
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

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  or
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-2 text-xs text-neutral-500">Pre-generated resumes</p>
              <Button
                type="button"
                variant="outline"
                onClick={handleUseExistingResumes}
                disabled={attaching || isReviewing || startingReview}
                className="h-11 w-full border-[#15aabf] text-[#15aabf] hover:bg-[#15aabf]/10"
              >
                {attaching || (startingReview && attachGeneratedResumes) ? (
                  <Loading03Icon size={16} className="mr-2 animate-spin" />
                ) : (
                  <AttachmentIcon size={16} className="mr-2" />
                )}
                Use existing {generatedCount > 0 ? generatedCount : GENERATED_RESUME_CAP} resumes
              </Button>
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
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">No saved reviews yet</h3>
            <p className="mb-6 max-w-md text-center text-neutral-600">
              Import PDFs and run AI Review. Results are stored and will show up here next time.
            </p>
            <Button
              onClick={handleStartReview}
              disabled={startingReview || !canStartReview}
              size="lg"
              className="h-14 px-10 text-base font-medium text-white shadow-lg"
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
                  AI Review
                  {resumeCount > 0 ? ` for ${resumeCount} resumes` : ''}
                </>
              )}
            </Button>
            {!canStartReview && (
              <p className="mt-3 flex items-center gap-1 text-xs text-neutral-500">
                <UserGroupIcon size={14} />
                Import PDFs to enable AI Review, or use the existing resume set
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
    </div>
  );
}
