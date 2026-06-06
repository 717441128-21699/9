import { useState } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Play,
  RotateCcw,
  Eye,
  MapPin,
  CloudRain,
  Clock,
  FileText,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { TaskStatusBadge, AlertLevelBadge, ApprovalStatusBadge } from '@/components/ui/StatusBadges';
import { Progress } from '@/components/ui/Progress';
import { TaskStepper } from '@/components/ui/TaskStepper';
import { Badge } from '@/components/ui/Badge';
import {
  formatDate,
  formatNumber,
  cn,
  taskStatusMap,
  formatRelative,
} from '@/utils/format';
import type { TaskStatus, SimulationTask } from '@/types';

const statusFilters: Array<{ key: TaskStatus | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待校验' },
  { key: 'preprocessing', label: '预处理' },
  { key: 'meshing', label: '网格生成' },
  { key: 'calculating', label: '径流计算' },
  { key: 'routing', label: '洪水演进' },
  { key: 'completed', label: '已完成' },
  { key: 'error', label: '异常' },
];

export function TaskCenter() {
  const tasks = useAppStore((s) => s.tasks);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTasks = tasks.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.basinName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statsByStatus = statusFilters.slice(1).map((f) => ({
    ...f,
    count: tasks.filter((t) => t.status === f.key).length,
  }));

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">模拟任务中心</h1>
          <p className="text-sm text-slate-400 mt-1">
            共 {tasks.length} 个任务，{tasks.filter((t) => t.status === 'completed').length} 个已完成
          </p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {statsByStatus.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={cn(
              'card p-4 text-left transition-all hover:border-hydra-500/50',
              statusFilter === s.key &&
                'border-hydra-500 shadow-glow-sm bg-hydra-500/5'
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  taskStatusMap[s.key as TaskStatus].dot
                )}
              />
              <span className="text-xs text-slate-400">{s.label}</span>
            </div>
            <span className="font-mono text-2xl font-semibold text-white">
              {s.count}
            </span>
          </button>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索任务名称、流域..."
              className="input-base pl-9"
            />
          </div>
          <button
            onClick={() => setStatusFilter('all')}
            className="btn-secondary"
          >
            <Filter className="w-4 h-4" />
            重置筛选
          </button>
        </div>

        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              expanded={expandedId === task.id}
              onToggle={() =>
                setExpandedId(expandedId === task.id ? null : task.id)
              }
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无匹配的任务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  expanded,
  onToggle,
}: {
  task: SimulationTask;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'border border-surface-border rounded-lg overflow-hidden transition-all',
        expanded && 'border-hydra-500/50 shadow-glow-sm'
      )}
    >
      <div
        className="flex items-center gap-4 p-4 bg-surface-elevated/30 hover:bg-surface-elevated/60 cursor-pointer transition-all"
        onClick={onToggle}
      >
        <button
          className="p-1 rounded hover:bg-surface-muted text-slate-400"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-medium text-white">{task.name}</span>
            <TaskStatusBadge status={task.status} pulse />
            {task.alerts.length > 0 && (
              <Badge variant="red" dot>
                {task.alerts.length} 预警
              </Badge>
            )}
            {task.approval && <ApprovalStatusBadge status={task.approval.status} />}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {task.basinName}
            </span>
            <span className="flex items-center gap-1">
              <CloudRain className="w-3 h-3" />
              {task.rainfallReturnPeriod}年一遇
            </span>
            <span>{formatNumber(task.basinArea, 0)} km²</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelative(task.createdAt)}
            </span>
          </div>
        </div>

        <div className="w-48">
          <Progress value={task.progress} showLabel size="sm" />
        </div>

        <div className="flex items-center gap-1">
          {task.status === 'error' && (
            <button className="btn-ghost !px-2 !py-1.5" title="重新计算">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {task.status === 'pending' && (
            <button className="btn-primary !px-2 !py-1.5" title="启动">
              <Play className="w-4 h-4" />
            </button>
          )}
          <button className="btn-ghost !px-2 !py-1.5" title="查看详情">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 border-t border-surface-border bg-surface/50 animate-fade-in">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-hydra-500 rounded" />
                状态流转
              </h4>
              <TaskStepper status={task.status} size="sm" />
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-hydra-500 rounded" />
                模型参数
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <ParamItem label="DEM分辨率" value={`${task.parameters.demResolution}m`} />
                <ParamItem label="土壤类型" value={task.parameters.soilType} />
                <ParamItem label="CN值" value={task.parameters.cnValue.toString()} />
                <ParamItem label="初损" value={`${task.parameters.initialLoss}mm`} />
                <ParamItem label="退水系数" value={task.parameters.recessionCoefficient.toString()} />
                <ParamItem label="曼宁系数" value={task.parameters.manningN.toString()} />
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-hydra-500 rounded" />
                河道断面监控
              </h4>
              <div className="space-y-2">
                {task.sections.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2 rounded bg-surface-elevated/50 text-xs"
                  >
                    <div>
                      <span className="text-white font-medium">{s.name}</span>
                      <span className="text-slate-500 ml-2">K{s.riverKm}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-300">
                        {s.currentWaterLevel}m / {s.warningLevel}m
                      </span>
                      <span
                        className={cn(
                          'font-mono',
                          s.risingRate > 0.5
                            ? 'text-alert-red'
                            : s.risingRate > 0.2
                            ? 'text-alert-yellow'
                            : 'text-emerald-400'
                        )}
                      >
                        {s.risingRate > 0 ? '+' : ''}
                        {s.risingRate}m/h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-hydra-500 rounded" />
                计算日志
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                {task.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-slate-500 shrink-0 w-16">
                      {formatDate(log.timestamp, 'HH:mm:ss')}
                    </span>
                    <span
                      className={cn(
                        'shrink-0',
                        log.type === 'error' && 'text-alert-red',
                        log.type === 'success' && 'text-emerald-400',
                        log.type === 'warning' && 'text-alert-yellow',
                        log.type === 'info' && 'text-hydra-300'
                      )}
                    >
                      {log.type === 'error' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5 rotate-45" />
                      )}
                    </span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {task.alerts.length > 0 && (
            <>
              <div className="divider" />
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-alert-red rounded" />
                  预警记录
                </h4>
                <div className="space-y-2">
                  {task.alerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded bg-surface-elevated/50 border border-surface-border"
                    >
                      <div className="flex items-center gap-3">
                        <AlertLevelBadge level={a.level} showText />
                        <div>
                          <p className="text-sm text-white">{a.sectionName}</p>
                          <p className="text-xs text-slate-400">
                            {a.type === 'water_level' ? '水位超限' : '上涨速率异常'}
                            {' · '}
                            {formatRelative(a.triggeredAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">
                          当前 {a.value}{a.type === 'water_level' ? 'm' : 'm/h'} / 阈值 {a.threshold}m
                        </p>
                        <p className="text-xs mt-0.5">
                          {a.reviewed ? (
                            <span className="text-emerald-400">
                              已复核 · {a.reviewedBy}
                            </span>
                          ) : (
                            <span className="text-alert-yellow">待复核</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ParamItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="font-mono text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}
