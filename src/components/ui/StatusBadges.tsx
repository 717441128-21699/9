import { cn } from '@/utils/format';
import { taskStatusMap, alertLevelMap, approvalStatusMap } from '@/utils/format';
import type { TaskStatus, AlertLevel, ApprovalStatus } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus;
  pulse?: boolean;
}

export function TaskStatusBadge({ status, pulse }: StatusBadgeProps) {
  const conf = taskStatusMap[status];
  return (
    <span className={cn('badge', conf.bg, conf.color)}>
      <span className={cn('alert-dot', conf.dot, pulse && status !== 'completed' && status !== 'error' && 'animate-pulse')} />
      {conf.label}
    </span>
  );
}

interface AlertBadgeProps {
  level: AlertLevel;
  pulse?: boolean;
  showText?: boolean;
}

export function AlertLevelBadge({ level, pulse, showText }: AlertBadgeProps) {
  const conf = alertLevelMap[level];
  return (
    <span className={cn('badge border', conf.bg, conf.color, conf.border)}>
      <span className={cn('alert-dot', pulse && 'animate-pulse-fast')} style={{ backgroundColor: conf.color.replace('text-', '') }} />
      {showText && <span className="text-[10px] opacity-70 mr-0.5">{conf.text}</span>}
      {conf.label}
    </span>
  );
}

interface ApprovalBadgeProps {
  status: ApprovalStatus;
}

export function ApprovalStatusBadge({ status }: ApprovalBadgeProps) {
  const conf = approvalStatusMap[status];
  return (
    <span className={cn('badge', conf.bg, conf.color)}>
      {conf.label}
    </span>
  );
}
