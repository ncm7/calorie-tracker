# Khana Calorie Tracker

A calorie and macro tracker built for everyday Nepali and U.S. food. Take a photo of your plate, and an AI vision model lists each item with its portion, calories, protein, carbs and fat. Fix anything, add a note like "used 1 tsp ghee", and save.

It is a Progressive Web App (PWA): one set of static files that installs on an iPhone or Android home screen and as a desktop app in Chrome or Edge. It has no server and no build step. Your meals and photos stay on your device.

## What it does

- **Photo logging:** take or upload a photo; the AI breaks it into items with portions and macros. Edit portions, numbers, names, or add a note and re-analyze.
- **Other ways to log:** describe the meal in words (AI or offline matching), search 100+ foods, or one-tap quick adds.
- **Food list:** Nepali staples (dal bhat tarkari, chiura, momo, chowmein, sukuti, sel roti, gundruk, kwati, alu tama, chatamari, masala chiya and more), U.S. everyday foods (chicken breast and thighs, rice, quinoa, Greek yogurt, protein shakes, eggs, avocado toast, oats, burrito bowls, burgers, sandwiches, coffee with milk or creamer, takeout) and mixed plates (dal bhat with rotisserie chicken, momo with salad or a shake, U.S. breakfast with chiya).
- **Targets:** calculated from age, sex, height, weight, activity and goal (Mifflin-St Jeor), or set by hand. Defaults fit a 28-year-old man.
- **Activity:** steps and workouts with estimated calories; optionally add them back to your daily budget.
- **Dashboard:** calories left, macro bars, meals by time of day with photo thumbnails, 7- and 30-day charts, weight log.
- **Your data:** stored in the browser (IndexedDB). Export a full JSON backup (with or without photos), import it on another device, or export CSV for a spreadsheet.
- Works offline for everything except the AI estimate.

## Files

```
calorie-tracker/
├── index.html          App page
├── styles.css          Styles (light and dark)
├── manifest.json       PWA manifest (name, icons, colors)
├── sw.js               Service worker (offline cache)
├── .nojekyll           Tells GitHub Pages to serve files as-is
├── icons/              App icons: 192, 512, maskable, Apple touch, favicon, SVG
├── js/
│   ├── app.js          Screens and logic
│   ├── foods.js        Food list, quick adds, search, text parser
│   ├── ai.js           Photo/description estimate via the Anthropic API
│   ├── calc.js         BMR/targets, exercise, dates
│   ├── db.js           IndexedDB storage
│   └── settings.js     Settings in localStorage
└── proxy/
    ├── worker.js       Optional Cloudflare Worker that holds your API key
    └── README.md
```

## Run it on your computer

A PWA must be served over http(s), not opened as a file.

```
cd calorie-tracker
python3 -m http.server 8080
```

Open http://localhost:8080. The service worker and install button work on `localhost`.

## Put it online (needed to install on your phone)

Phones only install PWAs from an `https://` address. Any static host works. Three free options:

### Option A: GitHub Pages

1. Push these files to a GitHub repository (the files at the top level, not inside a subfolder).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick `main` and `/ (root)`, **Save**.
3. Wait a minute. The address is `https://YOUR-USERNAME.github.io/REPO-NAME/`.

On a free GitHub account, Pages needs the repository to be **public**. The code becomes public; your meals and API key do not, because they live only in your browser. GitHub Pro allows Pages on private repositories.

### Option B: Netlify (repo can stay private)

1. Go to app.netlify.com → **Add new site → Deploy manually**.
2. Drag the `calorie-tracker` folder onto the page. You get an `https://….netlify.app` address.
   Or connect the GitHub repo so every push redeploys.

### Option C: Vercel

1. vercel.com → **Add New → Project → Import** your GitHub repo (private is fine).
2. Framework preset: **Other**. No build command. Output directory: `./`. Deploy.

## Install it

### iPhone (Safari)

1. Open the app's `https://` address in **Safari** (not Chrome; iOS only installs from Safari).
2. Tap the **Share** button (square with an arrow).
3. Scroll and tap **Add to Home Screen**, then **Add**.
4. Open Khana from the home screen. The first time you log a photo, allow camera access.

### Android (Chrome)

1. Open the address in **Chrome**.
2. Tap **Install** in the banner, or the **⋮ menu → Install app** (or **Add to Home screen**).

### Desktop (Chrome or Edge, Windows/Mac/Linux)

1. Open the address.
2. Click the **install icon** at the right end of the address bar, or **⋮ menu → Cast, save and share → Install page as app** (Chrome) / **Apps → Install this site as an app** (Edge).
3. It opens in its own window and appears in your Start menu, Dock or app launcher.

Safari on Mac: **File → Add to Dock**.

## Connect the AI (for photo analysis)

The app uses Claude's vision models from Anthropic. You pay Anthropic per use; one meal photo usually costs a few cents or less, and less on Haiku.

1. Go to **console.anthropic.com**, sign in, add a payment method under **Billing**, then **API keys → Create key**. Copy it (it starts with `sk-ant-`).
2. In the app: **Settings → AI photo analysis**.
3. Provider: **Anthropic API key (on this device)**. Paste the key.
4. Pick a model: **Opus 5.5** (most accurate), **Sonnet 5.5** (faster, cheaper) or **Haiku 5.5** (fastest, cheapest).
5. Tap **Test connection**. It estimates a cup of masala chiya.

The key is saved only in this browser's local storage. It is never included in exports or backups. Repeat step 3 on each device.

Set a monthly spend limit in the Anthropic console under **Billing → Limits** so a mistake cannot run up a bill.

**Prefer not to keep the key on your phone?** Use the Cloudflare Worker in `proxy/` (free). It stores the key on the server; the app only knows the Worker's URL. See `proxy/README.md`.

Without a key, everything still works except the AI estimate: log by search, quick add, or "Match from food list".

## Tips for good photo estimates

- Shoot from above with the whole plate in frame; a fork or hand in the shot helps with scale.
- Add a note for what the camera can't see: "cooked in 2 tbsp oil", "extra chicken", "Chipotle bowl with white rice, no sour cream".
- Check the portion and numbers before saving. Photo estimates are approximate, often off by 15 to 25 percent, mostly on oil and rice.
- Save meals you eat often with **Save as one of my quick-add meals**, or save single items with **Save food**.

## Updating the app

After changing any file, bump `VERSION` in `sw.js` (for example `khana-v1.0.1`) and redeploy. Open the app; it shows "A new version is ready", tap **Reload**.

## Backups and moving devices

**Settings → Your data → Export backup (JSON)** saves everything except the API key. On the new device, open the app and use **Import backup**, then choose **Merge** or **Replace**. **Export meals (CSV)** gives one row per food item for Excel or Google Sheets.

Browsers can clear site data when storage runs low, and iOS can clear it for sites not added to the home screen. Install the app and export a backup now and then.

## Privacy

There are no accounts, analytics or trackers. Meal data and photos stay in your browser. When you use the AI, the photo and note go to Anthropic (or your proxy) for that one estimate.

## Notes

Calorie numbers are estimates for everyday tracking, not medical advice. Food values in `js/foods.js` are typical home-style or restaurant portions from standard nutrition references; edit them to match how you cook.
