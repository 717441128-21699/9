import type {
  SimulationTask,
  Alert,
  DispatchPlan,
  DailyStats,
  RadarStat,
  DispatchRule,
  User,
  RiverSection,
  TimeSeriesPoint,
  ProbabilityBin,
  InundationCell,
  TaskLog,
} from '@/types';
import { generateId } from './format';

const basinNames = ['长江流域-嘉陵江段', '黄河流域-渭河段', '珠江流域-东江段', '淮河流域-颍河段', '海河流域-永定河段'];
const sectionNames = ['北碚站', '武胜站', '合川站', '渠县站', '罗渡溪站', '宜昌站', '沙市站', '汉口站'];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function generateTimeSeries(hours: number, base: number, volatility: number): TimeSeriesPoint[] {
  const series: TimeSeriesPoint[] = [];
  const now = new Date();
  let value = base;
  for (let i = hours; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    value = Math.max(0, value + randomBetween(-volatility, volatility));
    const peakBoost = i < 6 ? Math.sin((6 - i) / 6 * Math.PI) * volatility * 3 : 0;
    series.push({
      time: t.toISOString(),
      value: Number((value + peakBoost).toFixed(2)),
    });
  }
  return series;
}

function generateHydrograph(): TimeSeriesPoint[] {
  const series: TimeSeriesPoint[] = [];
  const start = new Date();
  start.setHours(start.getHours() - 72);
  for (let h = 0; h < 120; h++) {
    const t = new Date(start.getTime() + h * 3600 * 1000);
    const x = h / 120;
    const value = Math.exp(-Math.pow((x - 0.35) / 0.15, 2)) * 2800 + randomBetween(0, 80);
    series.push({
      time: t.toISOString(),
      value: Number(value.toFixed(1)),
    });
  }
  return series;
}

function generateProbabilityBins(): ProbabilityBin[] {
  const bins = [
    { range: '<1500', count: 0, probability: 0 },
    { range: '1500-2000', count: 0, probability: 0 },
    { range: '2000-2500', count: 0, probability: 0 },
    { range: '2500-3000', count: 0, probability: 0 },
    { range: '3000-3500', count: 0, probability: 0 },
    { range: '>3500', count: 0, probability: 0 },
  ];
  const probs = [0.05, 0.12, 0.28, 0.32, 0.15, 0.08];
  let total = 0;
  bins.forEach((b, i) => {
    b.count = randomInt(5, 25);
    total += b.count;
  });
  bins.forEach((b, i) => {
    b.probability = probs[i];
  });
  return bins;
}

function generateInundationMap(): InundationCell[] {
  const cells: InundationCell[] = [];
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 30; x++) {
      const centerDist = Math.sqrt(Math.pow(x - 15, 2) + Math.pow(y - 10, 2));
      if (centerDist < 12) {
        const depth = Math.max(0, (12 - centerDist) / 12 * randomBetween(2.5, 5.5));
        if (depth > 0.3) {
          cells.push({ x, y, depth: Number(depth.toFixed(2)) });
        }
      }
    }
  }
  return cells;
}

function generateSections(count: number): RiverSection[] {
  const sections: RiverSection[] = [];
  for (let i = 0; i < count; i++) {
    const warningLevel = randomBetween(180, 200);
    const guaranteedLevel = warningLevel + randomBetween(1.5, 3);
    const currentLevel = warningLevel - randomBetween(1, 3) + randomBetween(0, 4);
    sections.push({
      id: generateId(),
      name: sectionNames[i % sectionNames.length],
      riverKm: randomInt(50, 800),
      warningLevel: Number(warningLevel.toFixed(2)),
      guaranteedLevel: Number(guaranteedLevel.toFixed(2)),
      currentWaterLevel: Number(currentLevel.toFixed(2)),
      currentDischarge: Number(randomBetween(500, 3200).toFixed(1)),
      historicalLevels: generateTimeSeries(24, currentLevel, 0.3),
      historicalDischarges: generateTimeSeries(24, 1500, 200),
      risingRate: Number(randomBetween(-0.2, 0.8).toFixed(2)),
    });
  }
  return sections;
}

