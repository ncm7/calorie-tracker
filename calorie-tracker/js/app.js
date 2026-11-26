import { FOODS, PRESETS, CATEGORIES, FOOD_BY_ID, itemFromFood, itemsFromPreset, searchFoods, parseMealText } from './foods.js';
import { put, get, del, getAll, clear, getByDate, getByDateRange, uid, requestPersistence } from './db.js';
import {
  ACTIVITY_LEVELS, GOALS, WORKOUTS, MEAL_TYPES, autoTargets, workoutKcal, stepsKcal, kgToLb, lbToKg, cmToFtIn, ftInToCm,
  dateKey, addDays, prettyDate, guessMealType, sumItems, round,
} from './calc.js';
import { loadSettings, saveSettings, currentTargets, exportableSettings, importSettings, DEFAULTS } from './settings.js';
import { estimateMeal, compressImage, blobToDataUrl, dataUrlToBlob, MODELS } from './ai.js';

// ---------------------------------------------------------------- helpers
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();
const fmt1 = (n) => (Math.round((Number(n) || 0) * 10) / 10).toLocaleString();
const nowHM = () => new Date().toTimeString().slice(0, 5);
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const ICONS = {
  camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  text: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>',
  run: '<svg viewBox="0 0 24 24"><circle cx="13" cy="4" r="2"/><path d="M7 21l3-6 3 2v5M6 12l3-4 4 1 3 4 3 1"/></svg>',
};

let toastTimer;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) {
    const b = document.createElement('button');
    b.textContent = action.label;
    b.onclick = () => { el.hidden = true; action.run(); };
    el.appendChild(b);
  }
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), action ? 8000 : 3000);
}

/** Show a dialog. buttons: [{id,label,cls}]. Resolves with the id pressed (or null). */
function dialog(html, buttons = [{ id: 'ok', label: 'OK', cls: 'btn-primary' }], onOpen) {
  const dlg = $('#dlg');
  dlg.innerHTML = `<form method="dialog" class="inner">${html}<div class="row wrap" style="justify-content:flex-end;margin-top:14px">${buttons
    .map((b) => `<button value="${esc(b.id)}" class="${esc(b.cls || '')}">${esc(b.label)}</button>`)
    .join('')}</div></form>`;
  return new Promise((resolve) => {
    let pressed = null;
    $$('button[value]', dlg).forEach((b) => b.addEventListener('click', () => (pressed = b.value)));
    dlg.addEventListener('close', () => resolve(pressed), { once: true });
    dlg.showModal();
    if (onOpen) onOpen(dlg);
  });
}

async function confirmDlg(text, okLabel = 'OK', danger = false) {
  const r = await dialog(`<p>${esc(text)}</p>`, [
    { id: 'cancel', label: 'Cancel' },
    { id: 'ok', label: okLabel, cls: danger ? 'btn-primary btn-danger' : 'btn-primary' },
  ]);
  return r === 'ok';
}

// ---------------------------------------------------------------- state
const state = {
  view: 'today',
  day: dateKey(),
  draft: null,
  addMode: 'photo',
  search: '',
  describe: '',
  aiBusy: false,
  aiMsg: null,
  trendDays: 7,
  installEvent: null,
  customFoods: [],
  customPresets: [],
};
let settings = loadSettings();
const photoUrls = new Map();

async function photoUrl(id, kind = 'thumb') {
  if (!id) return null;
  const key = id + ':' + kind;
  if (photoUrls.has(key)) return photoUrls.get(key);
  const rec = await get('photos', id);
  if (!rec) return null;
  const blob = kind === 'thumb' ? rec.thumb || rec.full : rec.full || rec.thumb;
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  photoUrls.set(key, url);
  return url;
}

async function loadCustom() {
  const all = await getAll('foods');
  state.customFoods = all.filter((x) => x.kind === 'food');
  state.customPresets = all.filter((x) => x.kind === 'preset');
}

