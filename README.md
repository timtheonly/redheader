# RedHeader

A Manifest V3 Chrome extension for adding, setting, or removing outgoing
HTTP request headers, written in TypeScript and bundled with esbuild.

## Features

- **Header rules** — set/add or remove a request header on URLs matching a
  filter (`*` for all URLs, or a wildcard pattern like `*://api.example.com/*`).
  Rules take effect immediately via `declarativeNetRequest`.
- **Edit, toggle, delete** — change an existing rule, switch it on/off, or
  remove it.
- **Pause all rules** — turn off every enabled rule in one click, then resume
  exactly the rules that were paused. Pause state is saved, so it survives
  closing the popup.
- **Toolbar badge** — shows how many enabled rules match the current tab's
  URL.
- **Pagination** — the popup shows 5 rules per page.
- **All rules page** — "View all rules" in the popup opens a full-tab page
  with the same add/edit/toggle/delete controls, 25 rules per page. It stays
  in sync with the popup.

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later (includes npm)
- Google Chrome (or another Chromium-based browser with MV3 support)

## Project layout

```
src/
  manifest.json       Extension manifest (MV3)
  types.ts            HeaderRule type
  service_worker.ts   Syncs declarativeNetRequest rules from storage; updates the toolbar badge
  shared.ts           Storage helpers plus the rule form, rule list, and pagination used by both pages
  popup.ts            Popup: pause/resume all, "View all rules", 5 rules per page
  popup.html          Popup markup
  popup.css           Styling shared by the popup and the options page
  options.ts          All rules page: 25 rules per page
  options.html        All rules page markup
  options.css         All rules page overrides (full-width layout)
icons/                Toolbar icons
build.js              esbuild bundler script -> outputs to dist/
package.js            Zips dist/ into redheader.zip
tsconfig.json         TypeScript compiler config
```

`popup.html` and `options.html` must use the same element IDs for the rule
form, rule list, and pagination controls, since `shared.ts` looks them up by
ID on both pages.

## Installing dependencies

```bash
npm install
```

This installs four dev dependencies:

| Package         | Purpose                                            |
|-----------------|----------------------------------------------------|
| `typescript`    | Type-checks `src/*.ts`                             |
| `esbuild`       | Bundles the TS into self-contained JS in `dist/`   |
| `@types/chrome` | Type definitions for the `chrome.*` extension APIs |
| `archiver`      | Creates the zip in `npm run package`               |

## Building

```bash
npm run build
```

This runs `tsc --noEmit` first to type-check (fails fast on type errors),
then bundles `service_worker.ts`, `popup.ts`, and `options.ts` into
self-contained JS files and copies `manifest.json`, the HTML/CSS files, and
`icons/` into `dist/`. The **`dist/` folder is the loadable extension** —
point Chrome at it directly.

Other scripts:

| Command                 | What it does                                  |
|-------------------------|-----------------------------------------------|
| `npm run watch`         | Build, then rebuild `dist/` on every change to `src/` or `icons/` (no type-check) |
| `npm run typecheck`     | Type-check only, no build                     |
| `npm run package`       | Zip an existing `dist/` into `redheader.zip`  |
| `npm run build_package` | Build, then package                           |

## Load into Chrome

1. `npm install && npm run build`
2. Go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**, select the `dist/` folder
5. After any code change, re-run `npm run build` and click the refresh
   icon on the extension card in `chrome://extensions`

## Permissions

| Permission              | Why                                                        |
|-------------------------|------------------------------------------------------------|
| `declarativeNetRequest` | Applies the header rules                                   |
| `storage`               | Saves rules and pause state                                |
| `tabs`                  | Reads the active tab's URL to count matching rules for the badge |
| `<all_urls>` (host)     | Lets rules apply to any site                               |
