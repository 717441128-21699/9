import { create } from 'zustand';
import type {
  SimulationTask,
  Alert,
  DispatchPlan,
  DailyStats,
  DispatchRule,
  User,
  TaskStatus,
  ApprovalStatus,
  RadarStat,
} from '@/types';
import {
  generateMockTasks,
  generateMockDispatchPlans,
  generateMockDailyStats,
  generateMockDispatchRules,
  generateMockUsers,
  getCurrentUser,
  generateMockRadarStats,
} from '@/utils/mock';

const initialTasks = generateMockTasks();
const initialAlerts = initialTasks.flatMap((t) => t.alerts);
const initialRadarStats = generateMockRadarStats();

interface AppState {
  tasks: SimulationTask[];
  alerts: Alert[];
  dispatchPlans: DispatchPlan[];
  dailyStats: DailyStats[];
  dispatchRules: DispatchRule[];
  users: User[];
  currentUser: User;
  selectedTaskId: string | null;
  tasksPaused: boolean;
  radarStats: RadarStat[];

  setSelectedTask: (id: string | null) => void;
  getTask: (id: string) => SimulationTask | undefined;
  getTaskAlerts: (taskId: string) => Alert[];
  getPendingApprovals: () => SimulationTask[];

  updateTaskStatus: (taskId: string, status: TaskStatus, progress?: number) => void;
  reviewAlert: (alertId: string, reviewer: string, comment: string) => void;
  approveByEngineer: (taskId: string, comment: string, score: number) => void;
  approveByChief: (taskId: string, comment: string) => void;
  rejectApproval: (taskId: string, comment: string) => void;
  createDispatchPlan: (plan: Partial<DispatchPlan>) => void;
  toggleTasksPaused: () => void;
  addNewTask: (task: Partial<SimulationTask>) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  return {
    tasks: initialTasks,
    alerts: initialAlerts,
    radarStats: initialRadarStats,
    dispatchPlans: generateMockDispatchPlans(),
    dailyStats: generateMockDailyStats(),
    dispatchRules: generateMockDispatchRules(),
    users: generateMockUsers(),
    currentUser: getCurrentUser(),
    selectedTaskId: initialTasks[0]?.id ?? null,
    tasksPaused: false,

    setSelectedTask: (id) => set({ selectedTaskId: id }),

    getTask: (id) => get().tasks.find((t) => t.id === id),

    getTaskAlerts: (taskId) => get().alerts.filter((a) => a.taskId === taskId),

    getPendingApprovals: () =>
      get().tasks.filter(
        (t) =>
          t.approval &&
          (t.approval.status === 'engineer_pending' || t.approval.status === 'chief_pending')
      ),

    updateTaskStatus: (taskId, status, progress) =>
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, status, progress: progress ?? t.progress }
            : t
        ),
      })),

    reviewAlert: (alertId, reviewer, comment) =>
      set((state) => {
        const now = new Date().toISOString();
        return {
          alerts: state.alerts.map((a) =>
            a.id === alertId
              ? {
                  ...a,
                  reviewed: true,
                  reviewedBy: reviewer,
                  reviewedAt: now,
                  reviewComment: comment,
                }
              : a
          ),
          tasks: state.tasks.map((t) => ({
            ...t,
            alerts: t.alerts.map((a) =>
              a.id === alertId
                ? {
                    ...a,
                    reviewed: true,
                    reviewedBy: reviewer,
                    reviewedAt: now,
                    reviewComment: comment,
                  }
                : a
            ),
          })),
        };
      }),

    approveByEngineer: (taskId, comment, score) =>
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId || !t.approval) return t;
          return {
            ...t,
            approval: {
              ...t.approval,
              engineerComment: comment,
              accuracyScore: score,
              engineerApprovedAt: new Date().toISOString(),
              status: 'chief_pending' as ApprovalStatus,
            },
          };
        }),
      })),

    approveByChief: (taskId, comment) =>
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId || !t.approval) return t;
          return {
            ...t,
            approval: {
              ...t.approval,
              chiefComment: comment,
              chiefApprovedAt: new Date().toISOString(),
              chiefName: get().currentUser.name,
              chiefId: get().currentUser.id,
              status: 'approved' as ApprovalStatus,
            },
          };
        }),
      })),

    rejectApproval: (taskId, comment) =>
      set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== taskId || !t.approval) return t;
          return {
            ...t,
            approval: {
              ...t.approval,
              chiefComment: comment,
              status: 'rejected' as ApprovalStatus,
            },
          };
        }),
      })),

    createDispatchPlan: (plan) =>
      set((state) => ({
        dispatchPlans: [
          {
            id: Math.random().toString(36).slice(2, 10),
            taskId: plan.taskId ?? '',
            taskName: plan.taskName ?? '',
            alertId: plan.alertId ?? '',
            type: plan.type ?? 'reservoir',
            reservoirName: plan.reservoirName,
            releaseRate: plan.releaseRate ?? 0,
            diversionArea: plan.diversionArea,
            diversionVolume: plan.diversionVolume ?? 0,
            estimatedEffect: plan.estimatedEffect ?? '',
            createdAt: new Date().toISOString(),
            status: 'draft' as ApprovalStatus,
          },
          ...state.dispatchPlans,
        ],
      })),

    toggleTasksPaused: () => set((state) => ({ tasksPaused: !state.tasksPaused })),

    addNewTask: (task) =>
      set((state) => {
        const newTask: SimulationTask = {
          id: `task-${Date.now()}`,
          name: task.name ?? '新建模拟任务',
          basinName: task.basinName ?? '未命名流域',
          basinArea: task.basinArea ?? 1000,
          createdAt: new Date().toISOString(),
          status: 'pending',
          progress: 5,
          rainfallReturnPeriod: task.rainfallReturnPeriod ?? 10,
          timeWindow: task.timeWindow ?? '2026-06-01 ~ 2026-06-07',
          parameters: task.parameters ?? {
            demResolution: 30,
            soilType: '壤土',
            cnValue: 75,
            initialLoss: 10,
            recessionCoefficient: 0.92,
            routingVelocity: 2.0,
            manningN: 0.04,
          },
          files: task.files ?? [],
          alerts: [],
          sections: [],
          logs: [
            {
              timestamp: new Date().toISOString(),
              stage: 'pending',
              message: '任务已创建，等待数据校验',
              type: 'info',
            },
          ],
        };
        return { tasks: [newTask, ...state.tasks], selectedTaskId: newTask.id };
      }),
  };
});
