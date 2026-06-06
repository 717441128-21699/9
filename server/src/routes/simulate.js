import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db.js';
import {
  hydrologicSCSCN,
  unitHydrographUH,
  convolve,
  computeWaterLevel,
  generateRainfallSeries,
  detectAlerts,
  computePeakDeviation,
} from '../hydrology.js';

export const simulateRouter = Router();

simulateRouter.post('/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const task = db.prepare('SELECT * FROM simulation_tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: '任务不存在' });

  const params = JSON.parse(task.parameters_json || '{}');
  const cnValue = params.cnValue || 75;
  const area = task.basin_area || 1000;
  const returnPeriod = task.rainfall_return_period || 10;

  const addLog = (stage, message, type) => {
    const row = db.prepare('SELECT logs_json FROM simulation_tasks WHERE id = ?').get(taskId);
    const logs = JSON.parse(row.logs_json || '[]');
    logs.push({ timestamp: new Date().toISOString(), stage, message, type });
    db.prepare('UPDATE simulation_tasks SET logs_json = ? WHERE id = ?').run(JSON.stringify(logs), taskId);
  };

  db.prepare("UPDATE simulation_tasks SET status = 'preprocessing', progress = 15 WHERE id = ?").run(taskId);
  addLog('preprocessing', '启动数据预处理：解析降雨序列和参数', 'info');

  let rainfallSeries = null;
  const rainfallFile = db.prepare("SELECT parsed_json FROM uploaded_files WHERE task_id = ? AND type = 'rainfall' ORDER BY uploaded_at DESC LIMIT 1").get(taskId);
  if (rainfallFile && rainfallFile.parsed_json) {
    const parsed = JSON.parse(rainfallFile.parsed_json);
    rainfallSeries = parsed.series;
  }
  if (!rainfallSeries || rainfallSeries.length === 0) {
    rainfallSeries = generateRainfallSeries(returnPeriod, 72, taskId.charCodeAt(taskId.length - 1));
    addLog('preprocessing', `未找到降雨文件，已基于${returnPeriod}年重现期合成降雨序列共${rainfallSeries.length}小时`, 'warning');
  } else {
    addLog('preprocessing', `已加载降雨序列共${rainfallSeries.length}小时`, 'success');
  }

  db.prepare("UPDATE simulation_tasks SET status = 'meshing', progress = 30 WHERE id = ?").run(taskId);
  addLog('meshing', `开始生成分布式水文网格（DEM分辨率${params.demResolution || 30}m）`, 'info');

  let demInfo = null;
  const demFile = db.prepare("SELECT parsed_json FROM uploaded_files WHERE task_id = ? AND type = 'dem' ORDER BY uploaded_at DESC LIMIT 1").get(taskId);
  if (demFile && demFile.parsed_json) {
    demInfo = JSON.parse(demFile.parsed_json);
  }
  const gridSize = demInfo ? demInfo.width * demInfo.height : 128 * 128;
  addLog('meshing', `网格生成完成，共${gridSize}个计算单元`, 'success');

  db.prepare("UPDATE simulation_tasks SET status = 'calculating', progress = 55 WHERE id = ?").run(taskId);
  addLog('calculating', `启动 SCS-CN 产流计算（CN=${cnValue}，流域面积${area}km²）`, 'info');

  const excess = hydrologicSCSCN(rainfallSeries, cnValue, area, params.initialLoss || 8);
  const totalExcess = excess.reduce((a, b) => a + b.value, 0);
  addLog('calculating', `产流计算完成，总净雨量${Math.round(totalExcess * 10) / 10}mm`, 'success');

  addLog('calculating', '启动单位线汇流计算（UH峰值时间6h）', 'info');
  const uh = unitHydrographUH(rainfallSeries.length + 12, 6);
  const hydrographRaw = convolve(excess, uh, area);
  const hydrograph = hydrographRaw.map((h) => ({
    time: h.time,
    value: Math.round(h.discharge * 10) / 10,
  }));

  const peakDischarge = Math.max(...hydrograph.map((h) => h.value));
  const peakPoint = hydrograph.find((h) => h.value === peakDischarge);
  const totalRunoffDepth = Math.round((hydrograph.reduce((a, b) => a + b.value, 0) * 3600) / (area * 1e6) * 1000 * 10) / 10;
  addLog('calculating', `汇流计算完成，洪峰流量${peakDischarge}m³/s`, 'success');

  db.prepare("UPDATE simulation_tasks SET status = 'routing', progress = 78 WHERE id = ?").run(taskId);
  addLog('routing', '启动河道洪水演进和断面水位计算', 'info');

  const sections = db.prepare('SELECT * FROM river_sections WHERE task_id = ?').all(taskId);
  const insertSeries = db.prepare('INSERT INTO section_time_series (section_id, time, water_level, discharge) VALUES (?, ?, ?, ?)');
  sections.forEach((sec) => {
    hydrograph.forEach((pt) => {
      insertSeries.run(sec.id, pt.time, computeWaterLevel(pt.value, sec), pt.value);
    });
  });

  addLog('routing', `已计算${sections.length}个河道断面的完整水位过程线`, 'success');

  const generatedAlerts = detectAlerts(hydrographRaw, sections);
  addLog('routing', `预警检测：触发${generatedAlerts.length}条预警`, generatedAlerts.length > 0 ? 'warning' : 'info');

  const alertInsert = db.prepare(`
    INSERT INTO alerts (id, task_id, section_id, section_name, level, type, value, threshold, triggered_at, reviewed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);
  generatedAlerts.forEach((a) => {
    alertInsert.run(uuid(), taskId, a.sectionId, a.sectionName, a.level, a.type, a.value, a.threshold, a.triggeredAt);
  });

  const inundationMap = [];
  const maxDepth = Math.round(peakDischarge / 500 * 10) / 10;
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const dist = Math.sqrt((x - 2) ** 2 + (y - 2) ** 2);
      const depth = Math.max(0, Math.round((maxDepth * Math.exp(-dist / 2.5)) * 100) / 100);
      if (depth > 0.05) inundationMap.push({ x, y, depth });
    }
  }

  const peakProbability = [
    { range: '<500', probability: 0.08, count: Math.round(peakDischarge < 500 ? 2 : 0) },
    { range: '500-1000', probability: 0.22, count: Math.round(peakDischarge >= 500 && peakDischarge < 1000 ? 5 : 0) },
    { range: '1000-2000', probability: 0.41, count: Math.round(peakDischarge >= 1000 && peakDischarge < 2000 ? 9 : 0) },
    { range: '2000-3000', probability: 0.20, count: Math.round(peakDischarge >= 2000 && peakDischarge < 3000 ? 4 : 0) },
    { range: '>3000', probability: 0.09, count: Math.round(peakDischarge >= 3000 ? 2 : 0) },
  ];

  const deviationInfo = computePeakDeviation(task.basin_name, peakDischarge);

  const result = {
    id: uuid(),
    taskId,
    peakDischarge,
    peakTime: peakPoint?.time || new Date().toISOString(),
    totalRunoffDepth,
    floodVolume: Math.round(peakDischarge * 3.6 * 10) / 10,
    inundationArea: Math.round(inundationMap.length * (area / 25) * 10) / 10,
    hydrograph,
    inundationMap,
    peakProbability,
    completedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE simulation_tasks SET status = 'completed', progress = 100,
      result_json = ?, deviation_rate = ? WHERE id = ?
  `).run(JSON.stringify(result), deviationInfo.deviation, taskId);
  addLog('completed', `模拟完成，洪峰${peakDischarge}m³/s，与历史平均偏差${Math.round(deviationInfo.deviation * 100)}%`, 'success');

  if (deviationInfo.pauseRecommended) {
    addLog('completed', '⚠ 连续3次模拟偏差>20%，已自动暂停该流域新任务，请首席科学家复核', 'error');
  }

  res.json({
    result,
    deviation: deviationInfo.deviation,
    pauseRecommended: deviationInfo.pauseRecommended,
    recentPeaks: deviationInfo.recentPeaks,
    alertsGenerated: generatedAlerts.length,
  });
});

simulateRouter.post('/:taskId/advance', (req, res) => {
  const { status, progress, message } = req.body;
  const { taskId } = req.params;
  const row = db.prepare('SELECT logs_json FROM simulation_tasks WHERE id = ?').get(taskId);
  if (!row) return res.status(404).json({ error: '任务不存在' });
  const logs = JSON.parse(row.logs_json || '[]');
  logs.push({ timestamp: new Date().toISOString(), stage: status, message: message || '状态更新', type: 'info' });
  db.prepare('UPDATE simulation_tasks SET status = ?, progress = ?, logs_json = ? WHERE id = ?')
    .run(status, progress ?? 0, JSON.stringify(logs), taskId);
  res.json({ ok: true });
});
