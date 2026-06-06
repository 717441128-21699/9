import { cn } from '@/utils/format';

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  size = 'md',
  showLabel,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isHigh = pct >= 90;
  const isMid = pct >= 60 && pct < 90;
  const defaultColor = isHigh
    ? 'bg-emerald-500'
    : isMid
    ? 'bg-hydra-500'
    : 'bg-hydra-400';

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'progress-bar flex-1',
          size === 'sm' ? 'h-1' : 'h-2',
          className
        )}
      >
        <div
          className={cn('progress-fill', barClassName ?? defaultColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono text-slate-400 w-10 text-right">
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
