# Optional AI proxy (Cloudflare Worker)

Use this if you do not want your Anthropic API key stored in the browser on your phone.
The Worker holds the key as a secret and forwards the app's requests to Anthropic.

1. Sign in at dash.cloudflare.com (free plan is fine).
2. **Workers & Pages → Create → Create Worker.** Name it, for example `khana-ai`. Deploy.
3. **Edit code**, replace everything with `worker.js` from this folder, and **Deploy**.
4. **Settings → Variables and Secrets:**
   - Add a **Secret** `ANTHROPIC_API_KEY` = your key from console.anthropic.com.
   - Add a **Text** variable `ALLOWED_ORIGIN` = the address where the app runs, with no trailing slash,
     for example `https://yourname.github.io`.
5. Copy the Worker URL (like `https://khana-ai.yourname.workers.dev`).
6. In the app: **Settings → AI photo analysis → Provider: My own proxy URL**, paste the URL, then **Test connection**.

Only requests from `ALLOWED_ORIGIN` are accepted, and only the three Claude models the app offers.
Anyone who can open your app's page can still use the proxy, so keep the app's address to yourself
or add Cloudflare Access in front of it if you share the link.
