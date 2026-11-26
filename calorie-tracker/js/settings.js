// Settings and profile, stored in localStorage on this device only.
import { autoTargets } from './calc.js';

const KEY = 'ct.settings.v1';

export const DEFAULTS = {
  profile: {
    name: '',
    sex: 'male',
    age: 28,
    weightKg: 70,
    heightCm: 168,
    activity: 'light',
    goal: 'lose-slow',
    proteinPerKg: 1.8,
  },
  units: 'imperial', // 'imperial' (lb, ft/in) or 'metric' (kg, cm)
  targets: { mode: 'auto', kcal: 2200, protein: 126, carbs: 240, fat: 66 },
  stepGoal: 8000,
  addExercise: false, // add workout/step calories back to the daily budget
  ai: {
    provider: 'anthropic', // 'anthropic' | 'proxy' | 'off'
    apiKey: '',
    model: 'claude-opus-5-5',
    proxyUrl: '',
    effort: 'low',
  },
  theme: 'system', // 'system' | 'light' | 'dark'
};

function deepMerge(base, extra) {
  // Copy base deeply so changes to settings never touch DEFAULTS.
  const out = JSON.parse(JSON.stringify(base));
  for (const [k, v] of Object.entries(extra || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') out[k] = deepMerge(base[k], v);
    else out[k] = v;
  }
  return out;
}

let cache = null;

export function loadSettings() {
  if (cache) return cache;
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch (e) {
    saved = {};
  }
  cache = deepMerge(DEFAULTS, saved);
  return cache;
}

export function saveSettings(s) {
  cache = s;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('Could not save settings', e);
  }
}

/** Current daily targets, auto-calculated or manual. */
export function currentTargets(s = loadSettings()) {
  if (s.targets.mode === 'auto') {
    const t = autoTargets(s.profile);
    return { kcal: t.kcal, protein: t.protein, carbs: t.carbs, fat: t.fat, auto: t };
  }
  return { kcal: Number(s.targets.kcal), protein: Number(s.targets.protein), carbs: Number(s.targets.carbs), fat: Number(s.targets.fat) };
}

/** Settings safe to export (API key removed). */
export function exportableSettings(s = loadSettings()) {
  const copy = JSON.parse(JSON.stringify(s));
  copy.ai.apiKey = '';
  return copy;
}

export function importSettings(obj) {
  const s = deepMerge(DEFAULTS, obj || {});
  // keep the key already on this device; never import one from a file
  s.ai.apiKey = loadSettings().ai.apiKey;
  saveSettings(s);
  return s;
}
