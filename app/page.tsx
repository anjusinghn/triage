import { defaultFullstackJobPosting } from '@/lib/ats-default-jobs';
import { SmartResumeScreener } from '@/components/ats/SmartResumeScreener';
import { getAtsJobs } from '@/src/actions/ats-review';

export default async function Page() {
  let initialJobs = [defaultFullstackJobPosting()];
  try {
    const jobs = await getAtsJobs();
    if (jobs.length > 0) initialJobs = jobs;
  } catch (err) {
    console.warn('Failed to load jobs for first paint:', err);
  }

  return <SmartResumeScreener initialJobs={initialJobs} />;
}
