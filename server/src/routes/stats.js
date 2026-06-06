import { Router } from 'express';
import { db } from '../db.js';

export const statsRouter = Router();

statsRouter.get('/daily', (req, res) => {
  const rows = db.prepare('SELECT * FROM daily_stats ORDER BY date ASC').all();
  res.json(rows.map((r) => ({
    date: r.date,
    completionRate: r.completion_rate,
    avgLeadTime: r.avg_lead_time,
    forecastAccuracy: r.forecast_accuracy,
    totalTasks: r.total_tasks,
    completedTasks: r.completed_tasks,
    alertsCount: r.alerts_count,
  })));
});

statsRouter.get('/radar', (req, res) => {
  const rows = db.prepare('SELECT * FROM daily_stats ORDER BY date DESC LIMIT 7').all();
  if (rows.length === 0) {
    return res.json([
      { subject: '模拟完成率', value: 85, fullMark: 100 },
      { subject: '预警提前量', value: 78, fullMark: 100 },
      { subject: '预报准确度', value: 82, fullMark: 100 },
      { subject: '调度响应', value: 88, fullMark: 100 },
      { subject: '数据质量', value: 90, fullMark: 100 },
      { subject: '模型精度', value: 80, fullMark: 100 },
    ]);
  }
  const avg = (key) => Math.round((rows.reduce((a, b) => a + b[key], 0) / rows.length) * 10) / 10;
  res.json([
    { subject: '模拟完成率', value: Math.round(avg('completion_rate') * 100), fullMark: 100 },
    { subject: '预警提前量(h)', value: Math.round(avg('avg_lead_time') * 10), fullMark: 100 },
    { subject: '预报准确度', value: Math.round(avg('forecast_accuracy') * 100), fullMark: 100 },
    { subject: '调度响应', value: 85, fullMark: 100 },
    { subject: '数据质量', value: 88, fullMark: 100 },
    { subject: '模型精度', value: 82, fullMark: 100 },
  ]);
});

statsRouter.get('/deviation', (req, res) => {
  const rows = db.prepare(`
    SELECT t.basin_name, t.deviation_rate, t.result_json, t.created_at
    FROM simulation_tasks t
    WHERE t.status = 'completed' AND t.deviation_rate IS NOT NULL
    ORDER BY t.created_at DESC LIMIT 20
  `).all();
  const byBasin = {};
  rows.forEach((r) => {
    if (!byBasin[r.basin_name]) byBasin[r.basin_name] = [];
    byBasin[r.basin_name].push({
      deviation: r.deviation_rate,
      createdAt: r.created_at,
      peakDischarge: r.result_json ? JSON.parse(r.result_json).peakDischarge : null,
    });
  });
  const topDeviation = Object.entries(byBasin)
    .map(([basin, arr]) => ({
      basin,
      count: arr.length,
      avgDeviation: Math.round(arr.reduce((a, b) => a + b.deviation, 0) / arr.length * 1000) / 1000,
      maxDeviation: Math.max(...arr.map((x) => x.deviation)),
      pausesRecommended: arr.length >= 3 && arr.every((x) => x.deviation > 0.2),
      recent: arr.slice(0, 3),
    }))
    .sort((a, b) => b.avgDeviation - a.avgDeviation)
    .slice(0, 5);
  const globalPause = topDeviation.some((b) => b.pausesRecommended);
  res.json({ topDeviation, globalPause });
});
