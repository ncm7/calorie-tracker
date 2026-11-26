// Targets, activity math and date helpers.

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary (desk job, little exercise)', factor: 1.2 },
  { id: 'light', label: 'Light (exercise 1-3 days/week)', factor: 1.375 },
  { id: 'moderate', label: 'Moderate (exercise 3-5 days/week)', factor: 1.55 },
  { id: 'active', label: 'Active (exercise 6-7 days/week)', factor: 1.725 },
  { id: 'very', label: 'Very active (hard training or physical job)', factor: 1.9 },
];

export const GOALS = [
  { id: 'lose', label: 'Lose ~0.5 kg (1 lb) per week', delta: -500 },
  { id: 'lose-slow', label: 'Lose slowly (~0.25 kg / 0.5 lb per week)', delta: -250 },
  { id: 'maintain', label: 'Maintain weight', delta: 0 },
  { id: 'gain', label: 'Lean gain (~0.25 kg / 0.5 lb per week)', delta: 250 },
];

// MET values from the Compendium of Physical Activities (rounded).
export const WORKOUTS = [
  { id: 'walk', label: 'Walking (brisk)', met: 4.3 },
  { id: 'run', label: 'Running (~6 mph / 10 km/h)', met: 9.8 },
  { id: 'cycle', label: 'Cycling (moderate)', met: 7.5 },
  { id: 'strength', label: 'Weight training', met: 5.0 },
  { id: 'hiit', label: 'HIIT / circuit', met: 8.0 },
  { id: 'yoga', label: 'Yoga / stretching', met: 2.5 },
  { id: 'swim', label: 'Swimming', met: 7.0 },
  { id: 'hike', label: 'Hiking', met: 6.0 },
  { id: 'sport', label: 'Football / cricket / basketball', met: 7.0 },
  { id: 'badminton', label: 'Badminton / tennis', met: 6.0 },
  { id: 'dance', label: 'Dancing', met: 5.0 },
  { id: 'other', label: 'Other', met: 4.0 },
];

/** Mifflin-St Jeor resting energy, kcal/day. */
export function bmr({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

/** Auto targets from a profile. */
export function autoTargets(profile) {
  const act = ACTIVITY_LEVELS.find((a) => a.id === profile.activity) || ACTIVITY_LEVELS[1];
  const goal = GOALS.find((g) => g.id === profile.goal) || GOALS[2];
  const b = bmr(profile);
  const tdee = Math.round(b * act.factor);
  const floor = profile.sex === 'female' ? 1200 : 1500;
  const kcal = Math.max(floor, Math.round((tdee + goal.delta) / 10) * 10);
  // Protein 1.8 g/kg (keeps muscle while losing, supports gain), fat 27% of kcal, carbs the rest.
  const protein = Math.round(profile.weightKg * (profile.proteinPerKg || 1.8));
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr: b, tdee, kcal, protein, carbs, fat };
}

export function workoutKcal(metOrId, minutes, weightKg) {
  const met = typeof metOrId === 'number' ? metOrId : (WORKOUTS.find((w) => w.id === metOrId) || WORKOUTS.at(-1)).met;
  // Net of resting burn (MET - 1) so it can be added on top of a TDEE-based target.
  return Math.round(((met - 1) * 3.5 * weightKg * minutes) / 200);
}

export function stepsKcal(steps, weightKg) {
  // About 0.04 kcal per step for a 70 kg person, scaled by body weight.
  return Math.round(steps * 0.00057 * weightKg);
}

export const kgToLb = (kg) => kg * 2.20462;
export const lbToKg = (lb) => lb / 2.20462;
export const cmToFtIn = (cm) => {
  const totalIn = cm / 2.54;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
};
export const ftInToCm = (ft, inch) => (Number(ft) * 12 + Number(inch)) * 2.54;

/** Local-time date key "YYYY-MM-DD". */
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return dateKey(dt);
}

export function prettyDate(key) {
  const today = dateKey();
  if (key === today) return 'Today';
  if (key === addDays(today, -1)) return 'Yesterday';
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function guessMealType(d = new Date()) {
  const h = d.getHours();
  if (h >= 4 && h < 11) return 'breakfast';
  if (h >= 11 && h < 15) return 'lunch';
  if (h >= 15 && h < 18) return 'khaja';
  if (h >= 18 && h < 23) return 'dinner';
  return 'snack';
}

export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'khaja', label: 'Khaja (afternoon snack)' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

export function sumItems(items) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const it of items || []) {
    t.kcal += (it.per.kcal || 0) * it.qty;
    t.p += (it.per.p || 0) * it.qty;
    t.c += (it.per.c || 0) * it.qty;
    t.f += (it.per.f || 0) * it.qty;
  }
  return t;
}

export function round(n, d = 0) {
  const k = 10 ** d;
  return Math.round((Number(n) || 0) * k) / k;
}