function generateAlerts(taskId: string, sections: RiverSection[]): Alert[] {
  const alerts: Alert[] = [];
  const levels: Array<'blue' | 'yellow' | 'orange' | 'red'> = ['blue', 'yellow', 'orange', 'red'];
  sections.forEach((s) => {
    if (s.currentWaterLevel > s.warningLevel && Math.random() > 0.3) {
      const excess = s.currentWaterLevel - s.warningLevel;
      let level: 'blue' | 'yellow' | 'orange' | 'red' = 'blue';
      if (excess > 1.5) level = 'red';
      else if (excess > 0.8) level = 'orange';
      else if (excess > 0.3) level = 'yellow';
      const now = new Date();
      now.setMinutes(now.getMinutes() - randomInt(5, 180));
      alerts.push({
        id: generateId(),
        taskId,
        sectionId: s.id,
        sectionName: s.name,
        level,
        type: Math.random() > 0.6 ? 'rising_rate' : 'water_level',
        value: Number(s.currentWaterLevel.toFixed(2)),
        threshold: s.warningLevel,
        triggeredAt: now.toISOString(),
        reviewed: Math.random() > 0.5,
        reviewedBy: Math.random() > 0.5 ? '张明华' : undefined,
        reviewedAt: Math.random() > 0.5 ? now.toISOString() : undefined,
        reviewComment: Math.random() > 0.5 ? '已核实数据，准备启动调度方案' : undefined,
      });
    }
  });
  return alerts;
}

function generateLogs(status: string): TaskLog[] {
  const logs: TaskLog[] = [];
  const stages: Array<{ key: string; msg: string; min: string }> = [
    { key: 'pending', msg: '任务已创建，等待数据校验', min: '30' },
    { key: 'preprocessing', msg: 'DEM数据预处理完成，提取流域边界', min: '25' },
    { key: 'meshing', msg: '生成三角形网格 128,456 个单元', min: '20' },
    { key: 'calculating', msg: '径流计算进度 67%，正在求解圣维南方程', min: '10' },
    { key: 'routing', msg: '洪水演进模拟中，演算至河道 45km 处', min: '5' },
    { key: 'completed', msg: '模拟完成，已生成结果报告', min: '0' },
  ];
  const order = ['pending', 'preprocessing', 'meshing', 'calculating', 'routing', 'completed', 'error'];
  const currentIdx = order.indexOf(status);
  const now = new Date();
  for (let i = 0; i <= Math.min(currentIdx, 5); i++) {
    if (stages[i]) {
      const t = new Date(now.getTime() - parseInt(stages[i].min) * 60 * 1000);
      logs.push({
        timestamp: t.toISOString(),
        stage: stages[i].key,
        message: stages[i].msg,
        type: i === currentIdx && status !== 'completed' ? 'info' : 'success',
      });
    }
  }
  if (status === 'error') {
    logs.push({
      timestamp: now.toISOString(),
      stage: 'error',
      message: '计算异常：数值不稳定，已回退至径流计算阶段',
      type: 'error',
    });
  }
  return logs;
}

