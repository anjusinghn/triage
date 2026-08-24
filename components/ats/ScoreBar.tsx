/**
 * @fileoverview Score Bar Component
 * @description Visual score bar for ATS scoring display
 */

interface ScoreBarProps {
  label: string;
  value: number;
  color?: string;
}

export function ScoreBar({ label, value, color = "#15aabf" }: ScoreBarProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-600">{label}</span>
        <span className="font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
