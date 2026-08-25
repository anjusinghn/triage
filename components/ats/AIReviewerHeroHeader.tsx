'use client';

import { Clock01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';

export function AIReviewerHeroHeader(props: {
  onViewPastScans?: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <h1 className="font-[family-name:var(--font-playfair-display)] text-3xl font-bold text-neutral-900">
        Smart Resume Screener
      </h1>
      <Button
        type="button"
        variant="outline"
        onClick={() => props.onViewPastScans?.()}
        className="h-9 shrink-0 border-[#15aabf] text-[#15aabf] hover:bg-[#15aabf]/10 hover:text-[#15aabf]"
      >
        <Clock01Icon size={16} />
        View all past scans
      </Button>
    </header>
  );
}
