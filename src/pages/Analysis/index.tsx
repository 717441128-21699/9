import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  Download,
  Filter,
  Waves,
  Map as MapIcon,
  TrendingUp,
  Calendar,
  MapPin,
  CloudRain,
  FileDown,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatusBadge, ApprovalStatusBadge } from '@/components/ui/StatusBadges';
import { cn, formatDate, formatNumber } from '@/utils/format';
import type { SimulationTask } from '@/types';

export function Analysis() {
  const tasks = useAppStore((s) => s.tasks);
  const completedTasks = tasks.filter((t) => t.status === 'completed' && t.result);
  const [selectedTask, setSelectedTask] = useState<SimulationTask | null>(
    completedTasks[0] ?? null
  );
  const [returnPeriod, setReturnPeriod] = useState<string>('all');
  const [areaMin, setAreaMin] = useState<string>('');
  const [areaMax, setAreaMax] = useState<string>('');
  const [search, setSearch] = useState('');

  const filteredTasks = useMemo(() => {
    return completedTasks.filter((t) => {
      const matchPeriod = returnPeriod === 'all' || t.rainfallReturnPeriod === Number(returnPeriod);
      const matchAreaMin = !areaMin || t.basinArea >= Number(areaMin);
      const matchAreaMax = !areaMax || t.basinArea <= Number(areaMax);
      const matchSearch = !search || t.name.includes(search) || t.basinName.includes(search);
      return matchPeriod && matchAreaMin && matchAreaMax && matchSearch;
    });
  }, [completedTasks, returnPeriod, areaMin, areaMax, search]);

  const exportData = useMemo(() => {
    return filteredTasks.map((t) => ({
      name: t.name,
      basin: t.basinName,
      area: t.basinArea,
      returnPeriod: t.rainfallReturnPeriod,
      runoffDepth: t.result?.totalRunoffDepth ?? 0,
      peakDischarge: t.result?.peakDischarge ?? 0,
      floodVolume: t.result?.floodVolume ?? 0,
    }));
  }, [filteredTasks]);

  const handleExport = () => {
    const headers = ['任务名称', '流域', '流域面积(km²)', '重现期(年)', '径流深(mm)', '洪峰流量(m³/s)', '洪水总量(万m³)'];
    const rows = exportData.map((d) => [
      d.name,
      d.basin,
      d.area,
      d.returnPeriod,
      d.runoffDepth.toFixed(1),
      d.peakDischarge.toFixed(1),
      d.floodVolume.toFixed(0),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `径流模拟结果_${formatDate(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">结果分析可视化</h1>
          <p className="text-sm text-slate-400 mt-1">
            流量过程线、淹没范围、洪峰概率分布及数据导出
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索任务..."
              className="input-base pl-9 w-56"
            />
          </div>
          <div className="flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">重现期</span>
            <select
              value={returnPeriod}
              onChange={(e) => setReturnPeriod(e.target.value)}
              className="input-base !w-32"
            >
              <option value="all">全部</option>
              <option value="5">5年</option>
              <option value="10">10年</option>
              <option value="20">20年</option>
              <option value="50">50年</option>
              <option value="100">100年</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">流域面积</span>
            <input
              type="number"
              placeholder="最小"
              value={areaMin}
              onChange={(e) => setAreaMin(e.target.value)}
              className="input-base !w-24 font-mono"
            />
            <span className="text-slate-500">~</span>
            <input
              type="number"
              placeholder="最大"
              value={areaMax}
              onChange={(e) => setAreaMax(e.target.value)}
              className="input-base !w-24 font-mono"
            />
            <span className="text-xs text-slate-500">km²</span>
          </div>
          <button
            onClick={handleExport}
            disabled={exportData.length === 0}
            className="btn-primary ml-auto disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            导出 CSV ({exportData.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {filteredTasks.slice(0, 4).map((task) => (
          <button
            key={task.id}
            onClick={() => setSelectedTask(task)}
            className={cn(
              'card p-4 text-left transition-all',
              selectedTask?.id === task.id &&
                'border-hydra-500 shadow-glow-sm bg-hydra-500/5'
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">
                {task.rainfallReturnPeriod}年一遇
              </span>
              {task.approval && <ApprovalStatusBadge status={task.approval.status} />}
            </div>
            <p className="text-sm font-medium text-white truncate">{task.name}</p>
            <p className="text-xs text-slate-500 mt-1 truncate">{task.basinName}</p>
            <div className="mt-3 pt-3 border-t border-surface-border grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">洪峰</p>
                <p className="font-mono text-hydra-300">
                  {task.result?.peakDischarge.toFixed(0)}
                  <span className="text-slate-500 text-[10px] ml-1">m³/s</span>
                </p>
              </div>
              <div>
                <p className="text-slate-500">径流深</p>
                <p className="font-mono text-emerald-300">
                  {task.result?.totalRunoffDepth.toFixed(1)}
                  <span className="text-slate-500 text-[10px] ml-1">mm</span>
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedTask && selectedTask.result && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title mb-0">
                  <Waves className="w-4 h-4 text-hydra-400" />
                  流量过程线
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {selectedTask.timeWindow}
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedTask.result.hydrograph}>
                    <defs>
                      <linearGradient id="hydroGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0c8af0" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#0c8af0" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(v) => formatDate(v, 'MM/dd HH:mm')}
                      axisLine={false}
                      tickLine={false}
                      interval={10}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: '流量(m³/s)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#162338',
                        border: '1px solid #1E3050',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      labelFormatter={(v) => formatDate(v, 'yyyy-MM-dd HH:mm')}
                      formatter={(v: number) => [`${v.toFixed(1)} m³/s`, '流量']}
                    />
                    <ReferenceLine
                      y={selectedTask.result.peakDischarge}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      label={{
                        value: `洪峰 ${selectedTask.result.peakDischarge.toFixed(0)} m³/s`,
                        fill: '#f59e0b',
                        fontSize: 11,
                        position: 'right',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#0c8af0"
                      strokeWidth={2}
                      fill="url(#hydroGradient)"
                      name="流量"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                洪峰概率分布
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedTask.result.peakProbability}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
                    <XAxis
                      dataKey="range"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: '洪峰流量区间(m³/s)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#162338',
                        border: '1px solid #1E3050',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, '概率']}
                    />
                    <Bar
                      dataKey="probability"
                      radius={[4, 4, 0, 0]}
                      fill="url(#probGradient)"
                    />
                    <defs>
                      <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="card p-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title mb-0">
                  <MapIcon className="w-4 h-4 text-alert-orange" />
                  淹没范围分布图
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <LegendItem color="#fef3c7" label="<0.5m" />
                  <LegendItem color="#fcd34d" label="0.5-1.5m" />
                  <LegendItem color="#f97316" label="1.5-3m" />
                  <LegendItem color="#dc2626" label=">3m" />
                </div>
              </div>
              <InundationMap data={selectedTask.result.inundationMap} />
              <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">淹没总面积</span>
                  <p className="font-mono text-lg text-alert-orange">
                    {selectedTask.result.inundationArea.toFixed(1)}
                    <span className="text-slate-500 text-xs ml-1">km²</span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">最大水深</span>
                  <p className="font-mono text-lg text-alert-red">
                    {Math.max(...selectedTask.result.inundationMap.map((c) => c.depth)).toFixed(2)}
                    <span className="text-slate-500 text-xs ml-1">m</span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">受影响格网</span>
                  <p className="font-mono text-lg text-alert-yellow">
                    {selectedTask.result.inundationMap.length}
                    <span className="text-slate-500 text-xs ml-1">个</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title">
                <BarChart3 className="w-4 h-4 text-hydra-400" />
                模拟结果详情
              </h3>
              <div className="space-y-4">
                <DetailRow label="任务名称" value={selectedTask.name} />
                <DetailRow label="所属流域" value={selectedTask.basinName} />
                <DetailRow label="流域面积" value={`${formatNumber(selectedTask.basinArea, 0)} km²`} />
                <DetailRow label="降雨重现期" value={`${selectedTask.rainfallReturnPeriod} 年一遇`} />
                <DetailRow
                  label="洪峰流量"
                  value={`${selectedTask.result.peakDischarge.toFixed(1)} m³/s`}
                  highlight
                />
                <DetailRow
                  label="洪峰出现时间"
                  value={formatDate(selectedTask.result.peakTime, 'MM-dd HH:mm')}
                />
                <DetailRow
                  label="径流深"
                  value={`${selectedTask.result.totalRunoffDepth.toFixed(1)} mm`}
                  highlight
                />
                <DetailRow
                  label="洪水总量"
                  value={`${selectedTask.result.floodVolume.toFixed(0)} 万m³`}
                />
                <DetailRow
                  label="完成时间"
                  value={formatDate(selectedTask.result.completedAt)}
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="section-title">
              <Download className="w-4 h-4 text-emerald-400" />
              数据导出列表
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-border">
                    <th className="table-head">任务名称</th>
                    <th className="table-head">流域</th>
                    <th className="table-head">面积(km²)</th>
                    <th className="table-head">重现期</th>
                    <th className="table-head">径流深(mm)</th>
                    <th className="table-head">洪峰(m³/s)</th>
                    <th className="table-head">洪水总量(万m³)</th>
                    <th className="table-head">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {exportData.slice(0, 8).map((d, i) => (
                    <tr
                      key={i}
                      className="border-b border-surface-border/50 hover:bg-surface-elevated/30 transition-all"
                    >
                      <td className="table-cell text-white">{d.name}</td>
                      <td className="table-cell">{d.basin}</td>
                      <td className="table-cell font-mono">{formatNumber(d.area, 0)}</td>
                      <td className="table-cell">{d.returnPeriod}年</td>
                      <td className="table-cell font-mono text-emerald-300">
                        {d.runoffDepth.toFixed(1)}
                      </td>
                      <td className="table-cell font-mono text-hydra-300">
                        {d.peakDischarge.toFixed(0)}
                      </td>
                      <td className="table-cell font-mono">{d.floodVolume.toFixed(0)}</td>
                      <td className="table-cell">
                        <TaskStatusBadge status="completed" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border/50 last:border-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={cn('text-sm font-medium', highlight ? 'text-hydra-300 font-mono' : 'text-white')}>
        {value}
      </span>
    </div>
  );
}

function InundationMap({ data }: { data: { x: number; y: number; depth: number }[] }) {
  const gridSize = 18;
  const cols = 30;
  const rows = 20;

  const getColor = (depth: number) => {
    if (depth < 0.5) return '#fef3c7';
    if (depth < 1.5) return '#fcd34d';
    if (depth < 3) return '#f97316';
    return '#dc2626';
  };

  const grid: (number | null)[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );
  data.forEach((cell) => {
    if (cell.y < rows && cell.x < cols) {
      grid[cell.y][cell.x] = cell.depth;
    }
  });

  return (
    <div
      className="rounded-lg overflow-hidden border border-surface-border bg-surface-elevated/50 p-2"
      style={{ backgroundColor: '#0a1320' }}
    >
      <div
        className="grid gap-[1px] mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${gridSize}px)`,
          width: 'fit-content',
        }}
      >
        {grid.flat().map((depth, i) => (
          <div
            key={i}
            className="rounded-sm transition-all"
            style={{
              width: gridSize,
              height: gridSize,
              backgroundColor: depth !== null ? getColor(depth) : '#0f1e30',
              opacity: depth !== null ? 0.9 : 0.4,
              boxShadow: depth !== null ? 'inset 0 0 4px rgba(0,0,0,0.2)' : 'none',
            }}
            title={depth !== null ? `水深: ${depth.toFixed(2)}m` : undefined}
          />
        ))}
      </div>
    </div>
  );
}
