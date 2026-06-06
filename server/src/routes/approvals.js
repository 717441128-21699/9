import { Router } from 'express';
import { db } from '../db.js';
import { v4 as uuid } from 'uuid';

export const approvalsRouter = Router();

function rowToObj(r) {
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

approvalsRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM approvals ORDER BY status DESC').all().map(rowToObj));
});

approvalsRouter.post('/task/:taskId/engineer', (req, res) => {
  const { engineerId, engineerName, comment, score } = req.body;
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM approvals WHERE task_id = ?').get(req.params.taskId);
  if (!existing) {
    db.prepare('INSERT INTO approvals (id, task_id, status) VALUES (?, ?, ?)').run(uuid(), req.params.taskId, 'draft');
  }
  db.prepare(`
    UPDATE approvals SET engineer_id = ?, engineer_name = ?, engineer_comment = ?,
      engineer_approved_at = ?, accuracy_score = ?, status = 'chief_pending'
    WHERE task_id = ?
  `).run(engineerId || 'u-engineer', engineerName || '王工程师', comment || '', now, score ?? 0.85, req.params.taskId);
  const r = db.prepare('SELECT * FROM approvals WHERE task_id = ?').get(req.params.taskId);
  res.json(rowToObj(r));
});

approvalsRouter.post('/task/:taskId/chief', (req, res) => {
  const { chiefId, chiefName, comment } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE approvals SET chief_id = ?, chief_name = ?, chief_comment = ?,
      chief_approved_at = ?, status = 'approved'
    WHERE task_id = ?
  `).run(chiefId || 'u-chief', chiefName || '陈总工', comment || '', now, req.params.taskId);
  const r = db.prepare('SELECT * FROM approvals WHERE task_id = ?').get(req.params.taskId);
  res.json(rowToObj(r));
});

approvalsRouter.post('/task/:taskId/reject', (req, res) => {
  const { comment } = req.body;
  db.prepare(`
    UPDATE approvals SET chief_comment = ?, status = 'rejected'
    WHERE task_id = ?
  `).run(comment || '', req.params.taskId);
  const r = db.prepare('SELECT * FROM approvals WHERE task_id = ?').get(req.params.taskId);
  res.json(rowToObj(r));
});
