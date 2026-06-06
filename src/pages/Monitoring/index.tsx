import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
  Send,
  Waves,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { AlertLevelBadge } from '@/components/ui/StatusBadges';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate, formatRelative, formatNumber } from '@/utils/format';
import type { Alert, RiverSection, SimulationTask } from '@/types';

export function Monitoring() {
  const tasks = useAppStore((s) => s.tasks);
  const alerts = useAppStore((s) => s.alerts);
  const reviewAlert = useAppStore((s) => s.reviewAlert);
  const currentUser = useAppStore((s) => s.currentUser);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [reviewComment, setReviewComment] = useState('');

  const activeTasks = tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'error'
  );
  const allSections = activeTasks.flatMap((t) =>
    t.sections.map((s) => ({ ...s, taskId: t.id, taskName: t.name }))
  );
  const unreviewedAlerts = alerts.filter((a) => !a.reviewed);
  const reviewedAlerts = alerts.filter((a) => a.reviewed);

  const handleReview = () => {
    if (selectedAlert && reviewComment) {
      reviewAlert(selectedAlert.id, currentUser.name, reviewComment);
      setSelectedAlert(null);
      setReviewComment('');
    }
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">实时监控预警</h1>
          <p className="text-sm text-slate-400 mt-1">
            监控 {activeTasks.length} 个模拟任务，共 {allSections.length} 个河道断面
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="red" dot pulse>
            {unreviewedAlerts.length} 待复核
          </Badge>
          <Badge variant="green">
            {reviewedAlerts.length} 已处理
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <SectionStatCard label="监控断面" value={allSections.length} icon={<Waves className="w-5 h-5" />} color="blue" />
        <SectionStatCard
          label="超警戒断面"
          value={allSections.filter((s) => s.currentWaterLevel > s.warningLevel).length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="yellow"
        />
        <SectionStatCard
          label="超保证断面"
          value={allSections.filter((s) => s.currentWaterLevel > s.guaranteedLevel).length}
          icon={<Activity className="w-5 h-5" />}
          color="red"
        />
        <SectionStatCard
          label="快速上涨"
          value={allSections.filter((s) => s.risingRate > 0.5).length}
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          {activeTasks.map((task) => (
            <TaskMonitoringCard key={task.id} task={task} />
          ))}
          {activeTasks.length === 0 && (
            <div className="card p-10 text-center text-slate-500">
              <Waves className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">暂无进行中的模拟任务</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">
                <AlertTriangle className="w-4 h-4 text-alert-red" />
                待复核预警
              </h3>
              <span className="text-xs text-slate-400">
                {unreviewedAlerts.length} 条
              </span>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {unreviewedAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  selected={selectedAlert?.id === alert.id}
                  onClick={() => setSelectedAlert(alert)}
                />
              ))}
              {unreviewedAlerts.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  全部预警已复核
                </div>
              )}
            </div>
          </div>

          {selectedAlert && (
            <div className="card p-5 border-alert-yellow/30 animate-slide-up">
              <h3 className="section-title">
                <MessageSquare className="w-4 h-4 text-alert-yellow" />
                预警复核
              </h3>
              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-slate-400">预警级别</p>
                  <div className="mt-1">
                    <AlertLevelBadge level={selectedAlert.level} showText />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">断面/类型</p>
                  <p className="text-sm text-white mt-0.5">
                    {selectedAlert.sectionName} ·{' '}
                    {selectedAlert.type === 'water_level' ? '水位超限' : '上涨速率异常'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">当前值/阈值</p>
                  <p className="text-sm font-mono text-white mt-0.5">
                    {selectedAlert.value}{' '}
                    {selectedAlert.type === 'water_level' ? 'm' : 'm/h'} /{' '}
                    {selectedAlert.threshold}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">触发时间</p>
                  <p className="text-sm text-white mt-0.5">
                    {formatDate(selectedAlert.triggeredAt)}
                  </p>
                </div>
              </div>
              <div>
                <label className="label">复核意见</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="input-base resize-none"
                  placeholder="请输入复核意见..."
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleReview}
                  disabled={!reviewComment}
                  className="btn-primary flex-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  确认复核
                </button>
                <button
                  onClick={() => {
                    setSelectedAlert(null);
                    setReviewComment('');
                  }}
                  className="btn-secondary"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="section-title">
              <Clock className="w-4 h-4 text-slate-400" />
              已处理预警
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {reviewedAlerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-2.5 rounded-md bg-surface-elevated/30"
                >
                  <AlertLevelBadge level={alert.level} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{alert.sectionName}</p>
                    <p className="text-[10px] text-slate-500">
                      {alert.reviewedBy} · {formatRelative(alert.triggeredAt)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionStatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'red' | 'orange' | 'green' | 'purple';
}) {
  const colorMap = {
    blue: 'from-hydra-500/20 to-transparent border-hydra-500/30 text-hydra-300',
    green: 'from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-300',
    yellow: 'from-alert-yellow/20 to-transparent border-alert-yellow/30 text-alert-yellow',
    red: 'from-alert-red/20 to-transparent border-alert-red/30 text-alert-red',
    orange: 'from-alert-orange/20 to-transparent border-alert-orange/30 text-alert-orange',
    purple: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-300',
  };
  const iconBgMap = {
    blue: 'bg-hydra-500/20 text-hydra-400',
    green: 'bg-emerald-500/20 text-emerald-400',
    yellow: 'bg-alert-yellow/20 text-alert-yellow',
    red: 'bg-alert-red/20 text-alert-red',
    orange: 'bg-alert-orange/20 text-alert-orange',
    purple: 'bg-purple-500/20 text-purple-400',
  };
  return (
    <div
      className={cn(
        'card p-4 relative overflow-hidden bg-gradient-to-br border',
        colorMap[color]
      )}
    >
      <div className="flex items-center justify-between">
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

function TaskMonitoringCard({ task }: { task: SimulationTask }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{task.name}</h3>
            <Badge variant="blue">K{task.rainfallReturnPeriod}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            {task.basinName} · {formatNumber(task.basinArea, 0)} km²
          </p>
        </div>
        <div className="text-right">
          <Progress value={task.progress} showLabel size="sm" />
        </div>
      </div>

      <div className="space-y-4">
        {task.sections.map((section) => (
          <SectionMonitor key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

function SectionMonitor({ section }: { section: RiverSection }) {
  const isOverWarning = section.currentWaterLevel > section.warningLevel;
  const isOverGuaranteed = section.currentWaterLevel > section.guaranteedLevel;
  const isRisingFast = section.risingRate > 0.5;

  const chartData = section.historicalLevels.map((p) => ({
    time: formatDate(p.time, 'HH:mm'),
    水位: p.value,
  }));

  return (
    <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Waves
              className={cn(
                'w-4 h-4',
                isOverGuaranteed
                  ? 'text-alert-red animate-pulse'
                  : isOverWarning
                  ? 'text-alert-yellow'
                  : 'text-hydra-400'
              )}
            />
            <span className="font-medium text-white">{section.name}</span>
            <span className="text-xs text-slate-500">K{section.riverKm}</span>
          </div>
          {isOverGuaranteed && <Badge variant="red" dot pulse>超保证</Badge>}
          {isOverWarning && !isOverGuaranteed && <Badge variant="yellow" dot>超警戒</Badge>}
          {isRisingFast && <Badge variant="orange">涨速异常</Badge>}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-500">水位 </span>
            <span
              className={cn(
                'font-mono font-medium',
                isOverGuaranteed
                  ? 'text-alert-red'
                  : isOverWarning
                  ? 'text-alert-yellow'
                  : 'text-white'
              )}
            >
              {section.currentWaterLevel.toFixed(2)}m
            </span>
          </div>
          <div>
            <span className="text-slate-500">流量 </span>
            <span className="font-mono text-white">
              {section.currentDischarge.toFixed(0)}m³/s
            </span>
          </div>
          <div>
            <span className="text-slate-500">涨速 </span>
            <span
              className={cn(
                'font-mono',
                isRisingFast ? 'text-alert-orange' : 'text-emerald-400'
              )}
            >
              {section.risingRate > 0 ? '+' : ''}
              {section.risingRate.toFixed(2)}m/h
            </span>
          </div>
        </div>
      </div>

      <div className="h-28">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${section.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isOverGuaranteed ? '#dc2626' : isOverWarning ? '#f59e0b' : '#0c8af0'}
                  stopOpacity={0.4}
                />
                <stop offset="100%" stopColor="#0c8af0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E3050" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#64748b', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#162338',
                border: '1px solid #1E3050',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              formatter={(v: number) => [`${v.toFixed(2)}m`, '水位']}
            />
            <ReferenceLine
              y={section.warningLevel}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: '警戒', fill: '#f59e0b', fontSize: 9, position: 'right' }}
            />
            <ReferenceLine
              y={section.guaranteedLevel}
              stroke="#dc2626"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: '保证', fill: '#dc2626', fontSize: 9, position: 'right' }}
            />
            <Area
              type="monotone"
              dataKey="水位"
              stroke={isOverGuaranteed ? '#dc2626' : isOverWarning ? '#f59e0b' : '#0c8af0'}
              strokeWidth={2}
              fill={`url(#grad-${section.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  selected,
  onClick,
}: {
  alert: Alert;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-md cursor-pointer transition-all border',
        selected
          ? 'bg-hydra-500/10 border-hydra-500/50'
          : 'bg-surface-elevated/30 border-transparent hover:bg-surface-elevated/60 hover:border-surface-border'
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <AlertLevelBadge level={alert.level} showText pulse />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <Eye className="w-3 h-3 text-slate-500" />
        <span className="text-white font-medium truncate">{alert.sectionName}</span>
      </div>
      <p className="text-[11px] text-slate-500 mt-1">
        {alert.type === 'water_level' ? '水位超限' : '上涨速率异常'}
      </p>
      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
        <Send className="w-2.5 h-2.5" />
        {formatRelative(alert.triggeredAt)}
      </p>
    </div>
  );
}
