import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'hydrasim-store.json');

let state = null;

const defaultState = () => ({
  users: [],
  tasks: [],
  files: [],
  sections: [],
  alerts: [],
  approvals: [],
  dispatchPlans: [],
  dispatchRules: [],
  dailyStats: [],
  sectionSeries: [],
});

function ensure() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    state = defaultState();
    save();
  } else if (!state) {
    try {
      state = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    } catch (e) {
      state = defaultState();
      save();
    }
  }
}

function save() {
  fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf8');
}

export function getState() { ensure(); return state; }
export function commit() { ensure(); save(); }
export function reset() { state = defaultState(); save(); }

function table(name) { ensure(); return state[name]; }
function setTable(name, arr) { ensure(); state[name] = arr; save(); }

export const db = {
  all(sql, ...params) {
    ensure();
    const s = sql.replace(/\s+/g, ' ').trim();

    function fromTable() {
      const m = s.match(/FROM\s+(\w+)/i);
      return m ? m[1].toLowerCase() : null;
    }

    function whereClause() {
      const idx = s.search(/WHERE/i);
      return idx >= 0 ? s.slice(idx) : '';
    }

    const tbl = fromTable();
    const wc = whereClause();

    let data = [];
    if (tbl === 'users') data = state.users;
    else if (tbl === 'simulation_tasks') data = state.tasks;
    else if (tbl === 'uploaded_files') data = state.files;
    else if (tbl === 'river_sections') data = state.sections;
    else if (tbl === 'alerts') data = state.alerts;
    else if (tbl === 'approvals') data = state.approvals;
    else if (tbl === 'dispatch_plans') data = state.dispatchPlans;
    else if (tbl === 'dispatch_rules') data = state.dispatchRules;
    else if (tbl === 'daily_stats') data = state.dailyStats;
    else if (tbl === 'section_time_series') data = state.sectionSeries;

    if (wc.includes('task_id = ?') || wc.includes('task_id=?')) {
      data = data.filter((x) => x.task_id === params[0]);
    } else if (wc.includes('section_id = ?') || wc.includes('section_id=?')) {
      data = data.filter((x) => x.section_id === params[0]);
    } else if (wc.includes('reviewed = ?') || wc.includes('reviewed=?')) {
      const flag = params[0];
      data = data.filter((x) => (flag === 1 ? x.reviewed : !x.reviewed));
    } else if (wc.includes("type = 'rainfall'")) {
      data = data.filter((x) => x.task_id === params[0] && x.type === 'rainfall').sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
    } else if (wc.includes("type = 'dem'")) {
      data = data.filter((x) => x.task_id === params[0] && x.type === 'dem').sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
    } else if (wc.includes('basin_name = ?') && wc.includes('status')) {
      data = data.filter((x) => x.basin_name === params[0] && x.status === 'completed' && x.result_json).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
    }

    if (s.includes('ORDER BY')) {
      const m = s.match(/ORDER BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
      if (m) {
        const col = m[1];
        const dir = (m[2] || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
        data = [...data].sort((a, b) => {
          if (a[col] < b[col]) return -1 * dir;
          if (a[col] > b[col]) return 1 * dir;
          return 0;
        });
      }
    }
    return data;
  },
  get(sql, ...params) {
    ensure();
    const s = sql.replace(/\s+/g, ' ').trim();
    if (s.startsWith('SELECT COUNT')) {
      if (s.includes('FROM users')) return { c: state.users.length };
      if (s.includes('FROM simulation_tasks')) return { c: state.tasks.length };
      return { c: 0 };
    }
    const all = db.all(sql, ...params);
    return all[0] ?? null;
  },
  prepare(sql) {
    ensure();
    const s = sql.replace(/\s+/g, ' ').trim();
    return {
      run(...params) {
        if (s.startsWith('INSERT INTO users')) {
          const [id, name, role, email] = params;
          state.users.push({ id, name, role, email, avatar: null });
          save();
        } else if (s.startsWith('INSERT INTO simulation_tasks')) {
          const [id, name, basinName, basinArea, createdAt, status, progress, rp, tw, pJson, rJson, dev, logs] = params;
          state.tasks.push({
            id, name, basin_name: basinName, basin_area: basinArea,
            created_at: createdAt, status, progress, rainfall_return_period: rp,
            time_window: tw, parameters_json: pJson, result_json: rJson,
            deviation_rate: dev, logs_json: logs,
          });
          save();
        } else if (s.startsWith('INSERT INTO uploaded_files')) {
          const [id, taskId, name, type, size, storagePath, uploadedAt, status, parsedJson] = params;
          state.files.push({
            id, task_id: taskId, name, type, size, storage_path: storagePath,
            uploaded_at: uploadedAt, status, parsed_json: parsedJson,
          });
          save();
        } else if (s.startsWith('INSERT INTO river_sections')) {
          const [id, taskId, name, km, wl, gl] = params;
          state.sections.push({ id, task_id: taskId, name, river_km: km, warning_level: wl, guaranteed_level: gl });
          save();
        } else if (s.startsWith('INSERT INTO alerts')) {
          const [id, taskId, secId, secName, lvl, type, val, threshold, triggered, reviewed] = params;
          state.alerts.push({
            id, task_id: taskId, section_id: secId, section_name: secName, level: lvl,
            type, value: val, threshold, triggered_at: triggered, reviewed,
            reviewed_by: null, reviewed_at: null, review_comment: null,
          });
          save();
        } else if (s.startsWith('INSERT INTO approvals')) {
          const [id, taskId, engId, engName, engComment, engApprAt, score, chId, chName, chComment, chApprAt, status] = params;
          state.approvals.push({
            id, task_id: taskId, engineer_id: engId, engineer_name: engName,
            engineer_comment: engComment, engineer_approved_at: engApprAt,
            accuracy_score: score ?? 0, chief_id: chId, chief_name: chName,
            chief_comment: chComment, chief_approved_at: chApprAt, status: status || 'draft',
          });
          save();
        } else if (s.startsWith('INSERT INTO dispatch_plans')) {
          const [id, taskId, taskName, alertId, type, resName, rate, divArea, divVol, effect, createdAt, status] = params;
          state.dispatchPlans.push({
            id, task_id: taskId, task_name: taskName, alert_id: alertId, type,
            reservoir_name: resName, release_rate: rate, diversion_area: divArea,
            diversion_volume: divVol, estimated_effect: effect, created_at: createdAt, status,
          });
          save();
        } else if (s.startsWith('INSERT INTO dispatch_rules')) {
          const [id, name, basin, trigger, action, conf, useCnt, lastUsed] = params;
          state.dispatchRules.push({
            id, name, basin_name: basin, trigger_condition: trigger, action,
            confidence: conf, usage_count: useCnt, last_used_at: lastUsed,
          });
          save();
        } else if (s.startsWith('INSERT INTO daily_stats')) {
          const [date, total, completed, cr, alt, fa, alertsCnt] = params;
          state.dailyStats.push({
            date, total_tasks: total, completed_tasks: completed, completion_rate: cr,
            avg_lead_time: alt, forecast_accuracy: fa, alerts_count: alertsCnt,
          });
          save();
        } else if (s.startsWith('INSERT INTO section_time_series')) {
          const [secId, time, wl, disc] = params;
          state.sectionSeries.push({ section_id: secId, time, water_level: wl, discharge: disc });
          save();
        } else if (s.startsWith('UPDATE simulation_tasks SET status = ?, progress = ?') && !s.includes('logs_json')) {
          const [status, progress, id] = params;
          state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, status, progress } : t));
          save();
        } else if (s.startsWith('UPDATE simulation_tasks SET status = ?, progress = ?, logs_json = ?')) {
          const [status, progress, logs, id] = params;
          state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, status, progress, logs_json: logs } : t));
          save();
        } else if (s.startsWith('UPDATE simulation_tasks SET logs_json')) {
          const [logs, id] = params;
          state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, logs_json: logs } : t));
          save();
        } else if (s.startsWith("UPDATE simulation_tasks SET status = 'completed'")) {
          const [resultJson, dev, id] = params;
          state.tasks = state.tasks.map((t) => (t.id === id ? { ...t, status: 'completed', progress: 100, result_json: resultJson, deviation_rate: dev } : t));
          save();
        } else if (s.startsWith('UPDATE alerts SET reviewed')) {
          const [reviewedBy, reviewedAt, comment, id] = params;
          state.alerts = state.alerts.map((a) => (a.id === id ? { ...a, reviewed: 1, reviewed_by: reviewedBy, reviewed_at: reviewedAt, review_comment: comment } : a));
          save();
        } else if (s.startsWith("UPDATE approvals SET engineer_id = ?, engineer_name = ?, engineer_comment = ?")) {
          const [engId, engName, comment, at, score, taskId] = params;
          state.approvals = state.approvals.map((a) => a.task_id === taskId ? { ...a, engineer_id: engId, engineer_name: engName, engineer_comment: comment, engineer_approved_at: at, accuracy_score: score, status: 'chief_pending' } : a);
          save();
        } else if (s.startsWith("UPDATE approvals SET chief_id = ?, chief_name = ?, chief_comment = ?")) {
          if (s.includes("status = 'approved'")) {
            const [chId, chName, comment, at, taskId] = params;
            state.approvals = state.approvals.map((a) => a.task_id === taskId ? { ...a, chief_id: chId, chief_name: chName, chief_comment: comment, chief_approved_at: at, status: 'approved' } : a);
          } else {
            const [comment, taskId] = params;
            state.approvals = state.approvals.map((a) => a.task_id === taskId ? { ...a, chief_comment: comment, status: 'rejected' } : a);
          }
          save();
        } else if (s.startsWith('UPDATE dispatch_plans SET status')) {
          const [status, id] = params;
          state.dispatchPlans = state.dispatchPlans.map((p) => (p.id === id ? { ...p, status } : p));
          save();
        } else if (s.startsWith('UPDATE dispatch_rules SET usage_count')) {
          const [at, id] = params;
          state.dispatchRules = state.dispatchRules.map((r) => r.id === id ? { ...r, usage_count: r.usage_count + 1, last_used_at: at } : r);
          save();
        }
        return { lastInsertRowid: 1, changes: 1 };
      },
      all(...params) {
        return db.all(sql, ...params);
      },
      get(...params) {
        return db.get(sql, ...params);
      },
    };
  },
  pragma() {},
  exec() {},
};

export function initSchema() { ensure(); }
