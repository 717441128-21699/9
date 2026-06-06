import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type {
  TaskStatus,
  AlertLevel,
  ApprovalStatus,
  UserRole,
} from '@/types';

export function formatDate(date: string | Date, pattern = 'yyyy-MM-dd HH:mm:ss'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(num: number, decimals = 1): string {
  return `${(num * 100).toFixed(decimals)}%`;
}

export const taskStatusMap: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: '待校验', color: 'text-slate-300', bg: 'bg-slate-500/20', dot: 'bg-slate-400' },
  preprocessing: { label: '数据预处理', color: 'text-hydra-300', bg: 'bg-hydra-500/20', dot: 'bg-hydra-400' },
  meshing: { label: '网格生成', color: 'text-purple-300', bg: 'bg-purple-500/20', dot: 'bg-purple-400' },
  calculating: { label: '径流计算', color: 'text-cyan-300', bg: 'bg-cyan-500/20', dot: 'bg-cyan-400' },
  routing: { label: '洪水演进', color: 'text-amber-300', bg: 'bg-amber-500/20', dot: 'bg-amber-400' },
  completed: { label: '完成', color: 'text-emerald-300', bg: 'bg-emerald-500/20', dot: 'bg-emerald-400' },
  error: { label: '异常回退', color: 'text-alert-red', bg: 'bg-alert-red/20', dot: 'bg-alert-red' },
};

export const alertLevelMap: Record<AlertLevel, { label: string; color: string; bg: string; border: string; text: string }> = {
  blue: { label: '蓝色预警', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'Ⅳ级' },
  yellow: { label: '黄色预警', color: 'text-alert-yellow', bg: 'bg-alert-yellow/15', border: 'border-alert-yellow/30', text: 'Ⅲ级' },
  orange: { label: '橙色预警', color: 'text-alert-orange', bg: 'bg-alert-orange/15', border: 'border-alert-orange/30', text: 'Ⅱ级' },
  red: { label: '红色预警', color: 'text-alert-red', bg: 'bg-alert-red/15', border: 'border-alert-red/30', text: 'Ⅰ级' },
};

export const approvalStatusMap: Record<ApprovalStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  engineer_pending: { label: '待工程师验证', color: 'text-hydra-300', bg: 'bg-hydra-500/20' },
  engineer_approved: { label: '工程师已验证', color: 'text-cyan-300', bg: 'bg-cyan-500/20' },
  chief_pending: { label: '待总工确认', color: 'text-amber-300', bg: 'bg-amber-500/20' },
  approved: { label: '已入库', color: 'text-emerald-300', bg: 'bg-emerald-500/20' },
  rejected: { label: '已驳回', color: 'text-alert-red', bg: 'bg-alert-red/20' },
};

export const userRoleMap: Record<UserRole, { label: string; color: string }> = {
  hydrologist: { label: '值班水文学家', color: 'text-hydra-300' },
  engineer: { label: '水文工程师', color: 'text-cyan-300' },
  chief: { label: '总工', color: 'text-amber-300' },
  commander: { label: '防汛指挥', color: 'text-purple-300' },
  scientist: { label: '首席科学家', color: 'text-rose-300' },
  admin: { label: '系统管理员', color: 'text-slate-300' },
};

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
