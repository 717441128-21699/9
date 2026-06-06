import { db, initSchema, reset } from './src/db.js';
import { seedDatabase } from './src/seed.js';

initSchema();
reset();

try {
  seedDatabase();
  console.log('Seed completed');
  console.log('users:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
  console.log('tasks:', db.prepare('SELECT COUNT(*) as c FROM simulation_tasks').get().c);
  console.log('alerts:', db.prepare('SELECT COUNT(*) as c FROM alerts').get().c);
  console.log('rules:', db.prepare('SELECT COUNT(*) as c FROM dispatch_rules').get().c);
  console.log('dailyStats:', db.prepare('SELECT COUNT(*) as c FROM daily_stats').get().c);
  console.log('sections:', db.prepare('SELECT COUNT(*) as c FROM river_sections').get().c);
  console.log('approvals:', db.prepare('SELECT COUNT(*) as c FROM approvals').get().c);
  console.log('plans:', db.prepare('SELECT COUNT(*) as c FROM dispatch_plans').get().c);
} catch (e) {
  console.error('Seed failed:', e);
}
