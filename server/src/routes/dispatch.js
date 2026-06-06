import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuid } from 'uuid';

export const dispatchRouter = Router();

function rowToPlan(r) {
  return {
    id: r.id,
    taskId: r.task_id,
    taskName: r.task_name,
    alertId: r.alert_id,
    type: r.type,
    reservoirName: r.reservoir_name,
    releaseRate: r.release_rate,
    diversionArea: r.diversion_area,
    diversionVolume: r.diversion_volume,
    estimatedEffect: r.estimated_effect,
    createdAt: r.created_at,
    status: r.status,
  };
}

dispatchRouter.get('/plans', (req, res) => {
  res.json(db.prepare('SELECT * FROM dispatch_plans ORDER BY created_at DESC').all().map(rowToPlan));
});

dispatchRouter.post('/plans', (req, res) => {
  const { taskId, taskName, alertId, type, reservoirName, releaseRate, diversionArea, diversionVolume, estimatedEffect } = req.body;
  const id = uuid();
  db.prepare(`
    INSERT INTO dispatch_plans (id, task_id, task_name, alert_id, type, reservoir_name,
      release_rate, diversion_area, diversion_volume, estimated_effect, created_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, taskId, taskName, alertId || null, type || 'reservoir', reservoirName || null,
    releaseRate || 0, diversionArea || null, diversionVolume || 0,
    estimatedEffect || '', new Date().toISOString(), 'draft');
  const r = db.prepare('SELECT * FROM dispatch_plans WHERE id = ?').get(id);
  res.status(201).json(rowToPlan(r));
});

dispatchRouter.patch('/plans/:id', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE dispatch_plans SET status = ? WHERE id = ?').run(status, req.params.id);
  const r = db.prepare('SELECT * FROM dispatch_plans WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: '方案不存在' });
  res.json(rowToPlan(r));
});

dispatchRouter.get('/rules', (req, res) => {
  res.json(
    db.prepare('SELECT * FROM dispatch_rules ORDER BY confidence DESC').all().map((r) => ({
      id: r.id,
      name: r.name,
      basinName: r.basin_name,
      triggerCondition: r.trigger_condition,
      action: r.action,
      confidence: r.confidence,
      usageCount: r.usage_count,
      lastUsedAt: r.last_used_at,
    }))
  );
});

dispatchRouter.post('/rules/:id/use', (req, res) => {
  db.prepare('UPDATE dispatch_rules SET usage_count = usage_count + 1, last_used_at = ? WHERE id = ?')
    .run(new Date().toISOString(), req.params.id);
  const r = db.prepare('SELECT * FROM dispatch_rules WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: '规则不存在' });
  res.json({
    id: r.id,
    name: r.name,
    basinName: r.basin_name,
    triggerCondition: r.trigger_condition,
    action: r.action,
    confidence: r.confidence,
    usageCount: r.usage_count,
    lastUsedAt: r.last_used_at,
  });
});
