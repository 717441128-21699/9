import { cn } from '@/utils/format';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'cyan';
  dot?: boolean;
  pulse?: boolean;
}

const variantMap = {
  default: 'bg-slate-500/20 text-slate-300',
  blue: 'bg-hydra-500/20 text-hydra-300',
  green: 'bg-emerald-500/20 text-emerald-300',
  yellow: 'bg-alert-yellow/20 text-alert-yellow',
  orange: 'bg-alert-orange/20 text-alert-orange',
  red: 'bg-alert-red/20 text-alert-red',
  purple: 'bg-purple-500/20 text-purple-300',
  cyan: 'bg-cyan-500/20 text-cyan-300',
};

const dotColorMap = {
  default: 'bg-slate-400',
  blue: 'bg-hydra-400',
  green: 'bg-emerald-400',
  yellow: 'bg-alert-yellow',
  orange: 'bg-alert-orange',
  red: 'bg-alert-red',
  purple: 'bg-purple-400',
  cyan: 'bg-cyan-400',
};

export function Badge({ children, className, variant = 'default', dot, pulse }: BadgeProps) {
  return (
    <span className={cn('badge', variantMap[variant], className)}>
      {dot && <span className={cn('alert-dot', dotColorMap[variant], pulse && 'animate-pulse')} />}
      {children}
    </span>
  );
}
