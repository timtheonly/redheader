# RedHeader 
 
A Manifest V3 Chrome extension for adding, setting, or removing outgoing
HTTP request headers, written in TypeScript and bundled with esbuild.
 
## Prerequisites
 
- [Node.js](https://nodejs.org) 18 or later (includes npm)
- Google Chrome (or another Chromium-based browser with MV3 support)
 
 ## Project layout
 
```
src/
  types.ts            Shared HeaderRule type used by both entry points
  service_worker.ts   Service worker: syncs declarativeNetRequest rules from storage
  shared.ts           Shared localsotrage helper funcs
  popup.ts            Popup UI logic: add/toggle/delete rules
  popup.html          Popup markup
  popup.css           Popup styling
manifest.json         Extension manifest (MV3)
icons/                Toolbar icons
build.js              esbuild bundler script -> outputs to dist/
tsconfig.json         TypeScript compiler config
```
 
## Installing dependencies
 
```bash
npm install
```
 
This installs three dev dependencies:
 
| Package         | Purpose                                              |
|-----------------|-------------------------------------------------------|
| `typescript`    | Type-checks `src/*.ts`                                |
| `esbuild`       | Bundles the TS into self-contained JS in `dist/`      |
| `@types/chrome` | Type definitions for the `chrome.*` extension APIs    |
 
## Building
 
```bash
npm run build
```
 
This runs `tsc --noEmit` first to type-check (fails fast on type errors),
then bundles `background.ts` and `popup.ts` into self-contained JS files
and copies `manifest.json`, `popup.html`, `popup.css`, and `icons/` into
`dist/`. The **`dist/` folder is the loadable extension** — point Chrome
at it directly.

 ## Load into Chrome
 
1. `npm install && npm run build`
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**, select the `dist/` folder
5. After any code change, re-run `npm run build` and click the refresh
   icon on the extension card in `chrome://extensions`