function applyTheme() {
  const t = settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

// ---------------------------------------------------------------- navigation
function show(view) {
  state.view = view;
  for (const v of ['today', 'add', 'trends', 'settings']) {
    $('#view-' + v).hidden = v !== view;
  }
  $$('.nav-btn').forEach((b) => (b.dataset.view === view ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  if (view === 'add' && !state.draft) newDraft();
  render();
  window.scrollTo({ top: 0 });
  if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
}

function render() {
  if (state.view === 'today') return renderToday();
  if (state.view === 'add') return renderAdd();
  if (state.view === 'trends') return renderTrends();
  if (state.view === 'settings') return renderSettings();
}

// ---------------------------------------------------------------- TODAY
async function dayData(day) {
  const meals = (await getByDate('meals', day)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const acts = await getByDate('activities', day);
  const eaten = meals.reduce(
    (t, m) => ({ kcal: t.kcal + m.totals.kcal, p: t.p + m.totals.p, c: t.c + m.totals.c, f: t.f + m.totals.f }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  );
  const burned = acts.reduce((s, a) => s + (Number(a.kcal) || 0), 0);
  const steps = acts.filter((a) => a.kind === 'steps').reduce((s, a) => s + (Number(a.steps) || 0), 0);
  return { meals, acts, eaten, burned, steps };
}

function macroBar(label, val, target, color) {
  const pct = target ? Math.min(100, (val / target) * 100) : 0;
  const over = target && val > target * 1.05;
  return `<div class="macro"><div class="top"><span>${label}</span><span class="num ${over ? 'muted' : ''}">${fmt(val)} / ${fmt(target)} g</span></div>
    <div class="bar"><i style="width:${pct}%;background:${color}"></i></div></div>`;
}

async function renderToday() {
  const el = $('#view-today');
  const t = currentTargets(settings);
  const d = await dayData(state.day);
  const budget = t.kcal + (settings.addExercise ? d.burned : 0);
  const remaining = budget - d.eaten.kcal;
  const pct = budget ? Math.min(1, d.eaten.kcal / budget) : 0;
  const C = 2 * Math.PI * 60;
  const isToday = state.day === dateKey();

  const groups = MEAL_TYPES.map((mt) => ({ mt, meals: d.meals.filter((m) => (m.type || 'snack') === mt.id) })).filter((g) => g.meals.length);
  const thumbs = await Promise.all(d.meals.map((m) => photoUrl(m.photoId)));
  const thumbOf = Object.fromEntries(d.meals.map((m, i) => [m.id, thumbs[i]]));

  const workouts = d.acts.filter((a) => a.kind === 'workout');
  const stepRec = d.acts.find((a) => a.kind === 'steps');

  el.innerHTML = `
    <div class="datebar">
      <button class="btn-icon btn-ghost" data-act="prev-day" aria-label="Previous day">&#8249;</button>
      <div style="text-align:center"><h1>${esc(prettyDate(state.day))}</h1>${isToday ? '' : '<button class="btn-sm btn-ghost" data-act="go-today">Back to today</button>'}</div>
      <button class="btn-icon btn-ghost" data-act="next-day" aria-label="Next day" ${isToday ? 'disabled' : ''}>&#8250;</button>
    </div>
    ${state.installEvent && !isStandalone() && !localStorage.getItem('ct.installDismissed') ? `
      <div class="notice row spread"><span>Install Khana as an app on this device.</span>
      <span class="row"><button class="btn-sm btn-primary" data-act="install">Install</button><button class="btn-sm btn-ghost" data-act="dismiss-install" aria-label="Dismiss">&times;</button></span></div>` : ''}
    <div class="grid-2">
      <div>
        <div class="card">
          <div class="summary">
            <div class="ring" role="img" aria-label="${fmt(Math.abs(remaining))} calories ${remaining >= 0 ? 'remaining' : 'over'}">
              <svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="60" fill="none" stroke="var(--surface-2)" stroke-width="12"/>
              <circle cx="70" cy="70" r="60" fill="none" stroke="${remaining < 0 ? 'var(--danger)' : 'var(--accent)'}" stroke-width="12" stroke-linecap="round"
                stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
              <div class="lbl"><div class="big num ${remaining < 0 ? 'over' : ''}">${fmt(Math.abs(remaining))}</div><div class="small muted">${remaining >= 0 ? 'kcal left' : 'kcal over'}</div></div>
            </div>
            <div class="kv">
              <span>Target</span><span class="v">${fmt(t.kcal)}</span>
              <span>Eaten</span><span class="v">${fmt(d.eaten.kcal)}</span>
              <span>Exercise${settings.addExercise ? '' : ' <span class="small muted">(not added)</span>'}</span><span class="v">${d.burned ? '&minus;' + fmt(d.burned) : '0'}</span>
              <span>Steps</span><span class="v">${fmt(d.steps)}${settings.stepGoal ? `<span class="small muted"> / ${fmt(settings.stepGoal)}</span>` : ''}</span>
            </div>
          </div>
          ${macroBar('Protein', d.eaten.p, t.protein, 'var(--protein)')}
          ${macroBar('Carbs', d.eaten.c, t.carbs, 'var(--carbs)')}
          ${macroBar('Fat', d.eaten.f, t.fat, 'var(--fat)')}
        </div>

        <div class="quick" style="margin-bottom:14px">
          <button data-act="quick" data-mode="photo">${ICONS.camera}Photo</button>
          <button data-act="quick" data-mode="describe">${ICONS.text}Describe</button>
          <button data-act="quick" data-mode="search">${ICONS.search}Search</button>
          <button data-act="quick" data-mode="presets">${ICONS.bolt}Quick add</button>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="row spread"><h2>Meals</h2><span class="muted small num">${fmt(d.eaten.kcal)} kcal</span></div>
          ${groups.length ? groups.map((g) => `<div class="meal-group"><h3>${esc(g.mt.label)}</h3>${g.meals.map((m) => `
            <div class="meal" data-act="edit-meal" data-id="${esc(m.id)}" role="button" tabindex="0">
              ${thumbOf[m.id] ? `<img class="thumb" src="${thumbOf[m.id]}" alt="">` : `<div class="thumb">${esc((m.type || '').slice(0, 1).toUpperCase())}</div>`}
              <div class="grow"><div class="name">${esc(m.name)}</div>
                <div class="small muted">${esc(m.time || '')} &middot; P ${fmt(m.totals.p)} &middot; C ${fmt(m.totals.c)} &middot; F ${fmt(m.totals.f)}${m.note ? ' &middot; ' + esc(m.note) : ''}</div></div>
              <div class="kcal">${fmt(m.totals.kcal)}</div>
            </div>`).join('')}</div>`).join('') : `<div class="empty">No meals logged ${isToday ? 'yet today' : 'this day'}.<br><button class="btn-primary" style="margin-top:10px" data-act="quick" data-mode="photo">Log a meal</button></div>`}
        </div>

        <div class="card">
          <div class="row spread"><h2>Activity</h2><button class="btn-sm" data-act="add-workout">${ICONS.run.replace('<svg', '<svg width="18" height="18" style="fill:none;stroke:currentColor;stroke-width:2"')} Add workout</button></div>
          <div class="row" style="margin:8px 0 6px">
            <div class="grow"><label for="steps-in">Steps</label><input id="steps-in" type="number" inputmode="numeric" min="0" step="100" placeholder="0" value="${stepRec ? esc(stepRec.steps) : ''}"></div>
            <div style="padding-top:22px" class="small muted num">${stepRec ? '&asymp; ' + fmt(stepRec.kcal) + ' kcal' : ''}</div>
          </div>
          ${workouts.length ? workouts.map((w) => `<div class="row spread" style="padding:8px 0;border-top:1px solid var(--border)">
            <div><b>${esc((WORKOUTS.find((x) => x.id === w.workout) || {}).label || 'Workout')}</b> <span class="muted small">${fmt(w.minutes)} min${w.note ? ' &middot; ' + esc(w.note) : ''}</span></div>
            <div class="row"><span class="num">${fmt(w.kcal)} kcal</span><button class="btn-sm btn-ghost btn-danger" data-act="del-act" data-id="${esc(w.id)}" aria-label="Delete workout">&times;</button></div></div>`).join('') : '<p class="small muted">No workouts logged.</p>'}
        </div>
      </div>
    </div>`;
}

async function saveSteps(value) {
  const steps = Math.max(0, Math.round(Number(value) || 0));
  const id = 'steps-' + state.day;
  if (!steps) await del('activities', id);
  else await put('activities', { id, date: state.day, kind: 'steps', steps, kcal: stepsKcal(steps, settings.profile.weightKg) });
  renderToday();
}

async function addWorkoutDialog() {
  const opts = WORKOUTS.map((w) => `<option value="${w.id}">${esc(w.label)}</option>`).join('');
  const r = await dialog(
    `<h2>Add workout</h2>
     <div class="field"><label for="w-type">Type</label><select id="w-type">${opts}</select></div>
     <div class="fields">
       <div class="field"><label for="w-min">Minutes</label><input id="w-min" type="number" inputmode="numeric" min="1" value="30"></div>
       <div class="field"><label for="w-kcal">Calories burned (optional)</label><input id="w-kcal" type="number" inputmode="numeric" min="0" placeholder="auto"></div>
     </div>
     <div class="field"><label for="w-note">Note</label><input id="w-note" placeholder="e.g. push day, futsal"></div>
     <p class="small muted" id="w-est"></p>`,
    [{ id: 'cancel', label: 'Cancel' }, { id: 'save', label: 'Save', cls: 'btn-primary' }],
    (dlg) => {
      const upd = () => {
        const est = workoutKcal($('#w-type', dlg).value, Number($('#w-min', dlg).value) || 0, settings.profile.weightKg);
        $('#w-est', dlg).textContent = `Estimated: about ${est} kcal above resting burn. Type your own number if your watch shows one.`;
      };
      $('#w-type', dlg).addEventListener('change', upd);
      $('#w-min', dlg).addEventListener('input', upd);
      upd();
    }
  );
  if (r !== 'save') return;
  const dlg = $('#dlg');
  const workout = $('#w-type', dlg).value;
  const minutes = Number($('#w-min', dlg).value) || 0;
  const manual = $('#w-kcal', dlg).value;
  const kcal = manual !== '' ? Number(manual) : workoutKcal(workout, minutes, settings.profile.weightKg);
  await put('activities', { id: uid('a'), date: state.day, kind: 'workout', workout, minutes, kcal, note: $('#w-note', dlg).value.trim() });
  toast('Workout saved');
  renderToday();
}

// ---------------------------------------------------------------- DRAFT (add/edit meal)
function newDraft(extra = {}) {
  const isToday = state.day === dateKey();
  state.draft = {
    id: null,
    date: state.day,
    time: isToday ? nowHM() : '12:00',
    type: isToday ? guessMealType() : 'lunch',
    name: '',
    note: '',
    items: [],
    photoId: null,
    photoDataUrl: null,
    photoBlob: null,
    thumbBlob: null,
    savePreset: false,
    ...extra,
  };
  state.aiMsg = null;
}

async function editMeal(id) {
  const m = await get('meals', id);
  if (!m) return;
  state.draft = { ...m, items: JSON.parse(JSON.stringify(m.items)), photoDataUrl: null, photoBlob: null, thumbBlob: null, savePreset: false };
  if (m.photoId) state.draft.photoDataUrl = await photoUrl(m.photoId, 'full');
  state.aiMsg = null;
  state.addMode = 'search';
  show('add');
}

function aiReady() {
  const a = settings.ai;
  return (a.provider === 'anthropic' && a.apiKey) || (a.provider === 'proxy' && a.proxyUrl);
}

function unitOptions(item) {
  const food = FOOD_BY_ID[item.foodId] || state.customFoods.find((f) => f.id === item.foodId);
  if (!food || !food.units || food.units.length < 2) return null;
  return food.units.map((u, i) => `<option value="${i}" ${u.l === item.unit ? 'selected' : ''}>${esc(u.l)}</option>`).join('');
}

function renderItems() {
  const d = state.draft;
  if (!d.items.length) return `<div class="empty small">No items yet. Take a photo, describe the meal, search, or pick a quick add.</div>`;
  return d.items
    .map((it, i) => {
      const u = unitOptions(it);
      const tot = (k) => round(it.per[k] * it.qty, k === 'kcal' ? 0 : 1);
      return `<div class="item" data-idx="${i}">
        <div class="head">
          <div class="nm"><input data-f="name" value="${esc(it.name)}" aria-label="Item name"></div>
          <div class="qty">
            <button type="button" class="btn-icon btn-sm" data-act="qty" data-d="-0.5" aria-label="Less">&minus;</button>
            <input data-f="qty" type="number" inputmode="decimal" step="0.25" min="0" value="${round(it.qty, 2)}" aria-label="Quantity">
            <button type="button" class="btn-icon btn-sm" data-act="qty" data-d="0.5" aria-label="More">+</button>
          </div>
        </div>
        <div class="meta">
          ${u ? `<select data-f="unit" aria-label="Portion">${u}</select>` : `<span class="small muted grow">&times; ${esc(it.unit || 'portion')}</span>`}
          ${it.source === 'ai' ? '<span class="chip ai">AI estimate</span>' : ''}
          <span class="grow"></span>
          <button type="button" class="btn-sm btn-ghost" data-act="save-food" title="Save to my foods">Save food</button>
          <button type="button" class="btn-sm btn-ghost btn-danger" data-act="rm-item" aria-label="Remove item">&times;</button>
        </div>
        <div class="macros">
          <div><label>kcal</label><input data-f="kcal" type="number" inputmode="decimal" min="0" value="${tot('kcal')}"></div>
          <div><label>Protein g</label><input data-f="p" type="number" inputmode="decimal" min="0" value="${tot('p')}"></div>
          <div><label>Carbs g</label><input data-f="c" type="number" inputmode="decimal" min="0" value="${tot('c')}"></div>
          <div><label>Fat g</label><input data-f="f" type="number" inputmode="decimal" min="0" value="${tot('f')}"></div>
        </div>
      </div>`;
    })
    .join('');
}

function totalsHTML() {
  const t = sumItems(state.draft.items);
  return `<div><div class="v">${fmt(t.kcal)}</div><div class="l">kcal</div></div>
    <div><div class="v" style="color:var(--protein)">${fmt1(t.p)}</div><div class="l">protein g</div></div>
    <div><div class="v" style="color:var(--carbs)">${fmt1(t.c)}</div><div class="l">carbs g</div></div>
    <div><div class="v" style="color:var(--fat)">${fmt1(t.f)}</div><div class="l">fat g</div></div>`;
}

function modePanel() {
  const m = state.addMode;
  const d = state.draft;
  if (m === 'photo') {
    return `<div class="row wrap">
        <button class="btn-primary grow" data-act="pick-camera">${ICONS.camera.replace('<svg', '<svg width="20" height="20" style="fill:none;stroke:currentColor;stroke-width:2"')} Take photo</button>
        <button class="grow" data-act="pick-gallery">Upload photo</button>
      </div>
      ${d.photoDataUrl ? `
        <div class="field" style="margin-top:12px"><label for="d-note2">Note for the AI (optional)</label>
          <input id="d-note2" data-df="note" value="${esc(d.note)}" placeholder='e.g. "used 1 tsp ghee", "extra chicken", "Chipotle bowl"'></div>
        <button class="btn-primary btn-block" data-act="analyze" ${state.aiBusy || !aiReady() ? 'disabled' : ''}>${state.aiBusy ? '<span class="spinner"></span> Analyzing photo...' : 'Analyze photo with AI'}</button>
        ${aiReady() ? '' : '<div class="notice warn small">AI photo analysis needs an API key. Add one in <a href="#settings" data-act="go-settings">Settings</a>. Until then, add the items yourself with Search or Quick add; the photo is still saved with the meal.</div>'}`
        : '<p class="small muted" style="margin-top:10px">Snap your plate. The AI lists each item with portions, calories and macros, and you can fix anything before saving.</p>'}`;
  }
  if (m === 'describe') {
    return `<div class="field"><label for="describe">What did you eat?</label>
      <textarea id="describe" placeholder="e.g. dal bhat with 150 g grilled chicken and 1 tsp ghee, 1 cup chiya">${esc(state.describe)}</textarea></div>
      <div class="row wrap">
        <button class="btn-primary grow" data-act="describe-ai" ${state.aiBusy || !aiReady() ? 'disabled' : ''}>${state.aiBusy ? '<span class="spinner"></span> Estimating...' : 'Estimate with AI'}</button>
        <button class="grow" data-act="describe-local">Match from food list</button>
      </div>
      <p class="small muted">"Match from food list" works offline. Write amounts first, separated by commas: <i>2 eggs, 2 toast, 1 cup chiya</i>.</p>`;
  }
  if (m === 'search') {
    const res = searchFoods(state.search, state.customFoods, 25);
    return `<input id="search" type="search" placeholder="Search momo, dal, chicken breast, latte..." value="${esc(state.search)}" autocomplete="off" aria-label="Search foods">
      <div class="results" id="results">${state.search.trim()
        ? (res.length ? res.map((f) => `<button class="result" data-act="add-food" data-id="${esc(f.id)}"><span><b>${esc(f.name)}</b><br><span class="s">${esc(f.serving)}</span></span><span class="num">${fmt(f.kcal)}</span></button>`).join('') : '<p class="small muted">No match.</p>')
          + `<button class="result" data-act="add-manual"><span><b>+ Add "${esc(state.search.trim())}" with my own numbers</b></span></button>`
        : '<p class="small muted">Type to search over 100 Nepali and U.S. foods, plus the foods you saved.</p>'}</div>`;
  }
  // presets
  const cats = ['nepali', 'us', 'fusion', 'drink'];
  const presetBtn = (p, items) => {
    const t = sumItems(items);
    return `<button class="preset" data-act="add-preset" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><span>${fmt(t.kcal)} kcal &middot; P ${fmt(t.p)} g</span></button>`;
  };
  return `${state.recent && state.recent.length ? `<h3>Recent</h3><div class="presets">${state.recent.map((m) => `<button class="preset" data-act="add-recent" data-id="${esc(m.id)}"><b>${esc(m.name)}</b><span>${fmt(m.totals.kcal)} kcal &middot; P ${fmt(m.totals.p)} g</span></button>`).join('')}</div>` : ''}
    ${state.customPresets.length ? `<h3 style="margin-top:14px">My saved meals</h3><div class="presets">${state.customPresets.map((p) => `<span style="position:relative">${presetBtn(p, p.items).replace('class="preset"', 'class="preset" style="width:100%"')}<button class="btn-sm btn-ghost" style="position:absolute;top:0;right:0;min-height:28px" data-act="del-preset" data-id="${esc(p.id)}" aria-label="Delete saved meal">&times;</button></span>`).join('')}</div>` : ''}
    ${cats.map((c) => `<h3 style="margin-top:14px">${esc(CATEGORIES[c])}</h3><div class="presets">${PRESETS.filter((p) => p.cat === c).map((p) => presetBtn(p, itemsFromPreset(p))).join('')}</div>`).join('')}`;
}

async function loadRecent() {
  const from = addDays(dateKey(), -21);
  const meals = await getByDateRange('meals', from, addDays(dateKey(), 1));
  const seen = new Set();
  state.recent = meals
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .filter((m) => {
      const k = m.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8);
}

async function renderAdd() {
  const el = $('#view-add');
  const d = state.draft;
  if (state.addMode === 'presets' && !state.recent) await loadRecent();
  const modes = [['photo', 'Photo'], ['describe', 'Describe'], ['search', 'Search'], ['presets', 'Quick add']];
  el.innerHTML = `
    <div class="row spread" style="margin-bottom:12px">
      <h1>${d.id ? 'Edit meal' : 'Log a meal'}</h1>
      ${d.id ? '<button class="btn-sm" data-act="cancel-edit">Cancel</button>' : (d.items.length || d.photoDataUrl ? '<button class="btn-sm btn-ghost" data-act="reset-draft">Start over</button>' : '')}
    </div>
    <div class="grid-2">
      <div>
        <div class="card">
          <div class="seg" role="group" aria-label="How to add food" style="margin-bottom:12px">
            ${modes.map(([id, l]) => `<button data-act="mode" data-mode="${id}" aria-pressed="${state.addMode === id}">${l}</button>`).join('')}
          </div>
          <div id="mode-panel">${modePanel()}</div>
          ${state.aiMsg ? `<div class="notice ${state.aiMsg.err ? 'err' : ''} small">${esc(state.aiMsg.text)}</div>` : ''}
        </div>
      </div>
      <div>
        <div class="card" id="draft">
          ${d.photoDataUrl ? `<div class="preview" style="margin-bottom:12px"><img src="${esc(d.photoDataUrl)}" alt="Meal photo"><button class="x btn-sm" data-act="rm-photo" aria-label="Remove photo">&times;</button></div>` : ''}
          <div class="fields">
            <div class="field" style="grid-column:1/-1"><label for="d-name">Meal name</label><input id="d-name" data-df="name" value="${esc(d.name)}" placeholder="e.g. Dal bhat with chicken"></div>
            <div class="field"><label for="d-type">Meal</label><select id="d-type" data-df="type">${MEAL_TYPES.map((t) => `<option value="${t.id}" ${t.id === d.type ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select></div>
            <div class="field"><label for="d-time">Time</label><input id="d-time" data-df="time" type="time" value="${esc(d.time)}"></div>
            <div class="field"><label for="d-date">Date</label><input id="d-date" data-df="date" type="date" value="${esc(d.date)}" max="${dateKey()}"></div>
          </div>
          <h3>Items</h3>
          <div id="items">${renderItems()}</div>
          <div class="field" style="margin-top:10px"><label for="d-note">Note</label><input id="d-note" data-df="note" value="${esc(d.note)}" placeholder='e.g. "used 1 tsp ghee", "extra chicken"'></div>
          <label class="check"><input type="checkbox" data-df="savePreset" ${d.savePreset ? 'checked' : ''}> Save as one of my quick-add meals</label>
        </div>
        <div class="card sticky-save">
          <div class="totals" id="totals">${totalsHTML()}</div>
          <div class="row" style="margin-top:12px">
            ${d.id ? '<button class="btn-danger" data-act="delete-meal">Delete</button><button data-act="duplicate-meal">Log again today</button>' : ''}
            <button class="btn-primary grow" data-act="save-meal" ${d.items.length ? '' : 'disabled'}>${d.id ? 'Save changes' : 'Save meal'}</button>
          </div>
        </div>
      </div>
    </div>`;
}

function rerenderDraftParts() {
  const items = $('#items');
  if (items) items.innerHTML = renderItems();
  updateTotals();
}

function updateTotals() {
  const t = $('#totals');
  if (t) t.innerHTML = totalsHTML();
  const save = $('[data-act="save-meal"]');
  if (save) save.disabled = !state.draft.items.length;
}

function addItems(items, label) {
  const d = state.draft;
  d.items.push(...items);
  if (!d.name && items.length) d.name = label || items.map((i) => i.name.replace(/\s*\(.*\)$/, '')).join(' + ').slice(0, 80);
  renderAdd();
  toast(`Added ${items.length === 1 ? items[0].name : items.length + ' items'}`);
}

async function handlePhoto(file) {
  if (!file) return;
  try {
    const full = await compressImage(file, 1024, 0.78);
    const thumb = await compressImage(file, 240, 0.7);
    Object.assign(state.draft, { photoDataUrl: full.dataUrl, photoBlob: full.blob, thumbBlob: thumb.blob, photoChanged: true });
    state.addMode = 'photo';
    state.aiMsg = null;
    renderAdd();
    if (aiReady() && settings.ai.autoAnalyze !== false) analyze();
  } catch (e) {
    toast(e.message || 'Could not load the photo');
  }
}

async function analyze(fromText = false) {
  if (state.aiBusy) return;
  const d = state.draft;
  const note = fromText ? state.describe.trim() : d.note.trim();
  if (fromText && !note) return toast('Describe the meal first');
  state.aiBusy = true;
  state.aiMsg = null;
  renderAdd();
  try {
    let imageDataUrl = null;
    if (!fromText && d.photoDataUrl) {
      imageDataUrl = d.photoDataUrl.startsWith('data:') ? d.photoDataUrl : await blobToDataUrl(await (await fetch(d.photoDataUrl)).blob());
    }
    const r = await estimateMeal({ imageDataUrl, note, settings });
    d.items = d.items.filter((i) => i.source !== 'ai').concat(r.items);
    if (!d.name || d.nameFromAI) {
      d.name = r.name;
      d.nameFromAI = true;
    }
    state.aiMsg = { text: `AI estimate (${r.confidence} confidence)${r.notes ? ': ' + r.notes : ''}. Check portions and numbers before saving.` };
  } catch (e) {
    state.aiMsg = { err: true, text: e.message || String(e) };
  } finally {
    state.aiBusy = false;
    renderAdd();
  }
}

async function saveMeal() {
  const d = state.draft;
  if (!d.items.length) return;
  d.items = d.items.filter((i) => i.qty > 0);
  const totals = sumItems(d.items);
  let photoId = d.photoId;
  if (d.photoChanged && d.photoBlob) {
    if (photoId) await del('photos', photoId);
    photoId = uid('ph');
    await put('photos', { id: photoId, full: d.photoBlob, thumb: d.thumbBlob });
  } else if (d.photoRemoved && photoId) {
    await del('photos', photoId);
    photoId = null;
  }
  const meal = {
    id: d.id || uid('m'),
    date: d.date || dateKey(),
    time: d.time || nowHM(),
    type: d.type,
    name: d.name.trim() || d.items.map((i) => i.name).join(' + ').slice(0, 80),
    note: d.note.trim(),
    items: d.items,
    totals: { kcal: round(totals.kcal), p: round(totals.p, 1), c: round(totals.c, 1), f: round(totals.f, 1) },
    photoId: photoId || null,
    updatedAt: Date.now(),
  };
  await put('meals', meal);
  if (d.savePreset) {
    await put('foods', { id: uid('mp'), kind: 'preset', name: meal.name, items: meal.items });
    await loadCustom();
  }
  const wasEdit = !!d.id;
  state.day = meal.date;
  state.draft = null;
  state.recent = null;
  state.describe = '';
  state.search = '';
  state.addMode = 'photo';
  requestPersistence();
  show('today');
  toast(wasEdit ? 'Meal updated' : `Saved ${meal.name} (${fmt(meal.totals.kcal)} kcal)`);
}

async function deleteMeal() {
  const d = state.draft;
  if (!d.id) return;
  if (!(await confirmDlg(`Delete "${d.name}"?`, 'Delete', true))) return;
  const meal = await get('meals', d.id);
  await del('meals', d.id);
  if (d.photoId) await del('photos', d.photoId);
  state.draft = null;
  state.recent = null;
  show('today');
  toast('Meal deleted', {
    label: 'Undo',
    run: async () => {
      // photo is gone; restore the meal without it
      await put('meals', { ...meal, photoId: null });
      renderToday();
    },
  });
}

async function saveItemAsFood(idx) {
  const it = state.draft.items[idx];
  const food = {
    id: uid('cf'),
    kind: 'food',
    cat: 'custom',
    name: it.name,
    serving: it.unit || '1 portion',
    kcal: round(it.per.kcal),
    p: round(it.per.p, 1),
    c: round(it.per.c, 1),
    f: round(it.per.f, 1),
    aliases: [it.name.toLowerCase()],
    units: [{ l: it.unit || '1 portion', m: 1 }],
  };
  await put('foods', food);
  await loadCustom();
  toast(`Saved "${it.name}" to your foods`);
}

// ---------------------------------------------------------------- TRENDS
async function renderTrends() {
  const el = $('#view-trends');
  const n = state.trendDays;
  const today = dateKey();
  const from = addDays(today, -(n - 1));
  const [meals, acts, weights] = await Promise.all([getByDateRange('meals', from, today), getByDateRange('activities', from, today), getAll('weights')]);
  const t = currentTargets(settings);
  const days = [];
  for (let i = 0; i < n; i++) {
    const k = addDays(from, i);
    const ms = meals.filter((m) => m.date === k);
    const as = acts.filter((a) => a.date === k);
    days.push({
      k,
      kcal: ms.reduce((s, m) => s + m.totals.kcal, 0),
      p: ms.reduce((s, m) => s + m.totals.p, 0),
      c: ms.reduce((s, m) => s + m.totals.c, 0),
      f: ms.reduce((s, m) => s + m.totals.f, 0),
      burned: as.reduce((s, a) => s + (a.kcal || 0), 0),
      steps: as.filter((a) => a.kind === 'steps').reduce((s, a) => s + (a.steps || 0), 0),
      logged: ms.length > 0,
    });
  }
  const logged = days.filter((d) => d.logged);
  const avg = (k) => (logged.length ? logged.reduce((s, d) => s + d[k], 0) / logged.length : 0);

  // chart
  const W = 640, H = 230, pad = { l: 40, r: 10, t: 14, b: 30 };
  const maxV = Math.max(t.kcal * 1.25, ...days.map((d) => d.kcal), 500);
  const bw = (W - pad.l - pad.r) / n;
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / maxV);
  const ticks = [0, Math.round(maxV / 2 / 100) * 100, Math.round(maxV / 100) * 100];
  const bars = days
    .map((d, i) => {
      const x = pad.l + i * bw + bw * 0.15;
      const w = bw * 0.7;
      const over = d.kcal > t.kcal * 1.05;
      const color = !d.logged ? 'var(--surface-2)' : over ? 'var(--warn)' : 'var(--accent)';
      const h = Math.max(d.logged ? 2 : 0, H - pad.b - y(d.kcal));
      const [yy, mm, dd] = d.k.split('-').map(Number);
      const lab = n <= 7 ? new Date(yy, mm - 1, dd).toLocaleDateString(undefined, { weekday: 'short' }) : (i % 5 === 0 || i === n - 1 ? `${mm}/${dd}` : '');
      return `<rect x="${x}" y="${H - pad.b - h}" width="${w}" height="${h}" rx="4" fill="${color}"><title>${d.k}: ${fmt(d.kcal)} kcal</title></rect>
        ${n <= 7 && d.logged ? `<text x="${x + w / 2}" y="${H - pad.b - h - 4}" text-anchor="middle">${fmt(d.kcal)}</text>` : ''}
        <text x="${x + w / 2}" y="${H - 10}" text-anchor="middle">${esc(lab)}</text>`;
    })
    .join('');
  const chart = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calories per day for the last ${n} days">
    ${ticks.map((v) => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--border)"/><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('')}
    ${bars}
    <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t.kcal)}" y2="${y(t.kcal)}" stroke="var(--danger)" stroke-dasharray="5 4" stroke-width="1.5"/>
    <text x="${W - pad.r}" y="${y(t.kcal) - 5}" text-anchor="end" style="fill:var(--danger)">target ${fmt(t.kcal)}</text>
  </svg>`;

  const wsorted = weights.sort((a, b) => a.date.localeCompare(b.date));
  const imperial = settings.units === 'imperial';
  const wShow = (kg) => (imperial ? `${fmt1(kgToLb(kg))} lb` : `${fmt1(kg)} kg`);
  const lastW = wsorted.slice(-6).reverse();

  el.innerHTML = `
    <div class="row spread" style="margin-bottom:12px"><h1>Trends</h1>
      <div class="seg" role="group" aria-label="Range"><button data-act="range" data-n="7" aria-pressed="${n === 7}">7 days</button><button data-act="range" data-n="30" aria-pressed="${n === 30}">30 days</button></div></div>
    <div class="card chart">${chart}
      <p class="small muted" style="margin:6px 0 0">Green: at or under target. Amber: more than 5% over. Grey: nothing logged.</p></div>
    <div class="card"><div class="stats">
      <div class="stat"><div class="v">${fmt(avg('kcal'))}</div><div class="l">avg kcal / logged day</div></div>
      <div class="stat"><div class="v">${fmt(avg('p'))} g</div><div class="l">avg protein (target ${fmt(t.protein)})</div></div>
      <div class="stat"><div class="v">${logged.length}/${n}</div><div class="l">days logged</div></div>
      <div class="stat"><div class="v">${fmt(days.reduce((s, d) => s + d.burned, 0))}</div><div class="l">exercise kcal</div></div>
      <div class="stat"><div class="v">${fmt(days.reduce((s, d) => s + d.steps, 0) / n)}</div><div class="l">avg steps / day</div></div>
    </div></div>
    <div class="grid-2">
      <div class="card" style="overflow-x:auto"><h2>By day</h2>
        <table><thead><tr><th>Day</th><th>kcal</th><th>P</th><th>C</th><th>F</th><th>Burned</th></tr></thead>
        <tbody>${days.slice().reverse().map((d) => `<tr data-act="open-day" data-k="${d.k}" style="cursor:pointer"><td>${esc(prettyDate(d.k))}</td><td>${d.logged ? fmt(d.kcal) : '&ndash;'}</td><td>${d.logged ? fmt(d.p) : ''}</td><td>${d.logged ? fmt(d.c) : ''}</td><td>${d.logged ? fmt(d.f) : ''}</td><td>${d.burned ? fmt(d.burned) : ''}</td></tr>`).join('')}</tbody></table>
      </div>
      <div class="card"><h2>Weight</h2>
        <div class="row"><input id="w-in" type="number" inputmode="decimal" step="0.1" placeholder="Today's weight (${imperial ? 'lb' : 'kg'})" aria-label="Weight">
        <button class="btn-primary" data-act="log-weight">Log</button></div>
        <p class="small muted">Logging a weight also updates your profile, so targets stay accurate.</p>
        ${lastW.length ? `<table><tbody>${lastW.map((w) => `<tr><td>${esc(prettyDate(w.date))}</td><td>${wShow(w.kg)}</td><td style="width:40px"><button class="btn-sm btn-ghost btn-danger" data-act="del-weight" data-k="${w.date}" aria-label="Delete">&times;</button></td></tr>`).join('')}</tbody></table>` : ''}
        ${wsorted.length >= 2 ? `<p class="small">Change since ${esc(prettyDate(wsorted[0].date))}: <b>${(wsorted.at(-1).kg - wsorted[0].kg >= 0 ? '+' : '') + wShow(wsorted.at(-1).kg - wsorted[0].kg)}</b></p>` : ''}
      </div>
    </div>`;
}

async function logWeight() {
  const v = Number($('#w-in').value);
  if (!v) return toast('Enter a weight');
  const kg = settings.units === 'imperial' ? lbToKg(v) : v;
  if (kg < 25 || kg > 300) return toast('That weight looks off');
  await put('weights', { date: dateKey(), kg: round(kg, 2) });
  settings.profile.weightKg = round(kg, 1);
  saveSettings(settings);
  toast('Weight logged');
  renderTrends();
}

// ---------------------------------------------------------------- SETTINGS
function renderSettings() {
  const el = $('#view-settings');
  const s = settings;
  const p = s.profile;
  const imperial = s.units === 'imperial';
  const auto = autoTargets(p);
  const t = currentTargets(s);
  const fi = cmToFtIn(p.heightCm);
  const sel = (opts, val) => opts.map((o) => `<option value="${o.id}" ${o.id === val ? 'selected' : ''}>${esc(o.label)}</option>`).join('');

  el.innerHTML = `
    <h1 style="margin-bottom:12px">Settings</h1>
    <div class="grid-2">
    <div>
      <div class="card">
        <h2>Profile</h2>
        <div class="seg" role="group" aria-label="Units" style="margin-bottom:12px">
          <button data-act="units" data-u="imperial" aria-pressed="${imperial}">lb / ft</button>
          <button data-act="units" data-u="metric" aria-pressed="${!imperial}">kg / cm</button>
        </div>
        <div class="fields">
          <div class="field"><label for="s-age">Age</label><input id="s-age" data-s="profile.age" type="number" inputmode="numeric" min="14" max="100" value="${p.age}"></div>
          <div class="field"><label for="s-sex">Sex (for the formula)</label><select id="s-sex" data-s="profile.sex"><option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option></select></div>
          <div class="field"><label for="s-w">Weight (${imperial ? 'lb' : 'kg'})</label><input id="s-w" data-s="weight" type="number" inputmode="decimal" step="0.1" value="${imperial ? round(kgToLb(p.weightKg), 1) : p.weightKg}"></div>
          ${imperial
            ? `<div class="field"><label>Height</label><div class="row"><input data-s="ft" type="number" inputmode="numeric" min="3" max="8" value="${fi.ft}" aria-label="Feet"><span>ft</span><input data-s="in" type="number" inputmode="numeric" min="0" max="11" value="${fi.inch}" aria-label="Inches"><span>in</span></div></div>`
            : `<div class="field"><label for="s-h">Height (cm)</label><input id="s-h" data-s="profile.heightCm" type="number" inputmode="numeric" value="${round(p.heightCm)}"></div>`}
        </div>
        <div class="field"><label for="s-act">Activity level</label><select id="s-act" data-s="profile.activity">${sel(ACTIVITY_LEVELS, p.activity)}</select></div>
        <div class="field"><label for="s-goal">Goal</label><select id="s-goal" data-s="profile.goal">${sel(GOALS, p.goal)}</select></div>
        <div class="field"><label for="s-ppk">Protein (g per kg body weight)</label><input id="s-ppk" data-s="profile.proteinPerKg" type="number" inputmode="decimal" step="0.1" min="0.8" max="3" value="${p.proteinPerKg}"></div>
        <p class="small muted">Resting burn (Mifflin-St Jeor): <b>${fmt(auto.bmr)}</b> kcal. Daily burn with activity: <b>${fmt(auto.tdee)}</b> kcal.</p>
      </div>

      <div class="card">
        <h2>Daily targets</h2>
        <label class="check"><input type="checkbox" data-s="targets.auto" ${s.targets.mode === 'auto' ? 'checked' : ''}> Calculate from my profile</label>
        <div class="fields">
          <div class="field"><label for="t-k">Calories</label><input id="t-k" data-s="targets.kcal" type="number" inputmode="numeric" value="${t.kcal}" ${s.targets.mode === 'auto' ? 'disabled' : ''}></div>
          <div class="field"><label for="t-p">Protein g</label><input id="t-p" data-s="targets.protein" type="number" inputmode="numeric" value="${t.protein}" ${s.targets.mode === 'auto' ? 'disabled' : ''}></div>
          <div class="field"><label for="t-c">Carbs g</label><input id="t-c" data-s="targets.carbs" type="number" inputmode="numeric" value="${t.carbs}" ${s.targets.mode === 'auto' ? 'disabled' : ''}></div>
          <div class="field"><label for="t-f">Fat g</label><input id="t-f" data-s="targets.fat" type="number" inputmode="numeric" value="${t.fat}" ${s.targets.mode === 'auto' ? 'disabled' : ''}></div>
        </div>
        <div class="field"><label for="t-steps">Daily step goal</label><input id="t-steps" data-s="stepGoal" type="number" inputmode="numeric" step="500" value="${s.stepGoal}"></div>
        <label class="check"><input type="checkbox" data-s="addExercise" ${s.addExercise ? 'checked' : ''}> Add exercise and step calories back to my daily budget</label>
        <p class="small muted">Leave this off if your activity level above already counts your usual exercise, or you will count it twice.</p>
      </div>
    </div>
    <div>
      <div class="card">
        <h2>AI photo analysis</h2>
        <div class="field"><label for="ai-prov">Provider</label><select id="ai-prov" data-s="ai.provider">
          <option value="anthropic" ${s.ai.provider === 'anthropic' ? 'selected' : ''}>Anthropic API key (on this device)</option>
          <option value="proxy" ${s.ai.provider === 'proxy' ? 'selected' : ''}>My own proxy URL (key stays on server)</option>
          <option value="off" ${s.ai.provider === 'off' ? 'selected' : ''}>Off (manual logging only)</option></select></div>
        ${s.ai.provider === 'anthropic' ? `<div class="field"><label for="ai-key">Anthropic API key</label>
          <div class="row"><input id="ai-key" data-s="ai.apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-..." value="${esc(s.ai.apiKey)}">
          <button class="btn-sm" data-act="toggle-key">Show</button></div>
          <p class="small muted">Stored only in this browser. Never exported. Get a key at console.anthropic.com, under API keys.</p></div>` : ''}
        ${s.ai.provider === 'proxy' ? `<div class="field"><label for="ai-proxy">Proxy URL</label><input id="ai-proxy" data-s="ai.proxyUrl" type="url" placeholder="https://your-worker.workers.dev" value="${esc(s.ai.proxyUrl)}">
          <p class="small muted">See proxy/README.md in the project for a free Cloudflare Worker that holds your key.</p></div>` : ''}
        ${s.ai.provider !== 'off' ? `<div class="fields">
          <div class="field"><label for="ai-model">Model</label><select id="ai-model" data-s="ai.model">${MODELS.map((m) => `<option value="${m.id}" ${m.id === s.ai.model ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select></div>
          <div class="field"><label for="ai-eff">Effort</label><select id="ai-eff" data-s="ai.effort">${['low', 'medium', 'high'].map((e) => `<option ${e === s.ai.effort ? 'selected' : ''}>${e}</option>`).join('')}</select></div>
        </div>
        <label class="check"><input type="checkbox" data-s="ai.autoAnalyze" ${s.ai.autoAnalyze !== false ? 'checked' : ''}> Analyze automatically after I take a photo</label>
        <button data-act="test-ai" ${aiReady() ? '' : 'disabled'}>Test connection</button>
        <p class="small muted">Each photo costs a small amount on your Anthropic bill. Haiku is cheapest; Opus is most accurate. Photo estimates are approximate, so check portions.</p>` : ''}
      </div>

      <div class="card">
        <h2>Your data</h2>
        <p class="small muted">Everything is stored on this device only (meals and photos in IndexedDB, settings in local storage). Back up now and then.</p>
        <label class="check"><input type="checkbox" id="exp-photos" checked> Include photos in the backup</label>
        <div class="row wrap">
          <button data-act="export-json">Export backup (JSON)</button>
          <button data-act="import-json">Import backup</button>
          <button data-act="export-csv">Export meals (CSV)</button>
          <button data-act="export-act-csv">Export activity (CSV)</button>
        </div>
        <p class="small muted" id="storage-info"></p>
        <button class="btn-danger" data-act="wipe">Delete all data on this device</button>
      </div>

      <div class="card">
        <h2>App</h2>
        <div class="field"><label for="s-theme">Theme</label><select id="s-theme" data-s="theme">
          ${['system', 'light', 'dark'].map((x) => `<option value="${x}" ${s.theme === x ? 'selected' : ''}>${x[0].toUpperCase() + x.slice(1)}</option>`).join('')}</select></div>
        ${isStandalone() ? '<p class="small">Installed as an app.</p>'
          : state.installEvent ? '<button class="btn-primary" data-act="install">Install app</button>'
          : isIOS() ? '<p class="small">To install on iPhone: open this page in Safari, tap the Share button, then <b>Add to Home Screen</b>.</p>'
          : '<p class="small">To install: in Chrome or Edge, use the install icon in the address bar, or the menu &rarr; <b>Install app</b> / <b>Add to Home screen</b>.</p>'}
        <p class="small muted">Calorie numbers are estimates for general tracking, not medical advice.</p>
      </div>
    </div></div>`;

  storageInfo();
}

async function storageInfo() {
  const el = $('#storage-info');
  if (!el) return;
  const [meals, photos] = await Promise.all([getAll('meals'), getAll('photos')]);
  let txt = `${meals.length} meals, ${photos.length} photos saved.`;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const e = await navigator.storage.estimate();
      txt += ` Using about ${(e.usage / 1048576).toFixed(1)} MB.`;
    }
    if (navigator.storage && navigator.storage.persisted) txt += (await navigator.storage.persisted()) ? ' Storage is marked persistent.' : '';
  } catch (e) { /* ignore */ }
  el.textContent = txt;
}

function setSetting(path, value) {
  const s = settings;
  if (path === 'weight') {
    const v = Number(value);
    if (v) s.profile.weightKg = round(s.units === 'imperial' ? lbToKg(v) : v, 1);
  } else if (path === 'ft' || path === 'in') {
    const root = $('#view-settings');
    const ft = $('[data-s="ft"]', root).value;
    const inch = $('[data-s="in"]', root).value;
    s.profile.heightCm = round(ftInToCm(ft || 0, inch || 0), 1);
  } else if (path === 'targets.auto') {
    if (value) s.targets.mode = 'auto';
    else {
      const cur = currentTargets(s);
      s.targets = { mode: 'manual', kcal: cur.kcal, protein: cur.protein, carbs: cur.carbs, fat: cur.fat };
    }
  } else {
    const keys = path.split('.');
    let o = s;
    while (keys.length > 1) o = o[keys.shift()];
    const k = keys[0];
    const old = o[k];
    o[k] = typeof old === 'number' ? Number(value) : value;
  }
  saveSettings(s);
}

// ---------------------------------------------------------------- export / import
function saveFile(content, name, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const file = new File([blob], name, { type });
  if (isIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: name }).catch(() => {});
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

async function exportJSON() {
  const withPhotos = $('#exp-photos') ? $('#exp-photos').checked : true;
  const [meals, activities, foods, weights, photos] = await Promise.all([getAll('meals'), getAll('activities'), getAll('foods'), getAll('weights'), withPhotos ? getAll('photos') : []]);
  const photoData = [];
  for (const ph of photos) {
    photoData.push({ id: ph.id, full: ph.full ? await blobToDataUrl(ph.full) : null, thumb: ph.thumb ? await blobToDataUrl(ph.thumb) : null });
  }
  const data = { app: 'khana-calorie-tracker', version: 1, exportedAt: new Date().toISOString(), settings: exportableSettings(settings), meals, activities, foods, weights, photos: photoData };
  saveFile(JSON.stringify(data), `khana-backup-${dateKey()}.json`, 'application/json');
  toast('Backup exported');
}

async function importJSON(file) {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    return toast('That file is not valid JSON');
  }
  if (!data || data.app !== 'khana-calorie-tracker' || !Array.isArray(data.meals)) return toast('That is not a Khana backup file');
  const choice = await dialog(
    `<h2>Import backup</h2><p>${data.meals.length} meals, ${(data.activities || []).length} activities, ${(data.photos || []).length} photos, from ${esc((data.exportedAt || '').slice(0, 10))}.</p>
     <p class="small muted"><b>Merge</b> adds these and updates entries with the same id. <b>Replace</b> deletes everything on this device first.</p>`,
    [{ id: 'cancel', label: 'Cancel' }, { id: 'replace', label: 'Replace', cls: 'btn-danger' }, { id: 'merge', label: 'Merge', cls: 'btn-primary' }]
  );
  if (choice !== 'merge' && choice !== 'replace') return;
  if (choice === 'replace') for (const st of ['meals', 'activities', 'foods', 'weights', 'photos']) await clear(st);
  for (const m of data.meals) if (m && m.id && m.date && Array.isArray(m.items)) await put('meals', m);
  for (const a of data.activities || []) if (a && a.id && a.date) await put('activities', a);
  for (const f of data.foods || []) if (f && f.id) await put('foods', f);
  for (const w of data.weights || []) if (w && w.date) await put('weights', w);
  for (const ph of data.photos || []) {
    if (!ph || !ph.id) continue;
    await put('photos', { id: ph.id, full: ph.full ? await dataUrlToBlob(ph.full) : null, thumb: ph.thumb ? await dataUrlToBlob(ph.thumb) : null });
  }
  if (data.settings) settings = importSettings(data.settings);
  applyTheme();
  photoUrls.clear();
  await loadCustom();
  state.recent = null;
  toast(`Imported ${data.meals.length} meals`);
  render();
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

async function exportCSV() {
  const meals = (await getAll('meals')).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const rows = [['date', 'time', 'meal_type', 'meal_name', 'item', 'quantity', 'unit', 'kcal', 'protein_g', 'carbs_g', 'fat_g', 'source', 'note']];
  for (const m of meals) {
    for (const it of m.items) {
      rows.push([m.date, m.time, m.type, m.name, it.name, round(it.qty, 2), it.unit, round(it.per.kcal * it.qty), round(it.per.p * it.qty, 1), round(it.per.c * it.qty, 1), round(it.per.f * it.qty, 1), it.source || '', m.note]);
    }
  }
  saveFile(rows.map((r) => r.map(csvCell).join(',')).join('\n'), `khana-meals-${dateKey()}.csv`, 'text/csv');
}

async function exportActCSV() {
  const acts = (await getAll('activities')).sort((a, b) => a.date.localeCompare(b.date));
  const rows = [['date', 'kind', 'workout', 'minutes', 'steps', 'kcal', 'note']];
  for (const a of acts) rows.push([a.date, a.kind, a.workout || '', a.minutes || '', a.steps || '', a.kcal || 0, a.note || '']);
  saveFile(rows.map((r) => r.map(csvCell).join(',')).join('\n'), `khana-activity-${dateKey()}.csv`, 'text/csv');
}

// ---------------------------------------------------------------- events
document.addEventListener('click', async (e) => {
  const navBtn = e.target.closest('.nav-btn');
  if (navBtn) return show(navBtn.dataset.view);
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const idxEl = el.closest('[data-idx]');
  const idx = idxEl ? Number(idxEl.dataset.idx) : null;
  const d = state.draft;

  switch (act) {
    case 'prev-day': state.day = addDays(state.day, -1); return renderToday();
    case 'next-day': if (state.day < dateKey()) state.day = addDays(state.day, 1); return renderToday();
    case 'go-today': state.day = dateKey(); return renderToday();
    case 'quick':
      if (!state.draft || state.draft.id) newDraft();
      state.addMode = el.dataset.mode;
      show('add');
      if (el.dataset.mode === 'photo' && !state.draft.photoDataUrl) $('#pick-camera').click();
      if (el.dataset.mode === 'search') setTimeout(() => $('#search') && $('#search').focus(), 50);
      return;
    case 'edit-meal': return editMeal(el.dataset.id);
    case 'add-workout': return addWorkoutDialog();
    case 'del-act': await del('activities', el.dataset.id); return renderToday();
    case 'install':
      if (state.installEvent) {
        state.installEvent.prompt();
        const r = await state.installEvent.userChoice;
        if (r.outcome === 'accepted') state.installEvent = null;
        render();
      }
      return;
    case 'dismiss-install': localStorage.setItem('ct.installDismissed', '1'); return renderToday();

    case 'mode': state.addMode = el.dataset.mode; return renderAdd();
    case 'pick-camera': return $('#pick-camera').click();
    case 'pick-gallery': return $('#pick-gallery').click();
    case 'analyze': return analyze(false);
    case 'describe-ai': return analyze(true);
    case 'describe-local': {
      const { items, unmatched } = parseMealText(state.describe, state.customFoods);
      if (items.length) addItems(items);
      state.aiMsg = unmatched.length ? { err: true, text: `Not found: ${unmatched.join(', ')}. Use Search or "Estimate with AI" for these.` } : null;
      if (!items.length && !unmatched.length) return toast('Describe the meal first');
      return renderAdd();
    }
    case 'add-food': {
      const f = FOOD_BY_ID[el.dataset.id] || state.customFoods.find((x) => x.id === el.dataset.id);
      if (f) addItems([itemFromFood(f, 1)]);
      return;
    }
    case 'add-manual':
      return addItems([{ name: state.search.trim() || 'Custom item', qty: 1, unit: 'portion', per: { kcal: 0, p: 0, c: 0, f: 0 }, source: 'manual' }]);
    case 'add-preset': {
      const p = PRESETS.find((x) => x.id === el.dataset.id) || state.customPresets.find((x) => x.id === el.dataset.id);
      if (!p) return;
      const items = p.items[0] && Array.isArray(p.items[0]) ? itemsFromPreset(p) : JSON.parse(JSON.stringify(p.items));
      return addItems(items, p.name);
    }
    case 'add-recent': {
      const m = state.recent.find((x) => x.id === el.dataset.id);
      if (m) addItems(JSON.parse(JSON.stringify(m.items)), m.name);
      return;
    }
    case 'del-preset':
      e.stopPropagation();
      if (await confirmDlg('Delete this saved meal?', 'Delete', true)) { await del('foods', el.dataset.id); await loadCustom(); renderAdd(); }
      return;
    case 'qty': {
      const it = d.items[idx];
      it.qty = Math.max(0, round(it.qty + Number(el.dataset.d), 2));
      if (it.qty === 0) it.qty = 0.25;
      return rerenderDraftParts();
    }
    case 'rm-item': d.items.splice(idx, 1); return rerenderDraftParts();
    case 'save-food': return saveItemAsFood(idx);
    case 'rm-photo':
      Object.assign(d, { photoDataUrl: null, photoBlob: null, thumbBlob: null, photoChanged: false, photoRemoved: !!d.photoId });
      return renderAdd();
    case 'save-meal': return saveMeal();
    case 'delete-meal': return deleteMeal();
    case 'duplicate-meal': {
      const copy = { ...d, id: null, date: dateKey(), time: nowHM(), photoId: null, photoDataUrl: null, photoBlob: null, thumbBlob: null, photoChanged: false };
      state.draft = copy;
      state.day = dateKey();
      toast('Copied to today. Adjust and save.');
      return renderAdd();
    }
    case 'cancel-edit': state.draft = null; return show('today');
    case 'reset-draft': newDraft(); state.describe = ''; return renderAdd();
    case 'go-settings': e.preventDefault(); return show('settings');

    case 'range': state.trendDays = Number(el.dataset.n); return renderTrends();
    case 'open-day': state.day = el.dataset.k; return show('today');
    case 'log-weight': return logWeight();
    case 'del-weight': await del('weights', el.dataset.k); return renderTrends();

    case 'units': settings.units = el.dataset.u; saveSettings(settings); return renderSettings();
    case 'toggle-key': {
      const k = $('#ai-key');
      k.type = k.type === 'password' ? 'text' : 'password';
      el.textContent = k.type === 'password' ? 'Show' : 'Hide';
      return;
    }
    case 'test-ai': {
      el.disabled = true;
      el.innerHTML = '<span class="spinner"></span> Testing...';
      try {
        const r = await estimateMeal({ note: '1 cup Nepali masala chiya with milk and 2 tsp sugar', settings });
        const t = sumItems(r.items);
        await dialog(`<h2>Connection works</h2><p>Test estimate for 1 cup masala chiya: <b>${fmt(t.kcal)} kcal</b>, ${fmt1(t.p)} g protein.</p>`);
      } catch (err) {
        await dialog(`<h2>Connection failed</h2><p>${esc(err.message)}</p>`);
      }
      return renderSettings();
    }
    case 'export-json': return exportJSON();
    case 'import-json': return $('#pick-import').click();
    case 'export-csv': return exportCSV();
    case 'export-act-csv': return exportActCSV();
    case 'wipe':
      if (!(await confirmDlg('Delete every meal, photo, activity and setting on this device? Export a backup first if you want to keep them.', 'Delete everything', true))) return;
      for (const st of ['meals', 'activities', 'foods', 'weights', 'photos']) await clear(st);
      localStorage.clear();
      settings = loadSettingsFresh();
      photoUrls.clear();
      await loadCustom();
      toast('All data deleted');
      return renderSettings();
  }
});

function loadSettingsFresh() {
  const s = JSON.parse(JSON.stringify(DEFAULTS));
  saveSettings(s);
  return s;
}

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.meal[data-act]')) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === 'Enter' && e.target.id === 'w-in') logWeight();
});

document.addEventListener('input', (e) => {
  const t = e.target;
  const d = state.draft;
  if (t.id === 'search') {
    state.search = t.value;
    const panel = $('#mode-panel');
    const pos = t.selectionStart;
    panel.innerHTML = modePanel();
    const s = $('#search');
    s.focus();
    try { s.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
    return;
  }
  if (t.id === 'describe') { state.describe = t.value; return; }
  if (t.dataset.df && d) {
    if (t.type === 'checkbox') d[t.dataset.df] = t.checked;
    else d[t.dataset.df] = t.value;
    if (t.dataset.df === 'name') d.nameFromAI = false;
    if (t.dataset.df === 'note') $$('[data-df="note"]').forEach((x) => x !== t && (x.value = t.value));
    return;
  }
  if (t.dataset.f && d) {
    const idx = Number(t.closest('[data-idx]').dataset.idx);
    const it = d.items[idx];
    const f = t.dataset.f;
    if (f === 'name') it.name = t.value;
    else if (f === 'qty') {
      const q = Number(t.value);
      if (q > 0) it.qty = q;
      // refresh this item's total fields
      const box = t.closest('.item');
      for (const k of ['kcal', 'p', 'c', 'f']) $(`[data-f="${k}"]`, box).value = round(it.per[k] * it.qty, k === 'kcal' ? 0 : 1);
    } else if (['kcal', 'p', 'c', 'f'].includes(f)) {
      const v = Math.max(0, Number(t.value) || 0);
      it.per[f] = it.qty ? v / it.qty : v;
      if (it.source === 'ai' || it.source === 'db') it.edited = true;
    }
    updateTotals();
  }
});

document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.id === 'pick-camera' || t.id === 'pick-gallery') {
    const f = t.files && t.files[0];
    t.value = '';
    if (state.view !== 'add') { if (!state.draft) newDraft(); show('add'); }
    return handlePhoto(f);
  }
  if (t.id === 'pick-import') {
    const f = t.files && t.files[0];
    t.value = '';
    if (f) importJSON(f);
    return;
  }
  if (t.id === 'steps-in') return saveSteps(t.value);
  if (t.dataset.f === 'unit' && state.draft) {
    const idx = Number(t.closest('[data-idx]').dataset.idx);
    const it = state.draft.items[idx];
    const food = FOOD_BY_ID[it.foodId] || state.customFoods.find((f) => f.id === it.foodId);
    if (food) {
      const fresh = itemFromFood(food, it.qty, Number(t.value));
      state.draft.items[idx] = { ...fresh, name: it.name };
      rerenderDraftParts();
    }
    return;
  }
  if (t.dataset.df === 'type' || t.dataset.df === 'date' || t.dataset.df === 'time') {
    state.draft[t.dataset.df] = t.value;
    return;
  }
  if (t.dataset.s) {
    setSetting(t.dataset.s, t.type === 'checkbox' ? t.checked : t.value);
    if (t.dataset.s === 'theme') applyTheme();
    // Re-render to refresh computed values, but not while typing the key
    if (t.dataset.s !== 'ai.apiKey' && t.dataset.s !== 'ai.proxyUrl') renderSettings();
    else {
      const b = $('[data-act="test-ai"]');
      if (b) b.disabled = !aiReady();
    }
  }
});

// Save the API key as it is typed, too
document.addEventListener('keyup', (e) => {
  if (e.target.id === 'ai-key' || e.target.id === 'ai-proxy') {
    setSetting(e.target.dataset.s, e.target.value.trim());
    const b = $('[data-act="test-ai"]');
    if (b) b.disabled = !aiReady();
  }
});

// ---------------------------------------------------------------- PWA plumbing
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installEvent = e;
  if (state.view === 'today' || state.view === 'settings') render();
});
window.addEventListener('appinstalled', () => {
  state.installEvent = null;
  toast('Installed');
});

function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .register('sw.js')
    .then((reg) => {
      const onWaiting = (w) => toast('A new version is ready', { label: 'Reload', run: () => w.postMessage('skipWaiting') });
      if (reg.waiting && navigator.serviceWorker.controller) onWaiting(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        nw && nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) onWaiting(nw);
        });
      });
    })
    .catch((err) => console.warn('Service worker failed', err));
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    location.reload();
  });
}

// Refresh "Today" when the app comes back after midnight
let lastDay = dateKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && dateKey() !== lastDay) {
    if (state.day === lastDay) state.day = dateKey();
    lastDay = dateKey();
    render();
  }
});

// Share target / shortcut support: ?action=photo opens the camera flow
async function init() {
  applyTheme();
  await loadCustom();
  const params = new URLSearchParams(location.search);
  const start = params.get('action');
  const hash = location.hash.slice(1);
  if (start === 'photo' || start === 'search') {
    newDraft();
    state.addMode = start;
    show('add');
  } else if (['today', 'add', 'trends', 'settings'].includes(hash)) show(hash);
  else show('today');
  registerSW();
}

init();
window.__khana = { state, settings: () => settings }; // handy for debugging
