import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAppStore } from '@/store/useAppStore';

export function AppLayout() {
  const hydrate = useAppStore((s) => s.hydrate);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-hydra-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-hydra-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-hydra-300 text-sm">正在从水文服务中心加载数据...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-hydra-950 overflow-hidden bg-grid">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar error={error} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function IndexRedirect() {
  return <Navigate to="/dashboard" replace />;
}
