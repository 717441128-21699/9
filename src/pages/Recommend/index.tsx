import { useState } from 'react';
import {
  Sparkles,
  Brain,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ThumbsUp,
  Zap,
  Play,
  Pause,
  ChevronRight,
  History,
  Target,
  Gauge,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { AlertLevelBadge } from '@/components/ui/StatusBadges';
import { cn, formatPercent, formatRelative, formatNumber } from '@/utils/format';

export function Recommend() {
  const dispatchRules = useAppStore((s) => s.dispatchRules);
  const tasks = useAppStore((s) => s.tasks);
  const tasksPaused = useAppStore((s) => s.tasksPaused);
  const togglePaused = useAppStore((s) => s.toggleTasksPaused);

  const highDeviationTasks = tasks.filter((t) => (t.deviationRate ?? 0) > 0.2);
  const hasCriticalAlert = highDeviationTasks.length >= 3;

  const [selectedRule, setSelectedRule] = useState(dispatchRules[0] ?? null);

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">智能推荐引擎</h1>
          <p className="text-sm text-slate-400 mt-1">
            基于历史模拟的调度规则优化、偏差监控与智能推荐
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple">
            <Brain className="w-3 h-3" />
            AI 模型运行中
          </Badge>
        </div>
      </div>

      {hasCriticalAlert && (
        <div className="card p-5 border-alert-red/50 bg-alert-red/5 animate-pulse-fast">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-alert-red/20 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-6 h-6 text-alert-red" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-alert-red">
                  偏差异常告警
                </h3>
                <Badge variant="red">高优先级</Badge>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                检测到连续 3 个以上模拟任务洪峰偏差超过 20%，已自动暂停新任务提交。请首席科学家介入分析原因并调整模型参数。
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={togglePaused}
                  className="btn-danger"
                >
                  {tasksPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {tasksPaused ? '恢复任务' : '确认暂停'}
                </button>
                <button className="btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                  参数重新校准
                </button>
                <span className="text-xs text-slate-400 ml-2">
                  已通知首席科学家
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatBox
          label="调度规则总数"
          value={dispatchRules.length}
          icon={<Zap className="w-5 h-5" />}
          color="blue"
        />
        <StatBox
          label="高置信度规则"
          value={dispatchRules.filter((r) => r.confidence > 0.85).length}
          icon={<Target className="w-5 h-5" />}
          color="green"
        />
        <StatBox
          label="高偏差任务"
          value={highDeviationTasks.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={highDeviationTasks.length > 2 ? 'red' : 'yellow'}
        />
        <StatBox
          label="本月调用次数"
          value={dispatchRules.reduce((s, r) => s + r.usageCount, 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
              推荐调度规则
            </h3>
            <Badge variant="purple">
              <Brain className="w-3 h-3" />
              基于 1,247 次历史模拟
            </Badge>
          </div>

          <div className="space-y-3">
            {dispatchRules.map((rule, idx) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={cn(
                  'p-4 rounded-lg cursor-pointer transition-all border',
                  selectedRule?.id === rule.id
                    ? 'bg-hydra-500/10 border-hydra-500/50'
                    : 'bg-surface-elevated/30 border-transparent hover:bg-surface-elevated/60 hover:border-surface-border'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold',
                        idx === 0
                          ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
                          : 'bg-surface-muted text-slate-400'
                      )}
                    >
                      {idx + 1}
                    </div>
                    {idx < dispatchRules.length - 1 && (
                      <div className="w-px h-8 bg-surface-muted mt-2" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{rule.name}</span>
                      {rule.confidence > 0.9 && (
                        <Badge variant="green">推荐</Badge>
                      )}
                      {rule.confidence > 0.8 && rule.confidence <= 0.9 && (
                        <Badge variant="blue">高置信</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{rule.basinName}</p>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="p-2 rounded bg-surface/60">
                        <p className="text-[10px] text-slate-500">触发条件</p>
                        <p className="text-xs text-slate-200 mt-0.5">
                          {rule.triggerCondition}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-surface/60">
                        <p className="text-[10px] text-slate-500">调度动作</p>
                        <p className="text-xs text-alert-yellow mt-0.5">
                          {rule.action}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500">置信度</span>
                          <span className="font-mono text-purple-300">
                            {formatPercent(rule.confidence, 0)}
                          </span>
                        </div>
                        <Progress
                          value={rule.confidence * 100}
                          size="sm"
                          barClassName={
                            rule.confidence > 0.9
                              ? 'bg-emerald-500'
                              : rule.confidence > 0.8
                              ? 'bg-purple-500'
                              : 'bg-alert-yellow'
                          }
                        />
                      </div>
                      <span className="text-slate-500 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        调用 {rule.usageCount} 次
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-500 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="section-title">
              <Brain className="w-4 h-4 text-purple-400" />
              规则详情
            </h3>
            {selectedRule ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">规则名称</p>
                  <p className="text-base font-semibold text-white mt-0.5">
                    {selectedRule.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">适用流域</p>
                  <p className="text-sm text-slate-200 mt-0.5">
                    {selectedRule.basinName}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-hydra-500/10 border border-hydra-500/20">
                  <p className="text-xs text-slate-400 mb-1">触发条件</p>
                  <p className="text-sm text-hydra-200">
                    {selectedRule.triggerCondition}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-alert-yellow/10 border border-alert-yellow/20">
                  <p className="text-xs text-slate-400 mb-1">推荐调度动作</p>
                  <p className="text-sm text-alert-yellow">
                    {selectedRule.action}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-slate-500">AI 置信度</p>
                    <p className="text-sm font-mono text-purple-300">
                      {formatPercent(selectedRule.confidence, 1)}
                    </p>
                  </div>
                  <Progress
                    value={selectedRule.confidence * 100}
                    barClassName="bg-gradient-to-r from-purple-500 to-purple-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-surface-border">
                  <div>
                    <p className="text-[10px] text-slate-500">历史调用</p>
                    <p className="font-mono text-sm text-white mt-0.5">
                      {selectedRule.usageCount} 次
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">最近使用</p>
                    <p className="text-sm text-white mt-0.5">
                      {formatRelative(selectedRule.lastUsedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="btn-primary flex-1">
                    <ThumbsUp className="w-4 h-4" />
                    采纳此规则
                  </button>
                  <button className="btn-secondary">
                    优化
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
                请选择调度规则
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title">
              <Gauge className="w-4 h-4 text-alert-orange" />
              偏差分析
            </h3>
            <div className="space-y-3">
              {tasks
                .filter((t) => t.deviationRate !== undefined)
                .sort(
                  (a, b) => (b.deviationRate ?? 0) - (a.deviationRate ?? 0)
                )
                .slice(0, 5)
                .map((task) => {
                  const dev = task.deviationRate ?? 0;
                  const isHigh = dev > 0.2;
                  return (
                    <div
                      key={task.id}
                      className="p-2.5 rounded bg-surface-elevated/40"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white truncate flex-1">
                          {task.name.slice(0, 20)}
                        </span>
                        <span
                          className={cn(
                            'font-mono text-xs',
                            dev > 0.2
                              ? 'text-alert-red'
                              : dev > 0.1
                              ? 'text-alert-yellow'
                              : 'text-emerald-400'
                          )}
                        >
                          ±{formatPercent(dev, 1)}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(dev * 100 * 3, 100)}
                        size="sm"
                        barClassName={
                          dev > 0.2
                            ? 'bg-alert-red'
                            : dev > 0.1
                            ? 'bg-alert-yellow'
                            : 'bg-emerald-500'
                        }
                      />
                      {isHigh && (
                        <p className="text-[10px] text-alert-red mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          偏差超限
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title">
          <Clock className="w-4 h-4 text-hydra-400" />
          历史模拟学习统计
        </h3>
        <div className="grid grid-cols-6 gap-4">
          {[
            { label: '总模拟次数', value: '1,247', unit: '次' },
            { label: '成功完成', value: '1,189', unit: '次' },
            { label: '平均精度', value: '87.3', unit: '%' },
            { label: '预警命中率', value: '94.6', unit: '%' },
            { label: '平均提前量', value: '6.4', unit: '小时' },
            { label: '规则优化次数', value: '328', unit: '次' },
          ].map((s, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-surface-elevated/30 border border-surface-border text-center"
            >
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-2">
                <span className="font-mono text-2xl font-semibold text-white">
                  {s.value}
                </span>
                <span className="text-xs text-slate-500 ml-1">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) {
  const colorMap = {
    blue: 'from-hydra-500/20 to-transparent border-hydra-500/30 text-hydra-300',
    green: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-300',
    yellow: 'from-alert-yellow/20 to-transparent border-alert-yellow/30 text-alert-yellow',
    red: 'from-alert-red/20 to-transparent border-alert-red/30 text-alert-red',
    purple: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-300',
  };
  const iconBgMap = {
    blue: 'bg-hydra-500/20 text-hydra-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-alert-yellow/20 text-alert-yellow',
    red: 'bg-alert-red/20 text-alert-red',
    purple: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <div
      className={cn(
        'card p-4 relative overflow-hidden bg-gradient-to-br border',
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="font-mono text-2xl font-semibold text-white mt-1">
            {value}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBgMap[color])}>{icon}</div>
      </div>
    </div>
  );
}
