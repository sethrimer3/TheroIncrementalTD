# Steam Production Checklist — Thero Idle TD

Status of the project today: a **browser-first static HTML/JS/TS game** (`index.html`
+ `assets/` + `scripts/`, built to `dist/` via `npm run build`) with an existing
Electron wrapper at `electron/main.cjs`, currently used only for local desktop
testing (`npm run desktop`). Electron is the right shipping vehicle for Steam —
but the current setup is a dev runner, not a distributable. Everything below is
what has to change.

---

## 1. Turn the Electron runner into a real distributable

Right now there is no packaging step: `npm run electron` launches the dev
`electron` binary against the repo. To ship you need a packaged, signed app.

- Add **electron-builder** (or Electron Forge) and a `build` config in
  `package.json` / `electron-builder.yml`.
- Targets: Windows `nsis` **and** a portable/`dir` output (Steam prefers to
  distribute an unpacked folder it manages itself — no installer needed; Steam's
  depot *is* the installer). macOS `zip`/`dir` and Linux `dir` if you ship those.
- Ensure only `dist/`, `electron/`, and required `node_modules` are packed —
  exclude `docs/`, test HTML files at repo root (`test-*.html`, `shin-tree-test.html`),
  `build/ts-out/`, and `eslint_output_full.txt`.
- Set `asar: true` for a cleaner install and slightly faster startup.
- Pin the Electron version and keep it current — Steam users run for hours, and
  Chromium security fixes matter less here than stability, but stale Electron
  means stale V8 perf.

Package metadata to fill in (`package.json` is currently mostly empty):
`description`, `author`, `license`, and a real `productName`.

---

## 2. Make the desktop build self-contained

`index.html` loads two dependencies from the public internet:

- `index.html:10` — Google Fonts CSS
- `index.html:33` — MathJax 3 from `cdn.jsdelivr.net`

A Steam game must run fully offline. Vendor both locally:

- Download the WOFF2 fonts into `assets/fonts/` and replace the Google Fonts
  `<link>` with local `@font-face`. (All three families are SIL OFL — ship the
  license text.)
- Vendor MathJax's `tex-mml-chtml.js` plus its `output/chtml/fonts/` into
  `assets/vendor/mathjax/`. (Apache-2.0 — ship the notice.)
- Then tighten the CSP in `electron/main.cjs`: remove `https://cdn.jsdelivr.net`,
  `https://fonts.googleapis.com`, and `https://fonts.gstatic.com` from
  `buildContentSecurityPolicy`, leaving `'self' file:`.

Also fix `electron/main.cjs:8` — it points at `assets/icon/Thero_icon.ico`, but the
file on disk is `assets/icon/TheroMathTD_Icon.ico`, so the window icon silently
falls back to the Electron default.

---

## 3. Desktop UX expectations

The game is mobile-first per `docs/PLATFORM_SUPPORT.md`. Steam players will judge
it as a PC game:

- **Windowing**: remember window size/position between launches; support
  resize, maximize, and real fullscreen (F11 / Alt+Enter).
- **Resolution**: verify the layout at 1280×720 through 3840×2160 and on
  ultrawide (21:9). Check DPI scaling at 125%/150%/200%.
- **Keyboard/mouse**: add keyboard shortcuts (pause, speed toggle, Esc to close
  overlays, hotkeys for tower selection). Hover tooltips should work with a mouse.
- **Gamepad** (optional but a differentiator): needed if you ever want Steam Deck
  "Verified" rather than "Playable".
- **No browser chrome**: disable the default Electron menu bar, right-click
  context menu, and devtools in production builds.
- **Alt-Tab / minimize**: idle progression must be correct while unfocused; check
  that `requestAnimationFrame` throttling in a background window doesn't stall or
  double-count offline gains.
- **Exit**: confirm the game force-saves on window close and on OS shutdown.

---

## 4. Save data

Saves currently live in `localStorage` (see `assets/autoSave.js`), which in
Electron lands in the app's user-data folder.

- Move (or mirror) saves to a file under `app.getPath('userData')` so they're
  inspectable, backup-able, and eligible for Steam Cloud.
- Configure **Steam Cloud** (Auto-Cloud is simplest: declare the save folder and
  file patterns in the Steamworks app config).
- Add manual save export/import.
- Provide a migration path so anyone with browser or GitHub Pages saves can
  carry progress over.

---

## 5. Steamworks account and app setup

- **Steamworks Partner account**: complete company/individual registration, tax
  interview (W-9/W-8BEN), and banking details. Tax paperwork can take days.
- **Steam Direct fee**: $100 USD per app, recoupable after $1,000 in adjusted
  gross revenue.
- **30-day rule**: a store page must be public for **at least 30 days** before the
  game can release. Plan the store page launch a month ahead of your target date.
- Create the app in Steamworks; note the AppID.
- Configure **depots** (one per platform you ship) and **build/launch options**
  (executable path, arguments, per-OS launch entries).
- Install SteamPipe / `steamcmd` and script uploads (`app_build.vdf` + depot
  scripts). Wire it into a release npm script or GitHub Action.

---

## 6. Store page assets

