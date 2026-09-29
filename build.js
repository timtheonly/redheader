// build.js
// Bundles the TypeScript entry points into dist/*.js, then copies manifest,
// html, css, and icons into dist/ so the dist folder is a fully loadable,
// unpacked extension. Pass --watch to rebuild on changes.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const watch = process.argv.includes("--watch");
const outdir = path.join(__dirname, "dist");
const srcdir = path.join(__dirname, "src");
const iconsdir = path.join(__dirname, "icons");
const staticSrcFiles = [
  "manifest.json",
  "popup.html",
  "popup.css",
  "options.html",
  "options.css",
];

const buildOptions = {
  entryPoints: {
    service_worker: "src/service_worker.ts",
    popup: "src/popup.ts",
    options: "src/options.ts",
  },
  bundle: true,
  outdir,
  target: "chrome110",
  format: "iife", // self-contained scripts; no "type": "module" needed in manifest
  sourcemap: true,
  logLevel: "info",
};

function copyStaticFiles() {
  for (const fileName of staticSrcFiles) {
    fs.copyFileSync(path.join(srcdir, fileName), path.join(outdir, fileName));
  }
  fs.mkdirSync(path.join(outdir, "icons"), { recursive: true });
  for (const file of fs.readdirSync(iconsdir)) {
    fs.copyFileSync(path.join(iconsdir, file), path.join(outdir, "icons", file));
  }
}

async function build() {
  fs.rmSync(outdir, { recursive: true, force: true });
  fs.mkdirSync(outdir, { recursive: true });

  if (!watch) {
    await esbuild.build(buildOptions);
    copyStaticFiles();
    console.log(
      "Build complete: dist/ is ready to load as an unpacked extension.",
    );
    return;
  }

  // esbuild only watches files in the bundle graph, so static assets are
  // watched separately with fs.watch.
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  copyStaticFiles();

  let copyTimer;
  const onStaticChange = (dir) => (_event, fileName) => {
    const isStatic =
      dir === iconsdir || (fileName && staticSrcFiles.includes(fileName));
    if (!isStatic) return;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      try {
        copyStaticFiles();
        console.log(`Copied static files (${fileName} changed)`);
      } catch (err) {
        console.error("Failed to copy static files:", err.message);
      }
    }, 50);
  };
  fs.watch(srcdir, onStaticChange(srcdir));
  fs.watch(iconsdir, onStaticChange(iconsdir));

  console.log("Watching for changes... (Ctrl+C to stop)");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
