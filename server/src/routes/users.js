import { Router } from 'express';
import { db } from '../db.js';

export const usersRouter = Router();

usersRouter.get('/', (req, res) => {
  res.json(db.prepare('SELECT id, name, role, email, avatar FROM users').all());
});

usersRouter.get('/current', (req, res) => {
  const r = db.prepare("SELECT id, name, role, email, avatar FROM users WHERE role = 'admin'").get();
  res.json(r || { id: 'u-admin', name: '系统管理员', role: 'admin', email: 'admin@water.gov.cn' });
});
