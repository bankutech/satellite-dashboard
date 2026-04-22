/**
 * data.js — Preloaded satellite datasets
 * Simulates telemetry from NASA, ISRO, ESA, and JAXA satellites
 */

const SAT_COLORS = {
  'SAT-A': { color: '#00d4ff', bg: 'rgba(0,212,255,0.15)', label: 'ISRO NavIC-1A', icon: '🛰' },
  'SAT-B': { color: '#a855f7', bg: 'rgba(168,85,247,0.15)', label: 'NASA Terra-7', icon: '🛰' },
  'SAT-C': { color: '#ff6b35', bg: 'rgba(255,107,53,0.15)', label: 'ESA Sentinel-6', icon: '🛰' },
  'SAT-D': { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'JAXA GCOM-W2', icon: '🛰' },
};

function generateSatData(satId, startHour, count, fields) {
  const records = [];
  const baseTime = new Date('2024-06-01T00:00:00Z');
  baseTime.setHours(startHour);

  for (let i = 0; i < count; i++) {
    const t = new Date(baseTime.getTime() + i * (Math.random() * 600000 + 300000)); // 5–15 min intervals
    const record = { timestamp: t.toISOString(), satellite: satId };

    fields.forEach(f => {
      record[f.key] = +(f.base + (Math.random() - 0.5) * f.range + Math.sin(i * 0.3) * f.wave).toFixed(2);
    });

    records.push(record);
  }

  return records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

// Preloaded data per satellite
const PRELOADED_DATA = {
  'SAT-A': generateSatData('SAT-A', 0, 120, [
    { key: 'temperature', base: 28, range: 12, wave: 4 },
    { key: 'humidity',    base: 65, range: 20, wave: 8 },
    { key: 'altitude_km', base: 550, range: 5, wave: 2 },
  ]),
  'SAT-B': generateSatData('SAT-B', 0, 95, [
    { key: 'rainfall_mm', base: 3.5, range: 8, wave: 2 },
    { key: 'pressure_hpa', base: 1013, range: 15, wave: 6 },
    { key: 'altitude_km', base: 705, range: 3, wave: 1 },
  ]),
  'SAT-C': generateSatData('SAT-C', 0, 108, [
    { key: 'wind_kmh',   base: 45, range: 30, wave: 15 },
    { key: 'uv_index',  base: 6, range: 5, wave: 3 },
    { key: 'altitude_km', base: 800, range: 4, wave: 1.5 },
  ]),
  'SAT-D': generateSatData('SAT-D', 0, 87, [
    { key: 'sea_surface_temp', base: 27, range: 8, wave: 3 },
    { key: 'salinity_ppt',    base: 35, range: 4, wave: 1.5 },
    { key: 'altitude_km',     base: 600, range: 6, wave: 2 },
  ]),
};

// Disaster simulation datasets
const DISASTER_DATA = {
  cyclone: {
    label: 'Cyclone Track — Bay of Bengal',
    datasets: [
      {
        name: 'Wind Speed (km/h)',
        data: [40, 55, 72, 95, 118, 145, 168, 185, 200, 195, 180, 155, 120, 90, 65, 42],
        color: '#ff6b35', fill: true,
      },
      {
        name: 'Rainfall (mm/hr)',
        data: [5, 8, 14, 22, 40, 65, 80, 95, 88, 75, 60, 45, 32, 20, 12, 6],
        color: '#00d4ff', fill: false,
      },
      {
        name: 'Pressure (hPa - 900)',
        data: [108, 105, 100, 94, 86, 75, 62, 55, 54, 56, 61, 68, 78, 88, 98, 107],
        color: '#a855f7', fill: false,
      },
    ],
    labels: ['H-72', 'H-60', 'H-48', 'H-36', 'H-30', 'H-24', 'H-18', 'H-12', 'H-6', 'Landfall', 'H+6', 'H+12', 'H+18', 'H+24', 'H+36', 'H+48'],
    alerts: [
      { level: 'high', msg: '🌪 SEVERE: Wind speed breached 185 km/h at H-12 — Category 4 equivalent' },
      { level: 'high', msg: '🌊 WARNING: Storm surge predicted 3.5m — Coastal evacuation advised' },
      { level: 'med',  msg: '🌧 ALERT: Heavy rainfall exceeding 95mm/hr detected at landfall zone' },
      { level: 'low',  msg: '✅ ADVISORY: Cyclone weakening post-landfall — monitoring continues' },
    ],
  },
  flood: {
    label: 'Flood Prediction — Brahmaputra Basin',
    datasets: [
      {
        name: 'River Level (m)',
        data: [4.2, 4.5, 5.1, 5.8, 6.6, 7.5, 8.9, 10.2, 11.8, 13.1, 14.0, 13.5, 12.4, 11.0, 9.5, 7.8],
        color: '#00d4ff', fill: true,
      },
      {
        name: 'Accumulated Rain (mm)',
        data: [12, 28, 55, 88, 145, 220, 310, 425, 550, 640, 700, 720, 715, 700, 660, 610],
        color: '#a855f7', fill: false,
      },
      {
        name: 'Soil Moisture (%)',
        data: [42, 48, 58, 68, 76, 84, 90, 95, 97, 98, 99, 98, 96, 93, 88, 80],
        color: '#f59e0b', fill: false,
      },
    ],
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9', 'Day 10', 'Day 11', 'Day 12', 'Day 13', 'Day 14', 'Day 15', 'Day 16'],
    alerts: [
      { level: 'high', msg: '🌊 CRITICAL: River level 14.0m — surpasses danger mark of 12m' },
      { level: 'high', msg: '🏚 WARNING: 3 districts inundated — 2.1L people displaced' },
      { level: 'med',  msg: '🌧 ALERT: 700mm accumulated rainfall in 11 days (300% of normal)' },
      { level: 'low',  msg: '📡 NavIC-1A & Sentinel-6 tracking recession phase' },
    ],
  },
  heatwave: {
    label: 'Heat Wave — Indian Subcontinent',
    datasets: [
      {
        name: 'Max Temperature (°C)',
        data: [38, 40, 42, 44, 46, 47.5, 48, 47, 45.5, 44, 42, 40, 38, 37, 36, 35],
        color: '#ff6b35', fill: true,
      },
      {
        name: 'Heat Index (°C)',
        data: [40, 43, 47, 52, 56, 59, 61, 59, 56, 52, 47, 44, 41, 39, 37, 36],
        color: '#f59e0b', fill: false,
      },
      {
        name: 'UV Index',
        data: [9, 10, 11, 11, 12, 12, 12, 11, 11, 10, 9, 9, 8, 8, 7, 7],
        color: '#a855f7', fill: false,
      },
    ],
    labels: ['Jun 1', 'Jun 2', 'Jun 3', 'Jun 4', 'Jun 5', 'Jun 6', 'Jun 7', 'Jun 8', 'Jun 9', 'Jun 10', 'Jun 11', 'Jun 12', 'Jun 13', 'Jun 14', 'Jun 15', 'Jun 16'],
    alerts: [
      { level: 'high', msg: '🌡 EXTREME: 48°C recorded — Rajasthan 2024 heat record broken' },
      { level: 'high', msg: '⚠ HEALTH ALERT: Heat index 61°C — Life-threatening outdoor exposure' },
      { level: 'med',  msg: '☀ UV Index 12 (Extreme) — All 3 satellites confirm radiation surge' },
      { level: 'low',  msg: '📡 ESA Sentinel-6 & NavIC confirm cooling trend from Day 8 onward' },
    ],
  },
};
