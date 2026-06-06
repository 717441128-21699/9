import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuid } from 'uuid';

export const tasksRouter = Router();

function buildTask(row) {
  const rawFiles = db.prepare('SELECT * FROM uploaded_files WHERE task_id = ?').all(row.id);
  const rawSections = db.prepare('SELECT * FROM river_sections WHERE task_id = ?').all(row.id);
  const rawAlerts = db.prepare('SELECT * FROM alerts WHERE task_id = ? ORDER BY triggered_at DESC').all(row.id);
  const rawApproval = db.prepare('SELECT * FROM approvals WHERE task_id = ?').get(row.id);

  const sections = rawSections.map((s) => {
    const ts = db.prepare('SELECT * FROM section_time_series WHERE section_id = ? ORDER BY time').all(s.id);
    return {
      id: s.id,
      taskId: s.task_id,
      name: s.name,
      riverKm: s.river_km,
      warningLevel: s.warning_level,
      guaranteedLevel: s.guaranteed_level,
      currentWaterLevel: ts.length ? ts[ts.length - 1].water_level : 0,
      currentDischarge: ts.length ? ts[ts.length - 1].discharge : 0,
      historicalLevels: ts.map((t) => ({ time: t.time, value: t.water_level })),
      historicalDischarges: ts.map((t) => ({ time: t.time, value: t.discharge })),
      risingRate: ts.length >= 2 ? Math.round((ts[ts.length - 1].water_level - ts[ts.length - 2].water_level) * 100) / 100 : 0,
    };
  });

  return {
    id: row.id,
    name: row.name,
    basinName: row.basin_name,
    basinArea: row.basin_area,
    createdAt: row.created_at,
    status: row.status,
    progress: row.progress,
    rainfallReturnPeriod: row.rainfall_return_period,
    timeWindow: row.time_window,
    parameters: JSON.parse(row.parameters_json || '{}'),
    files: rawFiles.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      size: f.size,
      uploadedAt: f.uploaded_at,
      status: f.status,
      parsed: f.parsed_json ? JSON.parse(f.parsed_json) : null,
    })),
    sections,
    alerts: rawAlerts.map(alertRowToObj),
    result: row.result_json ? JSON.parse(row.result_json) : null,
    approval: rawApproval ? approvalRowToObj(rawApproval) : null,
    deviationRate: row.deviation_rate,
    logs: JSON.parse(row.logs_json || '[]'),
  };
}

function alertRowToObj(r) {
  return {
    id: r.id,
    taskId: r.task_id,
    sectionId: r.section_id,
    sectionName: r.section_name,
    level: r.level,
    type: r.type,
    value: r.value,
    threshold: r.threshold,
    triggeredAt: r.triggered_at,
    reviewed: !!r.reviewed,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    reviewComment: r.review_comment,
  };
}

function approvalRowToObj(r) {
  return {
    id: r.id,
    taskId: r.task_id,
    engineerId: r.engineer_id,
    engineerName: r.engineer_name,
    engineerComment: r.engineer_comment,
    engineerApprovedAt: r.engineer_approved_at,
    accuracyScore: r.accuracy_score,
    chiefId: r.chief_id,
    chiefName: r.chief_name,
    chiefComment: r.chief_comment,
    chiefApprovedAt: r.chief_approved_at,
    status: r.status,
  };
}

tasksRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM simulation_tasks ORDER BY created_at DESC').all();
  res.json(rows.map(buildTask));
});

tasksRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM simulation_tasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '任务不存在' });
  res.json(buildTask(row));
});

tasksRouter.post('/', (req, res) => {
  const { name, basinName, basinArea, rainfallReturnPeriod, timeWindow, parameters } = req.body;
  const id = uuid();
  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO simulation_tasks (id, name, basin_name, basin_area, created_at, status, progress,
      rainfall_return_period, time_window, parameters_json, logs_json)
    VALUES (?, ?, ?, ?, ?, 'pending', 5, ?, ?, ?, ?)
  `).run(
    id,
    name || `${basinName || '未命名流域'}·模拟任务`,
    basinName || '未命名流域',
    basinArea || 1000,
    createdAt,
    rainfallReturnPeriod || 10,
    timeWindow || '',
    JSON.stringify(parameters || {}),
    JSON.stringify([{ timestamp: createdAt, stage: 'pending', message: '任务已创建，等待数据校验', type: 'info' }])
  );

  const sections = [
    { name: '武胜站', km: 120, wl: 183.14, gl: 188.50 },
    { name: '北碚站', km: 80, wl: 194.56, gl: 199.20 },
    { name: '罗渡溪站', km: 56, wl: 198.12, gl: 203.50 },
    { name: '渠县站', km: 40, wl: 181.36, gl: 187.00 },
  ];
  const insSec = db.prepare('INSERT INTO river_sections (id, task_id, name, river_km, warning_level, guaranteed_level) VALUES (?, ?, ?, ?, ?, ?)');
  sections.forEach((s, i) => insSec.run(`sec-${id}-${i}`, id, s.name, s.km, s.wl, s.gl));

  db.prepare('INSERT INTO approvals (id, task_id, status) VALUES (?, ?, ?)').run(uuid(), id, 'draft');

  const row = db.prepare('SELECT * FROM simulation_tasks WHERE id = ?').get(id);
  res.status(201).json(buildTask(row));
});

tasksRouter.patch('/:id/status', (req, res) => {
  const { status, progress } = req.body;
  db.prepare('UPDATE simulation_tasks SET status = ?, progress = ? WHERE id = ?').run(status, progress, req.params.id);
  const row = db.prepare('SELECT * FROM simulation_tasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '任务不存在' });
  res.json(buildTask(row));
});
