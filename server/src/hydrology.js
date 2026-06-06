import { db } from './db.js';

export function hydrologicSCSCN(rainfallSeries, cnValue, areaKm2, initialLoss = 0) {
  const S = Math.max(10, (25400 / cnValue) - 254);
  const Ia = initialLoss > 0 ? initialLoss : 0.2 * S;

  let cumP = 0;
  let prevCumPe = 0;
  const excess = [];
  for (let i = 0; i < rainfallSeries.length; i++) {
    const pt = rainfallSeries[i];
    cumP += pt.value;
    let cumPe = 0;
    if (cumP > Ia) {
      cumPe = Math.pow(cumP - Ia, 2) / (cumP - Ia + S);
    }
    const hourlyPe = Math.max(0, cumPe - prevCumPe);
    excess.push({ time: pt.time, value: Math.round(hourlyPe * 1000) / 1000 });
    prevCumPe = cumPe;
  }
  return excess;
}

export function unitHydrographUH(totalHours, peakTimeHours = 6) {
  const dt = 1;
  const uh = [];
  const tp = peakTimeHours;
  const tb = Math.max(tp * 3, totalHours + 6);
  const qp = 2.08 / tb;
  for (let t = 0; t <= totalHours + tb; t += dt) {
    let q;
    if (t <= tp) {
      const x = t / tp;
      q = qp * Math.pow(x, 1.5) * (2 - Math.pow(x, 1.5));
    } else if (t <= tb) {
      const x = (t - tp) / (tb - tp);
      q = qp * Math.pow(1 - x, 2);
    } else {
      q = 0;
    }
    uh.push({ time: t, value: Math.max(0, isFinite(q) ? q : 0) });
  }
  const sum = uh.reduce((a, b) => a + b.value, 0) * dt;
  if (sum > 0) {
    for (let i = 0; i < uh.length; i++) uh[i].value = uh[i].value / sum;
  }
  return uh;
}

export function convolve(excessRainfall, unitHydrograph, areaKm2) {
  const er = excessRainfall.map((x) => x.value);
  const uh = unitHydrograph.map((u) => u.value);
  const nE = er.length;
  const nU = uh.length;
  const nY = nE + nU - 1;
  const result = new Array(nY).fill(0);
  for (let i = 0; i < nE; i++) {
    for (let j = 0; j < nU; j++) {
      result[i + j] += er[i] * uh[j];
    }
  }
  const convertFactor = areaKm2 / 3.6;
  return result.map((v, i) => ({
    time: excessRainfall[Math.min(i, nE - 1)]?.time ?? `T+${i}h`,
    discharge: Math.max(0, Math.round(v * convertFactor * 10) / 10),
  }));
}

export function computeWaterLevel(discharge, section) {
  const baseQ = 50;
  const baseLevel = section.warningLevel - 3;
  if (discharge <= baseQ) return baseLevel;
  const level = baseLevel + 0.8 * Math.log2(discharge / baseQ + 1);
  return Math.round(level * 100) / 100;
}

export function generateRainfallSeries(returnPeriod, hours = 72, seed = 1) {
  let s = seed || 1;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const total24h = 40 + returnPeriod * 5;
  const peakHour = Math.floor(hours * 0.35);
  const sigma = hours * 0.12;
  const scale = total24h / (sigma * Math.sqrt(2 * Math.PI)) * 3.0;
  const series = [];
  const start = new Date();
  start.setMinutes(0, 0, 0);
  for (let i = 0; i < hours; i++) {
    const diff = i - peakHour;
    const base = scale * Math.exp(-(diff * diff) / (2 * sigma * sigma));
    const noise = (rand() - 0.5) * base * 0.15;
    const t = new Date(start.getTime() + i * 3600 * 1000);
    series.push({
      time: t.toISOString(),
      value: Math.max(0, Math.round((base + noise) * 100) / 100),
    });
  }
  return series;
}

export function detectAlerts(hydrograph, sections) {
  const alerts = [];
  sections.forEach((sec) => {
    let prevLevel = null;
    let maxRisingRate = 0;
    let maxLevel = 0;
    let maxLevelTime = null;
    let maxRateTime = null;

    hydrograph.forEach((pt, idx) => {
      const lvl = computeWaterLevel(pt.discharge, sec);
      if (lvl > maxLevel) {
        maxLevel = lvl;
        maxLevelTime = pt.time;
      }
      if (prevLevel !== null && idx > 0) {
        const rate = (lvl - prevLevel);
        if (rate > maxRisingRate) {
          maxRisingRate = rate;
          maxRateTime = pt.time;
        }
      }
      prevLevel = lvl;
    });

    const gl = sec.guaranteedLevel;
    const wl = sec.warningLevel;

    if (maxLevel >= gl) {
      alerts.push({
        sectionId: sec.id,
        sectionName: sec.name,
        level: 'red',
        type: 'water_level',
        value: maxLevel,
        threshold: gl,
        triggeredAt: maxLevelTime,
      });
    } else if (maxLevel >= (wl + (gl - wl) * 0.7)) {
      alerts.push({
        sectionId: sec.id,
        sectionName: sec.name,
        level: 'orange',
        type: 'water_level',
        value: maxLevel,
        threshold: wl,
        triggeredAt: maxLevelTime,
      });
    } else if (maxLevel >= (wl + (gl - wl) * 0.3)) {
      alerts.push({
        sectionId: sec.id,
        sectionName: sec.name,
        level: 'yellow',
        type: 'water_level',
        value: maxLevel,
        threshold: wl,
        triggeredAt: maxLevelTime,
      });
    } else if (maxLevel >= wl) {
      alerts.push({
        sectionId: sec.id,
        sectionName: sec.name,
        level: 'blue',
        type: 'water_level',
        value: maxLevel,
        threshold: wl,
        triggeredAt: maxLevelTime,
      });
    }

    if (maxRisingRate >= 0.8) {
      alerts.push({
        sectionId: sec.id,
        sectionName: sec.name,
        level: maxRisingRate >= 1.5 ? 'red' : maxRisingRate >= 1.2 ? 'orange' : 'yellow',
        type: 'rising_rate',
        value: Math.round(maxRisingRate * 100) / 100,
        threshold: 0.8,
        triggeredAt: maxRateTime,
      });
    }
  });
  return alerts;
}

export function computePeakDeviation(basinName, currentPeak) {
  const rows = db
    .prepare(
      `SELECT result_json FROM simulation_tasks
       WHERE basin_name = ? AND status = 'completed' AND result_json IS NOT NULL
       ORDER BY created_at DESC LIMIT 3`
    )
    .all(basinName);
  if (rows.length === 0) return { deviation: 0, recentPeaks: [], pauseRecommended: false };
  const peaks = rows.map((r) => JSON.parse(r.result_json).peakDischarge);
  const avg = peaks.reduce((a, b) => a + b, 0) / peaks.length;
  const deviation = avg > 0 ? Math.abs(currentPeak - avg) / avg : 0;
  let pauseRecommended = false;
  if (peaks.length >= 3) {
    const deviations = peaks.map((p) => (avg > 0 ? Math.abs(p - avg) / avg : 0));
    if (deviations.every((d) => d > 0.2)) pauseRecommended = true;
  }
  return {
    deviation: Math.round(deviation * 1000) / 1000,
    recentPeaks: peaks,
    pauseRecommended,
  };
}
