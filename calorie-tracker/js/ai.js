// Vision AI meal estimation.
// Calls the Anthropic Messages API directly from the browser with the user's own key,
// or a small proxy (see proxy/worker.js) that keeps the key off the device.
import { FOODS } from './foods.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2026-10-21';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (most accurate)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (faster, cheaper)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (fastest, cheapest)' },
];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['meal_name', 'items', 'confidence', 'notes'],
  properties: {
    meal_name: { type: 'string' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    notes: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'portion', 'grams', 'kcal', 'protein_g', 'carbs_g', 'fat_g'],
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          grams: { type: 'number' },
          kcal: { type: 'number' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
        },
      },
    },
  },
};

function systemPrompt() {
  const names = FOODS.filter((f) => f.cat === 'nepali').map((f) => f.name).join('; ');
  return [
    'You are a careful nutrition estimator for a calorie-tracking app.',
    'The user is a 28-year-old Nepali man living in the U.S. who eats home-cooked Nepali food, U.S. grocery food and restaurant or fast food, often mixed on one plate.',
    'Identify every visible food and drink item separately (for example rice, dal, tarkari, achar, chicken, salad, tea).',
    'Estimate each portion from visual cues such as plate size (a dinner plate is about 26 cm), bowl and cup size, utensils and hands.',
    'Account for hidden cooking fat: Nepali curries, tarkari and dal usually contain oil or ghee; restaurant food usually contains more fat than home food.',
    'Use the user note when given (for example "used 1 tsp ghee", "extra chicken", "Chipotle bowl") and let it override what you see.',
    'Known Nepali dishes include: ' + names + '.',
    'Give calories in kcal and macros in grams for the whole portion of each item. Make kcal roughly consistent with 4*protein + 4*carbs + 9*fat.',
    'If something is unclear, make your best typical estimate and say so in notes. Keep notes under 200 characters.',
    'Reply with JSON only, matching this shape: {"meal_name": string, "confidence": "low"|"medium"|"high", "notes": string, "items": [{"name": string, "portion": string, "grams": number, "kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number}]}',
  ].join('\n');
}

function extractJSON(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('The AI reply had no JSON in it.');
  return JSON.parse(text.slice(start, end + 1));
}

function toItems(result) {
  return (result.items || []).map((it) => ({
    name: it.name,
    qty: 1,
    unit: it.portion || (it.grams ? `${Math.round(it.grams)} g` : 'portion'),
    grams: it.grams || null,
    per: {
      kcal: Math.max(0, Number(it.kcal) || 0),
      p: Math.max(0, Number(it.protein_g) || 0),
      c: Math.max(0, Number(it.carbs_g) || 0),
      f: Math.max(0, Number(it.fat_g) || 0),
    },
    source: 'ai',
  }));
}

/**
 * Estimate a meal. imageDataUrl is an optional JPEG data URL; note is optional text.
 * Returns { name, items, confidence, notes }.
 */
export async function estimateMeal({ imageDataUrl, note, settings }) {
  const ai = settings.ai;
  if (ai.provider === 'off') throw new Error('AI estimation is turned off in Settings.');
  if (ai.provider === 'anthropic' && !ai.apiKey) throw new Error('Add your Anthropic API key in Settings first.');
  if (ai.provider === 'proxy' && !ai.proxyUrl) throw new Error('Add your proxy URL in Settings first.');

  const content = [];
  if (imageDataUrl) {
    const [meta, data] = imageDataUrl.split(',');
    const mediaType = (meta.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } });
  }
  const text = imageDataUrl
    ? `Estimate the calories and macros of this meal.${note ? ` User note: ${note}` : ''}`
    : `Estimate the calories and macros of this meal from the description: ${note}`;
  content.push({ type: 'text', text });

  const body = {
    model: ai.model || 'claude-opus-5-5',
    max_tokens: 4000,
    system: systemPrompt(),
    messages: [{ role: 'user', content }],
    output_config: { effort: ai.effort || 'low', format: { type: 'json_schema', schema: SCHEMA } },
  };

  const send = async (b) => {
    const url = ai.provider === 'proxy' ? ai.proxyUrl : API_URL;
    const headers = { 'content-type': 'application/json' };
    if (ai.provider === 'anthropic') {
      headers['x-api-key'] = ai.apiKey;
      headers['anthropic-version'] = API_VERSION;
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(b) });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  };

  let { res, json } = await send(body);
  // If the chosen model does not accept structured output settings, retry with JSON-by-prompt only.
  if (res.status === 400 && /output_config|format|effort/i.test(JSON.stringify(json))) {
    const fallback = { ...body };
    delete fallback.output_config;
    ({ res, json } = await send(fallback));
  }
  if (!res.ok) {
    const msg = (json && json.error && json.error.message) || `Request failed (${res.status})`;
    if (res.status === 401) throw new Error('The API key was rejected (401). Check it in Settings.');
    if (res.status === 429) throw new Error('Rate limited (429). Wait a minute and try again.');
    throw new Error(msg);
  }
  if (json.stop_reason === 'refusal') throw new Error('The AI declined this request. Log the meal manually instead.');
  const textOut = (json.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  const result = extractJSON(textOut);
  return {
    name: result.meal_name || 'Meal',
    items: toItems(result),
    confidence: result.confidence || 'medium',
    notes: result.notes || '',
  };
}

// ---------- image helpers ----------

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read that image.'));
    img.src = src;
  });
}

/** Resize an image File/Blob to a JPEG. Returns { blob, dataUrl, width, height }. */
export async function compressImage(file, maxSide = 1024, quality = 0.8) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
    return { blob, dataUrl, width: w, height: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}
