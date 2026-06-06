import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuid } from 'uuid';

export const alertsRouter = Router();

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

alertsRouter.get('/', (req, res) => {
  const { reviewed } = req.query;
  let sql = 'SELECT * FROM alerts';
  const params = [];
  if (reviewed !== undefined) {
    sql += ' WHERE reviewed = ?';
    params.push(reviewed === 'true' ? 1 : 0);
  }
  sql += ' ORDER BY triggered_at DESC';
  res.json(db.prepare(sql).all(...params).map(alertRowToObj));
});

alertsRouter.post('/:id/review', (req, res) => {
  const { reviewedBy, comment } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE alerts SET reviewed = 1, reviewed_by = ?, reviewed_at = ?, review_comment = ?
    WHERE id = ?
  `).run(reviewedBy || '未知', now, comment || '', req.params.id);
  const r = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: '预警不存在' });
  res.json(alertRowToObj(r));
});
