import { db } from './db.js';
import { v4 as uuid } from 'uuid';

export function seedDatabase() {
  const users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (users > 0) return;

  const now = new Date().toISOString();

  const userList = [
    { id: 'u-hydrologist', name: '李值班', role: 'hydrologist', email: 'lizhiban@water.gov.cn' },
    { id: 'u-engineer', name: '王工程师', role: 'engineer', email: 'wanggcs@water.gov.cn' },
    { id: 'u-chief', name: '陈总工', role: 'chief', email: 'chenzg@water.gov.cn' },
    { id: 'u-commander', name: '赵指挥', role: 'commander', email: 'zhaozh@water.gov.cn' },
    { id: 'u-scientist', name: '孙首席', role: 'scientist', email: 'sunshouxi@water.gov.cn' },
    { id: 'u-admin', name: '张明华', role: 'admin', email: 'zhangmh@water.gov.cn' },
  ];
  const insertUser = db.prepare(
    'INSERT INTO users (id, name, role, email) VALUES (?, ?, ?, ?)'
  );
  for (const u of userList) insertUser.run(u.id, u.name, u.role, u.email);

  const basinNames = ['嘉陵江武胜段', '涪江北碚段', '渠江罗渡溪段', '渠江渠县段', '琼江潼南段'];
  const insertTask = db.prepare(`
    INSERT INTO simulation_tasks
    (id, name, basin_name, basin_area, created_at, status, progress, rainfall_return_period,
     time_window, parameters_json, result_json, deviation_rate, logs_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertApproval = db.prepare(`
    INSERT INTO approvals (id, task_id, engineer_id, engineer_name, engineer_comment,
      engineer_approved_at, accuracy_score, chief_id, chief_name, chief_comment,
      chief_approved_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSection = db.prepare(`
    INSERT INTO river_sections (id, task_id, name, river_km, warning_level, guaranteed_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertAlert = db.prepare(`
    INSERT INTO alerts (id, task_id, section_id, section_name, level, type, value, threshold,
      triggered_at, reviewed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRule = db.prepare(`
    INSERT INTO dispatch_rules (id, name, basin_name, trigger_condition, action, confidence,
      usage_count, last_used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPlan = db.prepare(`
    INSERT INTO dispatch_plans (id, task_id, task_name, alert_id, type, reservoir_name,
      release_rate, diversion_area, diversion_volume, estimated_effect, created_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sectionDefs = [
    { name: '武胜站', km: 120, wl: 183.14, gl: 188.50 },
    { name: '北碚站', km: 80, wl: 194.56, gl: 199.20 },
    { name: '罗渡溪站', km: 56, wl: 198.12, gl: 203.50 },
    { name: '渠县站', km: 40, wl: 181.36, gl: 187.00 },
  ];

  for (let i = 0; i < 10; i++) {
    const basinIdx = i % basinNames.length;
    const basin = basinNames[basinIdx];
    const status = ['completed', 'completed', 'completed', 'calculating', 'routing',
      'preprocessing', 'meshing', 'pending', 'completed', 'error'][i];
    const returnPeriod = [50, 100, 20, 10, 5, 100, 50, 20, 10, 30][i];
    const area = [23500, 15800, 8700, 11200, 4300][basinIdx];
    const progress = status === 'completed' ? 100 : status === 'error' ? 62 :
      status === 'calculating' ? 68 : status === 'routing' ? 82 :
      status === 'preprocessing' ? 18 : status === 'meshing' ? 35 : 5;

    const created = new Date(Date.now() - (10 - i) * 3600 * 1000 * 6).toISOString();

    const params = {
      demResolution: 30,
      soilType: '壤土',
      cnValue: 72 + (i % 4) * 3,
      initialLoss: 8,
      recessionCoefficient: 0.92,
      routingVelocity: 2.0,
      manningN: 0.04,
    };

    const peak = returnPeriod * 180 + (i * 37) % 500;
    const result = status === 'completed' ? JSON.stringify({
      id: `r-${i}`,
      taskId: `task-${i}`,
      peakDischarge: peak,
      peakTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      totalRunoffDepth: Math.round(returnPeriod * 3.2 * 10) / 10,
      floodVolume: Math.round(peak * 3.6 * 10) / 10,
      inundationArea: Math.round(area * 0.12 * 10) / 10,
      hydrograph: Array.from({ length: 72 }, (_, t) => ({
        time: new Date(Date.now() - (72 - t) * 3600 * 1000).toISOString(),
        value: Math.round(peak * Math.exp(-Math.pow((t - 30) / 10, 2)) * 10) / 10,
      })),
      inundationMap: Array.from({ length: 25 }, (_, idx) => ({
        x: idx % 5, y: Math.floor(idx / 5),
        depth: Math.round((Math.random() * 3 + 0.3) * 100) / 100,
      })),
      peakProbability: [
        { range: '<500', probability: 0.08, count: 2 },
        { range: '500-1000', probability: 0.22, count: 5 },
        { range: '1000-2000', probability: 0.41, count: 9 },
        { range: '2000-3000', probability: 0.20, count: 4 },
        { range: '>3000', probability: 0.09, count: 2 },
      ],
      completedAt: new Date().toISOString(),
    }) : null;

    const deviation = [0.08, 0.23, 0.12, null, null, null, null, null, 0.05, null][i];
    const logs = JSON.stringify([
      { timestamp: created, stage: 'pending', message: '任务已创建', type: 'info' },
      ...(status !== 'pending' ? [{
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        stage: 'preprocessing',
        message: '数据预处理完成，已校验 DEM 与土壤文件',
        type: 'success',
      }] : []),
      ...(status === 'error' ? [{
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        stage: 'calculating',
        message: '径流计算失败：降雨序列缺失关键时段数据',
        type: 'error',
      }] : []),
      ...(status === 'completed' ? [{
        timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        stage: 'completed',
        message: `模拟完成，洪峰流量 ${peak} m³/s`,
        type: 'success',
      }] : []),
    ]);

    const taskId = `task-${i}`;
    insertTask.run(
      taskId,
      `${basin}·${returnPeriod}年一遇模拟`,
      basin,
      area,
      created,
      status,
      progress,
      returnPeriod,
      '2026-06-01 ~ 2026-06-04',
      JSON.stringify(params),
      result,
      deviation,
      logs
    );

    sectionDefs.forEach((sd, si) => {
      const secId = `sec-${i}-${si}`;
      insertSection.run(secId, taskId, sd.name, sd.km, sd.wl, sd.gl);

      if (status === 'completed' && i < 4) {
        const shouldAlert = (i + si) % 2 === 0;
        if (shouldAlert) {
          const lvl = ['blue', 'yellow', 'orange', 'red'][(i + si) % 4];
          const val = sd.wl + [0.5, 1.2, 2.0, 3.2][(i + si) % 4];
          insertAlert.run(
            `alert-${i}-${si}`,
            taskId,
            secId,
            sd.name,
            lvl,
            si % 2 === 0 ? 'water_level' : 'rising_rate',
            Math.round(val * 100) / 100,
            sd.wl,
            new Date(Date.now() - (si + 1) * 1800 * 1000).toISOString(),
            i > 1 ? 1 : 0
          );
        }
      }
    });

    if (status === 'completed' && i < 6) {
      const approvalStatus = ['approved', 'approved', 'chief_pending', 'engineer_pending',
        'approved', 'rejected'][i];
      insertApproval.run(
        `appr-${i}`,
        taskId,
        'u-engineer',
        '王工程师',
        '模型Nash效率系数0.87，模拟精度良好',
        new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        0.85 + (i % 5) * 0.02,
        approvalStatus === 'approved' || approvalStatus === 'rejected' ? 'u-chief' : null,
        approvalStatus === 'approved' || approvalStatus === 'rejected' ? '陈总工' : null,
        approvalStatus === 'rejected' ? '土壤参数需重新标定，请复核' : '精度符合要求，同意入库',
        approvalStatus === 'approved' || approvalStatus === 'rejected'
          ? new Date(Date.now() - 2 * 3600 * 1000).toISOString() : null,
        approvalStatus
      );
    }

    if (status === 'completed' && i < 3) {
      insertPlan.run(
        `plan-${i}`,
        taskId,
        `${basin}·${returnPeriod}年一遇模拟`,
        `alert-${i}-0`,
        i % 2 === 0 ? 'reservoir' : 'flood_diversion',
        i % 2 === 0 ? '草街水库' : null,
        i % 2 === 0 ? 1200 + i * 50 : 0,
        i % 2 !== 0 ? '太和分洪区' : null,
        i % 2 !== 0 ? 800 + i * 100 : 0,
        i % 2 === 0
          ? '预计将武胜站水位降低 0.8-1.2m'
          : '预计分洪量约 800 万 m³，降低北碚站水位 0.6m',
        new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        ['approved', 'chief_pending', 'draft'][i]
      );
    }
  }

  const rules = [
    { name: '北碚站超警调度', basin: '涪江北碚段',
      trigger: '北碚站水位≥194.56m', action: '草街水库控泄≤1500m³/s', conf: 0.91 },
    { name: '武胜站分洪预案', basin: '嘉陵江武胜段',
      trigger: '武胜站水位≥188.50m', action: '启用太和分洪区', conf: 0.87 },
    { name: '渠江双控调度', basin: '渠江罗渡溪段',
      trigger: '罗渡溪站上涨速率≥1.0m/h', action: '减小江口水库下泄+启动预泄', conf: 0.83 },
    { name: '渠县站应急调度', basin: '渠江渠县段',
      trigger: '渠县站水位≥187.00m', action: '上游水库联合错峰', conf: 0.79 },
    { name: '琼江梯级调度', basin: '琼江潼南段',
      trigger: '潼南站流量≥800m³/s', action: '梯级水库削峰调度', conf: 0.74 },
  ];
  rules.forEach((r, i) => {
    insertRule.run(
      `rule-${i}`,
      r.name,
      r.basin,
      r.trigger,
      r.action,
      r.conf,
      8 + i * 3,
      new Date(Date.now() - i * 86400 * 1000).toISOString()
    );
  });

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    db.prepare(`
      INSERT INTO daily_stats (date, total_tasks, completed_tasks, completion_rate,
        avg_lead_time, forecast_accuracy, alerts_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      dateStr,
      8 + (i % 3),
      6 + (i % 2),
      0.72 + (i % 4) * 0.05,
      3.2 + (i % 3) * 0.5,
      0.78 + (i % 3) * 0.04,
      3 + (i % 4) * 2
    );
  }

  console.log('[Seed] 数据库初始化完成，已写入种子数据。');
}
