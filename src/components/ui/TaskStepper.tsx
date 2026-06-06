import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/format';
import type { TaskStatus } from '@/types';

const steps: { key: TaskStatus; label: string }[] = [
  { key: 'pending', label: '待校验' },
  { key: 'preprocessing', label: '预处理' },
  { key: 'meshing', label: '网格生成' },
  { key: 'calculating', label: '径流计算' },
  { key: 'routing', label: '洪水演进' },
  { key: 'completed', label: '完成' },
];

interface TaskStepperProps {
  status: TaskStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export function TaskStepper({ status, className, size = 'md' }: TaskStepperProps) {
  const currentIdx = status === 'error' ? 4 : steps.findIndex((s) => s.key === status);
  const hasError = status === 'error';

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === steps.length - 1;
        const isErrorState = hasError && idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'rounded-full flex items-center justify-center border-2 transition-all',
                  size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs',
                  isCompleted && !isErrorState && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
                  isCurrent && !isErrorState && !hasError && 'bg-hydra-500/20 border-hydra-500 text-hydra-300 shadow-glow-sm',
                  isErrorState && 'bg-alert-red/20 border-alert-red text-alert-red animate-pulse',
                  !isCompleted && !isCurrent && 'bg-surface-elevated border-surface-muted text-slate-500'
                )}
              >
                {isCompleted && !isErrorState ? (
                  <Check className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
                ) : isErrorState ? (
                  <AlertTriangle className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
                ) : isCurrent ? (
                  <Loader2 className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4', 'animate-spin')} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-1 whitespace-nowrap',
                  size === 'sm' ? 'text-[10px]' : 'text-xs',
                  isCompleted && !isErrorState && 'text-emerald-400',
                  isCurrent && !isErrorState && !hasError && 'text-hydra-300 font-medium',
                  isErrorState && 'text-alert-red',
                  !isCompleted && !isCurrent && !isErrorState && 'text-slate-500'
                )}
              >
                {isErrorState ? '异常回退' : step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  size === 'sm' ? 'w-6 h-px' : 'w-12 h-0.5',
                  'mb-4 transition-all',
                  idx < currentIdx
                    ? 'bg-gradient-to-r from-emerald-500/60 to-hydra-500/60'
                    : 'bg-surface-muted'
                )}
                style={
                  isCurrent && !isErrorState
                    ? {
                        backgroundImage:
                          'linear-gradient(90deg, rgba(12,138,240,0.15), rgba(12,138,240,0.8), rgba(12,138,240,0.15))',
                        backgroundSize: '200% 100%',
                        animation: 'flowLine 2s linear infinite',
                      }
                    : undefined
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