export function generateMockTasks(): SimulationTask[] {
  const tasks: SimulationTask[] = [];
  const statuses: Array<'pending' | 'preprocessing' | 'meshing' | 'calculating' | 'routing' | 'completed' | 'error'> = [
    'calculating', 'completed', 'routing', 'preprocessing', 'completed', 'meshing', 'completed', 'error', 'pending', 'calculating',
  ];
  for (let i = 0; i < 10; i++) {
    const status = statuses[i];
    const sections = generateSections(randomInt(3, 6));
    const alerts = generateAlerts(`task-${i}`, sections);
    const createdAt = new Date();
    createdAt.setHours(createdAt.getHours() - randomInt(1, 48));
    const task: SimulationTask = {
      id: `task-${i}`,
      name: `${basinNames[i % basinNames.length]} 2026-0${randomInt(1, 6)}模拟`,
      basinName: basinNames[i % basinNames.length],
      basinArea: Number(randomBetween(800, 15000).toFixed(0)),
      createdAt: createdAt.toISOString(),
      status,
      progress: status === 'completed' ? 100 : status === 'error' ? randomInt(30, 70) : status === 'pending' ? 5 : status === 'preprocessing' ? randomInt(15, 30) : status === 'meshing' ? randomInt(35, 55) : status === 'calculating' ? randomInt(60, 85) : randomInt(88, 98),
      rainfallReturnPeriod: [5, 10, 20, 50, 100][randomInt(0, 4)],
      timeWindow: '2026-06-01 ~ 2026-06-07',
      parameters: {
        demResolution: 30,
        soilType: ['壤土', '砂壤土', '粘土', '粉砂壤土'][randomInt(0, 3)],
        cnValue: Number(randomBetween(65, 85).toFixed(1)),
        initialLoss: Number(randomBetween(5, 15).toFixed(1)),
        recessionCoefficient: Number(randomBetween(0.85, 0.98).toFixed(3)),
        routingVelocity: Number(randomBetween(1.2, 3.5).toFixed(2)),
        manningN: Number(randomBetween(0.03, 0.06).toFixed(3)),
      },
      files: [
        { id: generateId(), name: `DEM_${basinNames[i % basinNames.length].slice(0, 4)}.tif`, type: 'dem', size: randomInt(50, 500) * 1024 * 1024, uploadedAt: createdAt.toISOString(), status: 'validated' },
        { id: generateId(), name: `soil_type_${i + 1}.shp`, type: 'soil', size: randomInt(5, 50) * 1024 * 1024, uploadedAt: createdAt.toISOString(), status: 'validated' },
        { id: generateId(), name: `rainfall_2026_${String(i + 1).padStart(2, '0')}.csv`, type: 'rainfall', size: randomInt(1, 10) * 1024 * 1024, uploadedAt: createdAt.toISOString(), status: 'validated' },
      ],
      alerts,
      sections,
      logs: generateLogs(status),
      deviationRate: status === 'completed' ? Number(randomBetween(0.02, 0.28).toFixed(3)) : undefined,
    };
    if (status === 'completed') {
      task.result = {
        id: generateId(),
        taskId: task.id,
        peakDischarge: Number(randomBetween(1800, 3500).toFixed(1)),
        peakTime: new Date(createdAt.getTime() + randomInt(20, 50) * 3600 * 1000).toISOString(),
        totalRunoffDepth: Number(randomBetween(45, 180).toFixed(1)),
        floodVolume: Number(randomBetween(50, 500).toFixed(0)),
        inundationArea: Number(randomBetween(20, 200).toFixed(1)),
        hydrograph: generateHydrograph(),
        inundationMap: generateInundationMap(),
        peakProbability: generateProbabilityBins(),
        completedAt: new Date().toISOString(),
      };
      task.approval = {
        id: generateId(),
        taskId: task.id,
        engineerId: 'eng-001',
        engineerName: '李建国',
        engineerComment: '模型参数合理，Nash效率系数0.87，满足精度要求',
        engineerApprovedAt: Math.random() > 0.2 ? new Date(createdAt.getTime() + randomInt(2, 6) * 3600 * 1000).toISOString() : undefined,
        accuracyScore: Number(randomBetween(0.78, 0.95).toFixed(3)),
        chiefId: Math.random() > 0.5 ? 'chief-001' : undefined,
        chiefName: Math.random() > 0.5 ? '王志远' : undefined,
        chiefComment: Math.random() > 0.5 ? '同意入库，纳入2026年度防洪预案' : undefined,
        chiefApprovedAt: Math.random() > 0.5 ? new Date(createdAt.getTime() + randomInt(6, 12) * 3600 * 1000).toISOString() : undefined,
        status: ['engineer_pending', 'engineer_approved', 'chief_pending', 'approved'][randomInt(0, 3)] as any,
      };
    }
    tasks.push(task);
  }
  return tasks;
}

