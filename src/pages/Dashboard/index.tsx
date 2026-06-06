import { useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Target,
  TrendingUp,
  Layers,
  Zap,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { StatCard } from '@/components/ui/StatCard';
import { AlertLevelBadge, TaskStatusBadge } from '@/components/ui/StatusBadges';
import { formatRelative, formatPercent, cn, taskStatusMap } from '@/utils/format';

const statusColors = {
  pending: '#94a3b8',
  preprocessing: '#36a9ff',
  meshing: '#a78bfa',
  calculating: '#22d3ee',
  routing: '#fbbf24',
  completed: '#34d399',
  error: '#dc2626',
};

export function Dashboard() {
  const tasks = useAppStore((s) => s.tasks);
  const alerts = useAppStore((s) => s.alerts);
  const dailyStats = useAppStore((s) => s.dailyStats);
  const radarStats = useAppStore((s) => s.radarStats);

  const todayStats = dailyStats[dailyStats.length - 1];

  const { completedTasks, runningTasks, errorTasks, highDeviation, taskStatusData, latestCompleted, unreviewedAlerts, pendingApprovalsCount } =
    useMemo(() => {
      const completed = tasks.filter((t) => t.status === 'completed').length;
      const running = tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'error' && t.status !== 'pending'
      ).length;
      const errors = tasks.filter((t) => t.status === 'error').length;
      const highDev = tasks.filter((t) => (t.deviationRate ?? 0) > 0.2).length;
      const statusData = Object.keys(taskStatusMap).map((k) => ({
        name: taskStatusMap[k as keyof typeof taskStatusMap].label,
        value: tasks.filter((t) => t.status === k).length,
      }));
      const latest = [...tasks]
        .filter((t) => t.status === 'completed')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      const unreviewed = [...alerts]
        .filter((a) => !a.reviewed)
        .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
      const pendingCount = tasks.filter(
        (t) =>
          t.approval &&
          (t.approval.status === 'engineer_pending' || t.approval.status === 'chief_pending')
      ).length;
      return {
        completedTasks: completed,
        runningTasks: running,
        errorTasks: errors,
        highDeviation: highDev,
        taskStatusData: statusData,
        latestCompleted: latest,
        unreviewedAlerts: unreviewed,
        pendingApprovalsCount: pendingCount,
      };
    }, [tasks, alerts]);

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">全天候运行看板</h1>
          <p className="text-sm text-slate-400 mt-1">
            实时监控模拟任务运行状态、预警信息与系统性能指标
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          数据实时更新中
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 animate-stagger-1">
        <StatCard
          title="今日模拟完成率"
          value={formatPercent(todayStats?.completionRate ?? 0, 1).replace('%', '')}
          suffix="%"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
          trend={3.2}
          trendLabel="较昨日"
        />
        <StatCard
          title="平均预警提前量"
          value={todayStats?.avgLeadTime.toFixed(1) ?? '0'}
          suffix="小时"
          icon={<Clock className="w-5 h-5" />}
          color="blue"
          trend={0.8}
          trendLabel="较昨日"
        />
        <StatCard
          title="预报准确度"
          value={formatPercent(todayStats?.forecastAccuracy ?? 0, 1).replace('%', '')}
          suffix="%"
          icon={<Target className="w-5 h-5" />}
          color="purple"
          trend={1.5}
          trendLabel="较昨日"
        />
        <StatCard
          title="活动任务/异常"
          value={`${runningTasks} / ${errorTasks}`}
          icon={<Zap className="w-5 h-5" />}
          color={errorTasks > 0 ? 'red' : 'yellow'}
          trendLabel={`${completedTasks} 已完成`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 animate-stagger-2">
        <div className="card p-5 col-span-1">
          <h3 className="section-title">
            <Layers className="w-4 h-4 text-hydra-400" />
            系统性能雷达
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarStats}>
                <PolarGrid stroke="#1E3050" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 9 }}
                  axisLine={false}
                />
                <Radar
                  name="性能"
                  dataKey="value"
                  stroke="#0c8af0"
                  fill="#0c8af0"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#162338',
                    border: '1px solid #1E3050',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 col-span-1">
          <h3 className="section-title">
            <Activity className="w-4 h-4 text-hydra-400" />
            任务状态分布
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {taskStatusData
                    .filter((d) => d.value > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          statusColors[
                            Object.keys(taskStatusMap)[
                              Object.values(taskStatusMap).findIndex(
                                (v) => v.label === entry.name
                              )
                            ] as keyof typeof statusColors
                          ]
                        }
                        fillOpacity={0.85}
                        stroke="none"
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#162338',
                    border: '1px solid #1E3050',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 col-span-1">
          <h3 className="section-title">
            <AlertCircle className="w-4 h-4 text-alert-red" />
            近7日预警统计
            {highDeviation > 0 && (
              <span className="ml-auto badge bg-alert-red/20 text-alert-red border border-alert-red/30 animate-pulse">
                {highDeviation} 个高偏差任务
              </span>
            )}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
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
                  formatter={(v: number) => [v, '预警次数']}
                />
                <Bar
                  dataKey="alertsCount"
                  fill="url(#alertGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 animate-stagger-3">
        <div className="card p-5 col-span-1">
          <h3 className="section-title">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            预报准确度趋势
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="accGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0.7, 1]}
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
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, '准确度']}
                />
                <Area
                  type="monotone"
                  dataKey="forecastAccuracy"
                  stroke="#34d399"
                  strokeWidth={2}
                  fill="url(#accGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <AlertTriangle className="w-4 h-4 text-alert-yellow" />
              实时预警动态
              {unreviewedAlerts.length > 0 && (
                <span className="badge bg-alert-red/20 text-alert-red ml-2 animate-pulse">
                  {unreviewedAlerts.length} 待复核
                </span>
              )}
            </h3>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {unreviewedAlerts.length > 0 ? (
              unreviewedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-surface-elevated/50 border border-surface-border hover:border-hydra-500/30 transition-all"
                >
                  <AlertLevelBadge level={alert.level} showText pulse />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="font-medium">{alert.sectionName}</span>
                      <span className="text-slate-400 mx-1">·</span>
                      {alert.type === 'water_level' ? '水位超限' : '上涨速率异常'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      当前 {alert.type === 'water_level' ? `${alert.value}m` : `${alert.value}m/h`}
                      ，阈值 {alert.threshold}m
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatRelative(alert.triggeredAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                <Check className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                暂无待处理预警
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 animate-stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">
            <CheckCircle2 className="w-4 h-4 text-hydra-400" />
            最近完成的模拟任务
          </h3>
          {pendingApprovalsCount > 0 && (
            <span className="badge bg-amber-500/20 text-amber-300">
              {pendingApprovalsCount} 项待审批
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="table-head">任务名称</th>
                <th className="table-head">流域</th>
                <th className="table-head">重现期</th>
                <th className="table-head">状态</th>
                <th className="table-head">洪峰流量</th>
                <th className="table-head">完成时间</th>
                <th className="table-head">偏差率</th>
              </tr>
            </thead>
            <tbody>
              {latestCompleted.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-surface-border/50 hover:bg-surface-elevated/30 transition-all"
                >
                  <td className="table-cell font-medium text-white">{task.name}</td>
                  <td className="table-cell">{task.basinName}</td>
                  <td className="table-cell font-mono">{task.rainfallReturnPeriod}年一遇</td>
                  <td className="table-cell">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="table-cell font-mono text-hydra-300">
                    {task.result?.peakDischarge.toFixed(0)} m³/s
                  </td>
                  <td className="table-cell text-slate-400 text-xs">
                    {task.result ? formatRelative(task.result.completedAt) : '-'}
                  </td>
                  <td className="table-cell">
                    <span
                      className={cn(
                        'font-mono text-sm',
                        (task.deviationRate ?? 0) > 0.2
                          ? 'text-alert-red'
                          : (task.deviationRate ?? 0) > 0.1
                          ? 'text-alert-yellow'
                          : 'text-emerald-400'
                      )}
                    >
                      {(task.deviationRate ?? 0) > 0 ? `±${((task.deviationRate ?? 0) * 100).toFixed(1)}%` : '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
