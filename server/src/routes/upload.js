import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { db } from '../db.js';
import { parseDEM, parseSoilType, parseRainfall } from '../fileParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', 'data', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({ storage });

export const uploadRouter = Router();

uploadRouter.post('/file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '无文件上传' });
  const { taskId, type } = req.body;
  if (!taskId) return res.status(400).json({ error: '缺少任务ID' });
  const allowed = ['dem', 'soil', 'rainfall'];
  if (!allowed.includes(type)) return res.status(400).json({ error: '文件类型无效' });

  let parsed = null;
  try {
    if (type === 'dem') parsed = parseDEM(req.file.path);
    else if (type === 'soil') parsed = parseSoilType(req.file.path);
    else if (type === 'rainfall') parsed = parseRainfall(req.file.path);
  } catch (e) {
    console.error('File parse error:', e);
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO uploaded_files (id, task_id, name, type, size, storage_path, uploaded_at, status, parsed_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, taskId, req.file.originalname, type, req.file.size, req.file.path,
    new Date().toISOString(), parsed ? 'validated' : 'error',
    parsed ? JSON.stringify(parsed) : null
  );

  res.json({
    id,
    name: req.file.originalname,
    type,
    size: req.file.size,
    uploadedAt: new Date().toISOString(),
    status: parsed ? 'validated' : 'error',
    parsed,
  });
});

uploadRouter.get('/task/:taskId', (req, res) => {
  res.json(
    db.prepare('SELECT id, name, type, size, uploaded_at as uploadedAt, status, parsed_json as parsed FROM uploaded_files WHERE task_id = ?').all(req.params.taskId)
  );
});
