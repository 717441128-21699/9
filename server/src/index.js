import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initSchema } from './db.js';
import { seedDatabase } from './seed.js';
import { tasksRouter } from './routes/tasks.js';
import { alertsRouter } from './routes/alerts.js';
import { approvalsRouter } from './routes/approvals.js';
import { dispatchRouter } from './routes/dispatch.js';
import { statsRouter } from './routes/stats.js';
import { usersRouter } from './routes/users.js';
import { uploadRouter } from './routes/upload.js';
import { simulateRouter } from './routes/simulate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initSchema();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'HydraSim Pro', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', tasksRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/dispatch', dispatchRouter);
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/simulate', simulateRouter);

app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`\n🟢 HydraSim Pro 后端服务已启动：http://localhost:${PORT}`);
  console.log(`   API 健康检查：http://localhost:${PORT}/api/health\n`);
});
