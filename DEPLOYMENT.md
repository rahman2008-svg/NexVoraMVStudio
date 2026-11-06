# Deploying NexVora MV Studio to Vercel via GitHub

No API keys, databases or paid services are required.

## 1. Push to GitHub
```bash
cd NexVoraMVStudio
git init && git add . && git commit -m "NexVora MV Studio 1.0.0"
git branch -M main
git remote add origin https://github.com/<you>/nexvora-mv-studio.git
git push -u origin main
```
Keep the repository **public** (or otherwise offer the source to your users): the app is AGPL-3.0-only and the About window links to the build's own source archive at `/source/verse-studio-source.zip`.

## 2. Import in Vercel
1. Vercel Dashboard → **Add New → Project** → import the GitHub repository.
2. Framework preset: **Vite** (also set by `vercel.json`). Install: `npm ci`. Build: `npm run build`. Output: `dist`.
3. Leave environment variables empty. Click **Deploy**.

## 3. Check after deploy
- `/` shows the landing page; **Open Studio** goes to `/#studio`.
- `/timestamp.html`, `/privacy.html`, `/licenses.html` open.
- `/source/verse-studio-source.zip` and `/legal/LICENSE.txt` download.
- Import a song, play, export a short range as MP4 and WebM.

## Notes
- Use `npm ci` (not `npm install`) so the lockfile versions match the published dependency notices.
- Do not rewrite all routes to `index.html`: the build has several HTML entry points.
- Rebuild after any source change; the build fails if the source archive would not match the deployed code.
- Local checks: `npm ci && npm test && npm run build && npm run preview`.
- Video export needs a browser with WebCodecs (recent Chrome/Edge on Android or desktop). Long 4K exports are heavy on low-RAM phones; use 720p/1080p there.