export function generateMockDispatchPlans(): DispatchPlan[] {
  const plans: DispatchPlan[] = [];
  const reservoirNames = ['亭子口水库', '宝珠寺水库', '升钟水库', '武都水库'];
  const diversionAreas = ['嘉陵江左岸分洪区', '东河分蓄洪区', '西河滞洪区'];
  for (let i = 0; i < 5; i++) {
    const type = Math.random() > 0.4 ? 'reservoir' : 'flood_diversion';
    plans.push({
      id: generateId(),
      taskId: `task-${randomInt(0, 9)}`,
      taskName: `${basinNames[i % basinNames.length]} 调度方案 ${i + 1}`,
      alertId: generateId(),
      type,
      reservoirName: type === 'reservoir' ? reservoirNames[i % reservoirNames.length] : undefined,
      releaseRate: type === 'reservoir' ? Number(randomBetween(500, 2500).toFixed(0)) : 0,
      diversionArea: type === 'flood_diversion' ? diversionAreas[i % diversionAreas.length] : undefined,
      diversionVolume: type === 'flood_diversion' ? Number(randomBetween(50, 300).toFixed(0)) : 0,
      estimatedEffect: type === 'reservoir'
        ? `预计削峰 ${randomInt(15, 35)}%，降低下游水位 ${randomBetween(0.5, 1.8).toFixed(2)}m`
        : `分洪 ${randomBetween(50, 300).toFixed(0)}万m³，降低河道水位 ${randomBetween(0.3, 1.2).toFixed(2)}m`,
      createdAt: new Date(Date.now() - randomInt(1, 48) * 3600 * 1000).toISOString(),
      status: ['draft', 'engineer_pending', 'chief_pending', 'approved'][randomInt(0, 3)] as any,
    });
  }
  return plans;
}

export function generateMockDailyStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    stats.push({
      date: d.toISOString().split('T')[0],
      completionRate: Number(randomBetween(0.78, 0.96).toFixed(3)),
      avgLeadTime: Number(randomBetween(3.5, 8.2).toFixed(1)),
      forecastAccuracy: Number(randomBetween(0.82, 0.95).toFixed(3)),
      totalTasks: randomInt(8, 20),
      completedTasks: randomInt(6, 18),
      alertsCount: randomInt(2, 12),
    });
  }
  return stats;
}

export function generateMockRadarStats(): RadarStat[] {
  return [
    { subject: '预报精度', value: 89, fullMark: 100 },
    { subject: '预警提前量', value: 76, fullMark: 100 },
    { subject: '完成效率', value: 92, fullMark: 100 },
    { subject: '调度效果', value: 84, fullMark: 100 },
    { subject: '数据质量', value: 95, fullMark: 100 },
    { subject: '模型稳定性', value: 81, fullMark: 100 },
  ];
}

export function generateMockDispatchRules(): DispatchRule[] {
  const rules: DispatchRule[] = [];
  const ruleData = [
    { cond: '北碚站水位超过195m', action: '亭子口水库控泄1500m³/s' },
    { cond: '24h降雨量超过150mm', action: '启动宝珠寺水库预泄方案' },
    { cond: '武胜站上涨速率>0.5m/h', action: '启用东河分蓄洪区' },
    { cond: '合川站流量>3000m³/s', action: '升钟水库减少出库至800m³/s' },
    { cond: '罗渡溪站水位超警戒', action: '武都水库控泄+嘉陵江分洪联动' },
  ];
  ruleData.forEach((r, i) => {
    rules.push({
      id: generateId(),
      name: `调度规则-${String(i + 1).padStart(3, '0')}`,
      basinName: basinNames[i % basinNames.length],
      triggerCondition: r.cond,
      action: r.action,
      confidence: Number(randomBetween(0.75, 0.98).toFixed(3)),
      usageCount: randomInt(3, 48),
      lastUsedAt: new Date(Date.now() - randomInt(1, 30) * 24 * 3600 * 1000).toISOString(),
    });
  });
  return rules;
}

export function generateMockUsers(): User[] {
  return [
    { id: 'u-001', name: '张明华', role: 'hydrologist', email: 'zhangmh@water.gov.cn' },
    { id: 'u-002', name: '李建国', role: 'engineer', email: 'lijg@water.gov.cn' },
    { id: 'u-003', name: '王志远', role: 'chief', email: 'wangzy@water.gov.cn' },
    { id: 'u-004', name: '刘铁军', role: 'commander', email: 'liutj@water.gov.cn' },
    { id: 'u-005', name: '陈院士', role: 'scientist', email: 'chenys@water.gov.cn' },
  ];
}

export function getCurrentUser(): User {
  return generateMockUsers()[0];
}
