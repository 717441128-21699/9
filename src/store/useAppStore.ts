import { create } from 'zustand';
import type {
  SimulationTask,
  Alert,
  DispatchPlan,
  DailyStats,
  DispatchRule,
  User,
  TaskStatus,
  RadarStat,
} from '@/types';
import { api } from '@/api/client';

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
  loading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  setSelectedTask: (id: string | null) => void;
  getTask: (id: string) => SimulationTask | undefined;

  addNewTask: (task: Partial<SimulationTask>) => Promise<SimulationTask>;
  updateTaskStatus: (taskId: string, status: TaskStatus, progress?: number) => Promise<void>;
  runSimulation: (taskId: string) => Promise<{ ok: boolean; message?: string }>;

  reviewAlert: (alertId: string, reviewer: string, comment: string) => Promise<void>;

  approveByEngineer: (taskId: string, comment: string, score: number) => Promise<void>;
  approveByChief: (taskId: string, comment: string) => Promise<void>;
  rejectApproval: (taskId: string, comment: string) => Promise<void>;

  createDispatchPlan: (plan: Partial<DispatchPlan>) => Promise<void>;
  toggleTasksPaused: () => void;

  uploadFile: (taskId: string, type: 'dem' | 'soil' | 'rainfall', file: File) => Promise<void>;
}

const emptyUser: User = { id: '', name: '加载中', role: 'admin', email: '' };

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  alerts: [],
  dispatchPlans: [],
  dailyStats: [],
  dispatchRules: [],
  users: [],
  currentUser: emptyUser,
  selectedTaskId: null,
  tasksPaused: false,
  radarStats: [],
  loading: false,
  error: null,

  async hydrate() {
    set({ loading: true, error: null });
    try {
      const [tasks, alerts, plans, daily, rules, users, cur, radar, dev] = await Promise.all([
        api.listTasks(),
        api.listAlerts(),
        api.listPlans(),
        api.dailyStats(),
        api.listRules(),
        api.listUsers(),
        api.currentUser(),
        api.radarStats(),
        api.deviationStats().catch(() => ({ topDeviation: [], globalPause: false })),
      ]);
      set({
        tasks,
        alerts,
        dispatchPlans: plans,
        dailyStats: daily,
        dispatchRules: rules,
        users,
        currentUser: cur,
        radarStats: radar,
        selectedTaskId: tasks[0]?.id ?? null,
        tasksPaused: !!dev?.globalPause,
      });
    } catch (e: any) {
      set({ error: e.message || '加载数据失败' });
    } finally {
      set({ loading: false });
    }
  },

  setSelectedTask: (id) => set({ selectedTaskId: id }),
  getTask: (id) => get().tasks.find((t) => t.id === id),

  async addNewTask(task) {
    const created = await api.createTask({
      name: task.name,
      basinName: task.basinName,
      basinArea: task.basinArea,
      rainfallReturnPeriod: task.rainfallReturnPeriod,
      timeWindow: task.timeWindow,
      parameters: task.parameters,
    });
    set((state) => ({ tasks: [created, ...state.tasks], selectedTaskId: created.id }));
    return created;
  },

  async updateTaskStatus(taskId, status, progress) {
    await api.updateTaskStatus(taskId, status, progress ?? 0);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status, progress: progress ?? t.progress } : t)),
    }));
  },

  async runSimulation(taskId) {
    try {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: 'preprocessing', progress: 10 } : t)),
      }));
      const result = await api.runSimulation(taskId);
      const tasks = await api.listTasks();
      const alerts = await api.listAlerts();
      set({ tasks, alerts });
      return { ok: true, message: `模拟完成，洪峰流量 ${result.result?.peakDischarge} m³/s，触发 ${result.alertsGenerated} 条预警` };
    } catch (e: any) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status: 'error' } : t)),
      }));
      return { ok: false, message: e.message || '模拟失败' };
    }
  },

  async reviewAlert(alertId, reviewer, comment) {
    await api.reviewAlert(alertId, reviewer, comment);
    const updated = await api.listAlerts();
    const tasks = await api.listTasks();
    set({ alerts: updated, tasks });
  },

  async approveByEngineer(taskId, comment, score) {
    const { currentUser } = get();
    await api.approveByEngineer(taskId, currentUser.id, currentUser.name, comment, score);
    const tasks = await api.listTasks();
    set({ tasks });
  },

  async approveByChief(taskId, comment) {
    const { currentUser } = get();
    await api.approveByChief(taskId, currentUser.id, currentUser.name, comment);
    const tasks = await api.listTasks();
    set({ tasks });
  },

  async rejectApproval(taskId, comment) {
    await api.rejectApproval(taskId, comment);
    const tasks = await api.listTasks();
    set({ tasks });
  },

  async createDispatchPlan(plan) {
    await api.createPlan(plan);
    const plans = await api.listPlans();
    set({ dispatchPlans: plans });
  },

  toggleTasksPaused: () => set((state) => ({ tasksPaused: !state.tasksPaused })),

  async uploadFile(taskId, type, file) {
    await api.uploadFile(taskId, type, file);
    const tasks = await api.listTasks();
    set({ tasks });
  },
}));