Steam's required capsule set is specific and easy to underestimate:

- **Header capsule** 460×215, **small capsule** 231×87, **main capsule** 616×353,
  **vertical capsule** 374×448, **page background** 1438×810.
- **Library assets**: library capsule 600×900, library header 920×430, library
  hero 3840×1240, library logo (transparent PNG).
- **Screenshots**: at least 5 at 1920×1080 (Steam requires a minimum; more is better).
- **Trailer**: strongly recommended — Steam weights video heavily in discovery.
- Short description (≤300 chars), full description, "About This Game" with at
  least one image, system requirements (min + recommended), genres/tags, and
  supported languages.
- Legal: EULA (Steam's default Subscriber Agreement is fine unless you have a
  custom one), and a privacy policy if you collect anything.

---

## 7. Steamworks integration (optional, but expected)

Pure-web games can ship without the Steam SDK, but Steam players expect at least
achievements and cloud saves.

- **Steamworks SDK bridge**: use `steamworks.js` (modern, N-API) rather than the
  unmaintained `greenworks`. Load it in the Electron **main** process and expose a
  narrow, typed IPC surface to the renderer via a preload script — do **not**
  enable `nodeIntegration` in the renderer.
- **Achievements**: the game already has an achievements system
  (`assets/achievementsTab.js`). Map those to Steam achievements — define them in
  Steamworks (each needs a name, description, and 64×64 icon in locked/unlocked states)
  and call `SetAchievement`/`StoreStats`.
- **Steam Cloud**: Auto-Cloud (no code) or the Cloud API.
- **Rich presence / stats / leaderboards**: optional.
- **Steam Overlay**: does **not** work reliably with Electron. Decide whether to
  accept that (most Electron Steam games do) and note it — it affects Shift+Tab,
  screenshots, and in-game purchases.

---

## 8. Code signing

- **Windows**: an unsigned `.exe` triggers SmartScreen warnings. An OV/EV code
  signing certificate costs roughly $200–500/yr and, since June 2023, requires
  hardware token or cloud HSM key storage. Steam's own launcher mitigates this
  somewhat, but signing is still recommended.
- **macOS**: if you ship a Mac build, an **Apple Developer account ($99/yr) is
  mandatory** — the app must be signed with a Developer ID and **notarized**, or
  Gatekeeper blocks it. Also requires an entitlements plist and hardened runtime.
  If that cost isn't worth it, ship Windows-only at launch.
- Keep certificates and passwords out of the repo.

---

## 9. Steam Deck (recommended)

The Deck is a meaningful share of Steam sales for indie titles.

- Electron runs on Deck via Proton, but test it — WebView/GPU flags sometimes need
  tweaking (`--disable-gpu-sandbox`, `--no-sandbox` are common Electron/Proton fixes).
- For **Playable**: game must launch and be usable; a launch-time controller/keyboard
  prompt is acceptable.
- For **Verified**: full controller support, legible text at 1280×800, default
  graphics settings that work, and no external launcher prompts. Text legibility
  is the usual failure for math-heavy UI — check equation rendering at Deck resolution.
- Submit for Deck Compatibility review from Steamworks (free, takes a few weeks).

---

## 10. Pre-launch quality gates

- Existing checks green: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:unit`.
- Extend `docs/SMOKE_TEST.md` with a packaged-build pass: install from a Steam
  playtest/beta branch, play a full campaign wave, alt-tab, fullscreen toggle,
  quit and relaunch, confirm save + achievements persisted.
- Test on a clean machine with no Node/dev tooling installed.
- Add crash reporting (Sentry or Electron's `crashReporter`) — you can't attach a
  debugger to a player's machine.
- Use a **Steam beta branch** with a password for private testing, and optionally
  **Steam Playtest** for a wider closed test.
- Steam's build review (a quick functional check by Valve, distinct from the store
  page review) happens before you can hit release — allow several business days.

---

## 11. Suggested order of work

1. Vendor fonts + MathJax locally; tighten the Electron CSP; fix the icon path.
2. Add electron-builder and produce a real packaged Windows build.
3. Desktop UX pass: window state, fullscreen, resolutions, keyboard, menu removal.
4. Move saves to a file in userData; add export/import.
5. Register the Steamworks partner account and complete tax/banking (slow — start early).
6. Pay Steam Direct, create the AppID, configure depots and launch options.
7. Produce capsule art, screenshots, and a trailer; publish the store page
   (**starts the 30-day clock**).
8. Wire `steamworks.js` for achievements; configure Steam Cloud.
9. Sort code signing (Windows cert; Apple Developer + notarization if shipping macOS).
10. Upload builds via SteamPipe to a beta branch; run private testing.
11. Submit for Steam Deck compatibility review.
12. Pass Valve's build review, set the release date, ship.

---

## Cost summary

| Item | Cost |
| --- | --- |
| Steam Direct fee | $100 per app (recoupable) |
| Windows code signing cert | ~$200–500/yr (optional but recommended) |
| Apple Developer Program | $99/yr (**only if** shipping macOS) |
| Capsule art / trailer | Variable — the largest cost if outsourced |
