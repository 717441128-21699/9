import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Upload,
  Activity,
  FileCheck2,
  BarChart3,
  Sparkles,
  Droplets,
} from 'lucide-react';
import { cn } from '@/utils/format';
import { useAppStore } from '@/store/useAppStore';

const navItems = [
  { to: '/dashboard', label: '全天候看板', icon: LayoutDashboard },
  { to: '/tasks', label: '模拟任务中心', icon: ListTodo },
  { to: '/upload', label: '数据上传建模', icon: Upload },
  { to: '/monitoring', label: '实时监控预警', icon: Activity },
  { to: '/approval', label: '调度与审批', icon: FileCheck2 },
  { to: '/analysis', label: '结果分析可视化', icon: BarChart3 },
  { to: '/recommend', label: '智能推荐引擎', icon: Sparkles },
];

export function Sidebar() {
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const tasksPaused = useAppStore((s) => s.tasksPaused);
  const togglePaused = useAppStore((s) => s.toggleTasksPaused);
  const pendingAlertsCount = useAppStore((s) => {
    let count = 0;
    for (let i = 0; i < s.alerts.length; i++) {
      if (!s.alerts[i].reviewed) count++;
    }
    return count;
  });

  return (
    <aside className="w-64 h-screen bg-surface border-r border-surface-border flex flex-col shrink-0">
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-hydra-500 to-hydra-700 flex items-center justify-center shadow-glow-sm">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-base leading-tight">
              HydraSim Pro
            </h1>
            <p className="text-xs text-slate-500">流域径流模拟预警平台</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          const showBadge = item.to === '/monitoring' && pendingAlertsCount > 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn('nav-item', isActive && 'nav-item-active')}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-alert-red text-white animate-pulse">
                  {pendingAlertsCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-border space-y-3">
        <button
          onClick={togglePaused}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all',
            tasksPaused
              ? 'bg-alert-red/20 text-alert-red border border-alert-red/30'
              : 'bg-surface-elevated text-slate-400 border border-surface-border hover:text-slate-200'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full',
              tasksPaused ? 'bg-alert-red animate-pulse' : 'bg-emerald-400'
            )}
          />
          {tasksPaused ? '任务已暂停（点击恢复）' : '系统运行正常'}
        </button>

        <div className="flex items-center gap-3 p-2 rounded-md bg-surface-elevated/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-hydra-400 to-hydra-600 flex items-center justify-center text-white text-xs font-semibold">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {currentUser.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
