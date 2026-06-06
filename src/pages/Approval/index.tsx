import { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Droplets,
  MapPin,
  Zap,
  ChevronRight,
  Send,
  FileWarning,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  TaskStatusBadge,
  ApprovalStatusBadge,
  AlertLevelBadge,
} from '@/components/ui/StatusBadges';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { cn, formatDate, formatPercent, formatNumber, formatRelative } from '@/utils/format';
import type { SimulationTask, DispatchPlan } from '@/types';

type TabType = 'tasks' | 'plans';

export function Approval() {
  const tasks = useAppStore((s) => s.tasks);
  const plans = useAppStore((s) => s.dispatchPlans);
  const approveByEngineer = useAppStore((s) => s.approveByEngineer);
  const approveByChief = useAppStore((s) => s.approveByChief);
  const rejectApproval = useAppStore((s) => s.rejectApproval);
  const currentUser = useAppStore((s) => s.currentUser);

  const [tab, setTab] = useState<TabType>('tasks');
  const [selectedTask, setSelectedTask] = useState<SimulationTask | null>(
    tasks.find((t) => t.approval && t.approval.status !== 'approved' && t.approval.status !== 'draft') ?? null
  );
  const [selectedPlan, setSelectedPlan] = useState<DispatchPlan | null>(null);
  const [comment, setComment] = useState('');
  const [score, setScore] = useState(0.85);

  const pendingTaskApprovals = tasks.filter(
    (t) => t.approval && (t.approval.status === 'engineer_pending' || t.approval.status === 'chief_pending')
  );
  const pendingPlanApprovals = plans.filter(
    (p) => p.status !== 'approved' && p.status !== 'draft'
  );

  const handleEngineerApprove = () => {
    if (selectedTask && comment) {
      approveByEngineer(selectedTask.id, comment, score);
      setComment('');
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask({ ...updated });
    }
  };

  const handleChiefApprove = () => {
    if (selectedTask && comment) {
      approveByChief(selectedTask.id, comment);
      setComment('');
    }
  };

  const handleReject = () => {
    if (selectedTask && comment) {
      rejectApproval(selectedTask.id, comment);
      setComment('');
    }
  };

  return (
    <div className="space-y-6 opacity-0 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">调度与审批</h1>
          <p className="text-sm text-slate-400 mt-1">
            模拟结果验证、调度方案审核与防洪预案入库管理
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} count={pendingTaskApprovals.length}>
          <FileCheck2 className="w-4 h-4" />
          模拟结果审批
        </TabButton>
        <TabButton active={tab === 'plans'} onClick={() => setTab('plans')} count={pendingPlanApprovals.length}>
          <Zap className="w-4 h-4" />
          调度方案审批
        </TabButton>
      </div>

      {tab === 'tasks' ? (
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 card p-4 h-[calc(100vh-260px)] overflow-y-auto">
            <h3 className="section-title">
              <Clock className="w-4 h-4 text-hydra-400" />
              待审批任务
              <span className="ml-auto badge bg-hydra-500/20 text-hydra-300">
                {pendingTaskApprovals.length}
              </span>
            </h3>
            <div className="space-y-2">
              {pendingTaskApprovals.map((task) => (
                <ApprovalTaskCard
                  key={task.id}
                  task={task}
                  selected={selectedTask?.id === task.id}
                  onClick={() => {
                    setSelectedTask(task);
                    setComment('');
                  }}
                />
              ))}
              {pendingTaskApprovals.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  暂无待审批任务
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3 card p-5 h-[calc(100vh-260px)] overflow-y-auto">
            {selectedTask ? (
              <TaskApprovalDetail
                task={selectedTask}
                comment={comment}
                setComment={setComment}
                score={score}
                setScore={setScore}
                onEngineerApprove={handleEngineerApprove}
                onChiefApprove={handleChiefApprove}
                onReject={handleReject}
                currentUserRole={currentUser.role}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <FileCheck2 className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">请从左侧选择待审批任务</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2 card p-4 h-[calc(100vh-260px)] overflow-y-auto">
            <h3 className="section-title">
              <Zap className="w-4 h-4 text-alert-yellow" />
              调度方案
              <span className="ml-auto badge bg-alert-yellow/20 text-alert-yellow">
                {pendingPlanApprovals.length}
              </span>
            </h3>
            <div className="space-y-2">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onClick={() => setSelectedPlan(plan)}
                />
              ))}
            </div>
          </div>

          <div className="col-span-3 card p-5 h-[calc(100vh-260px)] overflow-y-auto">
            {selectedPlan ? (
              <PlanDetail plan={selectedPlan} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <Zap className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">请从左侧选择调度方案</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all border',
        active
          ? 'bg-hydra-500/15 text-hydra-300 border-hydra-500/40'
          : 'text-slate-400 border-surface-border hover:text-white hover:bg-surface-elevated'
      )}
    >
      {children}
      <span
        className={cn(
          'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
          active ? 'bg-hydra-500/30 text-hydra-200' : 'bg-surface-muted text-slate-400'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function ApprovalTaskCard({
  task,
  selected,
  onClick,
}: {
  task: SimulationTask;
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
        <p className="font-medium text-white text-sm truncate flex-1">{task.name}</p>
        {task.approval && <ApprovalStatusBadge status={task.approval.status} />}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <MapPin className="w-3 h-3" />
        <span className="truncate">{task.basinName}</span>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-slate-500">
          {task.result ? formatRelative(task.result.completedAt) : '-'}
        </span>
        {task.result && (
          <span className="font-mono text-hydra-300">
            {task.result.peakDischarge.toFixed(0)} m³/s
          </span>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onClick,
}: {
  plan: DispatchPlan;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-md cursor-pointer transition-all border',
        selected
          ? 'bg-alert-yellow/10 border-alert-yellow/40'
          : 'bg-surface-elevated/30 border-transparent hover:bg-surface-elevated/60 hover:border-surface-border'
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <p className="font-medium text-white text-sm truncate flex-1">{plan.taskName}</p>
        <ApprovalStatusBadge status={plan.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
        {plan.type === 'reservoir' ? (
          <>
            <Droplets className="w-3 h-3 text-hydra-400" />
            <span>{plan.reservoirName}</span>
          </>
        ) : (
          <>
            <FileWarning className="w-3 h-3 text-alert-orange" />
            <span>{plan.diversionArea}</span>
          </>
        )}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">{formatRelative(plan.createdAt)}</span>
        <Badge variant={plan.type === 'reservoir' ? 'blue' : 'orange'}>
          {plan.type === 'reservoir' ? '水库调度' : '分洪'}
        </Badge>
      </div>
    </div>
  );
}

function TaskApprovalDetail({
  task,
  comment,
  setComment,
  score,
  setScore,
  onEngineerApprove,
  onChiefApprove,
  onReject,
  currentUserRole,
}: {
  task: SimulationTask;
  comment: string;
  setComment: (v: string) => void;
  score: number;
  setScore: (v: number) => void;
  onEngineerApprove: () => void;
  onChiefApprove: () => void;
  onReject: () => void;
  currentUserRole: string;
}) {
  const isEngineerStage = task.approval?.status === 'engineer_pending';
  const isChiefStage = task.approval?.status === 'chief_pending';

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{task.name}</h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {task.basinName} · {formatNumber(task.basinArea, 0)} km² · {task.rainfallReturnPeriod}年一遇
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          {task.approval && <ApprovalStatusBadge status={task.approval.status} />}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <ResultStat label="洪峰流量" value={`${task.result?.peakDischarge.toFixed(0)} m³/s`} />
        <ResultStat label="径流深" value={`${task.result?.totalRunoffDepth.toFixed(1)} mm`} />
        <ResultStat label="洪水总量" value={`${task.result?.floodVolume.toFixed(0)} 万m³`} />
        <ResultStat label="淹没面积" value={`${task.result?.inundationArea.toFixed(1)} km²`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-hydra-400" />
            审批流程
          </h4>
          <div className="space-y-4">
            <ApprovalStep
              label="水文工程师验证"
              name={task.approval?.engineerName}
              comment={task.approval?.engineerComment}
              time={task.approval?.engineerApprovedAt}
              status={task.approval?.status === 'engineer_pending' ? 'pending' : task.approval?.engineerApprovedAt ? 'approved' : 'pending'}
              active={isEngineerStage}
              score={task.approval?.accuracyScore}
            />
            <div className="ml-4 h-4 w-px bg-surface-muted" />
            <ApprovalStep
              label="总工确认入库"
              name={task.approval?.chiefName}
              comment={task.approval?.chiefComment}
              time={task.approval?.chiefApprovedAt}
              status={task.approval?.status === 'approved' ? 'approved' : task.approval?.status === 'rejected' ? 'rejected' : isChiefStage ? 'pending' : 'waiting'}
              active={isChiefStage}
            />
          </div>
        </div>

        <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-hydra-400" />
            {isEngineerStage ? '工程师验证' : isChiefStage ? '总工审批' : '审批信息'}
          </h4>

          {isEngineerStage && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">精度评分 (Nash效率系数)</label>
                  <span className="font-mono text-sm text-hydra-300">{score.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.001"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full accent-hydra-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0.5</span>
                  <span>0.75</span>
                  <span>1.0</span>
                </div>
              </div>
              <Progress value={score * 100} showLabel />
            </div>
          )}

          <div className="mt-3">
            <label className="label">审批意见</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-base resize-none"
              placeholder="请输入审批意见..."
            />
          </div>

          {(isEngineerStage || isChiefStage) && (
            <div className="mt-4 flex gap-2">
              {isEngineerStage ? (
                <button
                  onClick={onEngineerApprove}
                  disabled={!comment}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  验证通过，提交总工
                </button>
              ) : (
                <button
                  onClick={onChiefApprove}
                  disabled={!comment}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  确认，入库防洪预案
                </button>
              )}
              <button onClick={onReject} disabled={!comment} className="btn-danger disabled:opacity-50">
                <XCircle className="w-4 h-4" />
                驳回
              </button>
            </div>
          )}
        </div>
      </div>

      {task.alerts.length > 0 && (
        <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border">
          <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-alert-yellow" />
            关联预警 ({task.alerts.length})
          </h4>
          <div className="space-y-2">
            {task.alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded bg-surface/60">
                <AlertLevelBadge level={a.level} showText />
                <span className="text-sm text-white">{a.sectionName}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {a.reviewed ? `已复核 · ${a.reviewedBy}` : '待复核'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlanDetail({ plan }: { plan: DispatchPlan }) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{plan.taskName}</h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            {plan.type === 'reservoir' ? (
              <>
                <Droplets className="w-3.5 h-3.5 text-hydra-400" />
                水库调度方案 · {plan.reservoirName}
              </>
            ) : (
              <>
                <FileWarning className="w-3.5 h-3.5 text-alert-orange" />
                分洪方案 · {plan.diversionArea}
              </>
            )}
          </p>
        </div>
        <ApprovalStatusBadge status={plan.status} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <ResultStat
          label={plan.type === 'reservoir' ? '控泄流量' : '分洪量'}
          value={
            plan.type === 'reservoir'
              ? `${plan.releaseRate} m³/s`
              : `${plan.diversionVolume} 万m³`
          }
        />
        <ResultStat label="创建时间" value={formatDate(plan.createdAt)} />
        <ResultStat label="方案状态" value={plan.status === 'approved' ? '已执行' : '待审批'} />
      </div>

      <div className="p-4 rounded-lg bg-alert-yellow/5 border border-alert-yellow/20">
        <h4 className="text-sm font-medium text-alert-yellow mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          预期效果
        </h4>
        <p className="text-sm text-slate-300">{plan.estimatedEffect}</p>
      </div>

      <div className="p-4 rounded-lg bg-surface-elevated/40 border border-surface-border">
        <h4 className="text-sm font-medium text-slate-300 mb-3">审批流程</h4>
        <div className="flex items-center gap-2">
          <StepDot label="预警触发" status="approved" />
          <ArrowRight className="w-4 h-4 text-surface-muted" />
          <StepDot label="水文复核" status="approved" />
          <ArrowRight className="w-4 h-4 text-surface-muted" />
          <StepDot label="生成方案" status="approved" />
          <ArrowRight className="w-4 h-4 text-surface-muted" />
          <StepDot
            label="指挥审批"
            status={plan.status === 'approved' ? 'approved' : plan.status === 'draft' ? 'waiting' : 'pending'}
          />
          <ArrowRight className="w-4 h-4 text-surface-muted" />
          <StepDot
            label="执行调度"
            status={plan.status === 'approved' ? 'approved' : 'waiting'}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button className="btn-primary flex-1">
          <Send className="w-4 h-4" />
          推送至防汛指挥部门
        </button>
        <button className="btn-secondary">
          <MessageSquare className="w-4 h-4" />
          补充意见
        </button>
      </div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-md bg-surface-elevated/30 border border-surface-border">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-mono text-base text-white mt-1">{value}</p>
    </div>
  );
}

function ApprovalStep({
  label,
  name,
  comment,
  time,
  status,
  active,
  score,
}: {
  label: string;
  name?: string;
  comment?: string;
  time?: string;
  status: 'approved' | 'pending' | 'rejected' | 'waiting';
  active: boolean;
  score?: number;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2',
          status === 'approved' && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
          status === 'pending' && active && 'bg-hydra-500/20 border-hydra-500 text-hydra-300 animate-pulse',
          status === 'pending' && !active && 'bg-surface-muted border-surface-muted text-slate-400',
          status === 'rejected' && 'bg-alert-red/20 border-alert-red text-alert-red',
          status === 'waiting' && 'bg-surface-elevated border-surface-border text-slate-600'
        )}
      >
        {status === 'approved' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : status === 'rejected' ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-medium', status === 'waiting' ? 'text-slate-500' : 'text-white')}>
            {label}
          </p>
          {score !== undefined && (
            <Badge variant="green">精度 {formatPercent(score, 1)}</Badge>
          )}
        </div>
        {name && <p className="text-xs text-slate-400 mt-0.5">{name}</p>}
        {comment && (
          <p className="text-xs text-slate-300 mt-2 p-2 rounded bg-surface/50 border border-surface-border">
            {comment}
          </p>
        )}
        {time && <p className="text-[11px] text-slate-500 mt-1">{formatDate(time)}</p>}
      </div>
    </div>
  );
}

function StepDot({
  label,
  status,
}: {
  label: string;
  status: 'approved' | 'pending' | 'waiting';
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs',
          status === 'approved' && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
          status === 'pending' && 'bg-hydra-500/20 border-hydra-500 text-hydra-300 animate-pulse',
          status === 'waiting' && 'bg-surface-elevated border-surface-border text-slate-500'
        )}
      >
        {status === 'approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </div>
      <span
        className={cn(
          'text-[10px] text-center',
          status === 'waiting' ? 'text-slate-600' : 'text-slate-300'
        )}
      >
        {label}
      </span>
    </div>
  );
}
