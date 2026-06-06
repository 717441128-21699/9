import { cn } from '@/utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

const colorMap = {
  blue: 'from-hydra-500/20 to-hydra-500/0 border-hydra-500/30 text-hydra-300',
  green: 'from-emerald-500/20 to-emerald-500/0 border-emerald-500/30 text-emerald-300',
  yellow: 'from-alert-yellow/20 to-alert-yellow/0 border-alert-yellow/30 text-alert-yellow',
  red: 'from-alert-red/20 to-alert-red/0 border-alert-red/30 text-alert-red',
  purple: 'from-purple-500/20 to-purple-500/0 border-purple-500/30 text-purple-300',
};

const iconBgMap = {
  blue: 'bg-hydra-500/20 text-hydra-400',
  green: 'bg-emerald-500/20 text-emerald-400',
  yellow: 'bg-alert-yellow/20 text-alert-yellow',
  red: 'bg-alert-red/20 text-alert-red',
  purple: 'bg-purple-500/20 text-purple-400',
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  suffix,
  color = 'blue',
  className,
}: StatCardProps) {
  const trendPositive = (trend ?? 0) >= 0;
  return (
    <div
      className={cn(
        'card p-5 relative overflow-hidden opacity-0 animate-fade-in',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
          colorMap[color]
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-sm text-slate-400">{title}</span>
          {icon && (
            <div className={cn('p-2 rounded-lg', iconBgMap[color])}>
              {icon}
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-3xl font-semibold text-white">
            {value}
          </span>
          {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
        </div>
        {(trend !== undefined || trendLabel) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-medium',
                  trendPositive ? 'text-emerald-400' : 'text-alert-red'
                )}
              >
                <svg
                  className={cn(
                    'w-3 h-3',
                    !trendPositive && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
                {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {trendLabel && (
              <span className="text-slate-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
