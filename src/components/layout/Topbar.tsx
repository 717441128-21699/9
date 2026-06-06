import { Bell, Search, Clock, RefreshCw, AlertOctagon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/format';
import { useAppStore } from '@/store/useAppStore';

interface TopbarProps {
  error?: string | null;
}

export function Topbar({ error }: TopbarProps) {
  const [now, setNow] = useState(new Date());
  const hydrate = useAppStore((s) => s.hydrate);
  const pendingAlertCount = useAppStore((s) => {
    let count = 0;
    for (let i = 0; i < s.alerts.length; i++) {
      if (!s.alerts[i].reviewed) count++;
    }
    return count;
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await hydrate();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <header className="h-14 bg-surface border-b border-surface-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索任务、流域、断面..."
            className="pl-9 pr-4 py-1.5 w-72 bg-surface-elevated border border-surface-border rounded-md text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-hydra-500 focus:border-hydra-500/50 transition-all"
          />
        </div>
        {error && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-alert-red/10 border border-alert-red/30 text-alert-red text-xs">
            <AlertOctagon className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4 text-hydra-400" />
          <span className="font-mono text-slate-300">{formatDate(now)}</span>
        </div>

        <button className="relative p-2 rounded-md text-slate-400 hover:text-white hover:bg-surface-elevated transition-all">
          <Bell className="w-5 h-5" />
          {pendingAlertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-alert-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {pendingAlertCount}
            </span>
          )}
        </button>

        <button
          onClick={onRefresh}
          className="p-2 rounded-md text-slate-400 hover:text-hydra-300 hover:bg-surface-elevated transition-all group"
        >
          <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
        </button>
      </div>
    </header>
  );
}
