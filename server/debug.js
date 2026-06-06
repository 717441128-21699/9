import { db, initSchema, reset } from './src/db.js';

initSchema();
reset();

console.log('Starting seed test...');
console.log('Users count before:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);

const id = 'test-task-1';
const sql = `INSERT INTO simulation_tasks (id, name, basin_name, basin_area, created_at, status, progress, rainfall_return_period, time_window, parameters_json, result_json, deviation_rate, logs_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

console.log('SQL starts with INSERT INTO simulation_tasks?', sql.startsWith('INSERT INTO simulation_tasks'));

try {
  db.prepare(sql).run(
    id, 'test name', 'test basin', 1000, new Date().toISOString(),
    'pending', 5, 10, 'tw', '{}', null, null, '[]'
  );
  console.log('Inserted OK, now tasks count:', db.prepare('SELECT COUNT(*) as c FROM simulation_tasks').get().c);
  const rows = db.all('SELECT * FROM simulation_tasks');
  console.log('Rows:', JSON.stringify(rows, null, 2));
} catch (e) {
  console.error('Insert error:', e);
}
