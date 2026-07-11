// build.js
// Bundles src/background.ts and src/popup.ts into dist/*.js,
// then copies manifest, html, css, and icons into dist/ so the
// dist folder is a fully loadable, unpacked extension.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const outdir = path.join(__dirname, "dist");
const srcdir = path.join(__dirname, "src");
const staticSrcFiles = ["manifest.json", "popup.html", "popup.css"]

async function build() {
  fs.rmSync(outdir, { recursive: true, force: true });
  fs.mkdirSync(outdir, { recursive: true });

  await esbuild.build({
    entryPoints: {
      service_worker: "src/service_worker.ts",
      popup: "src/popup.ts",
    },
    bundle: true,
    outdir,
    target: "chrome110",
    format: "iife", // self-contained scripts; no "type": "module" needed in manifest
    sourcemap: true,
    logLevel: "info",
  });

  // Copy static assets alongside the compiled JS
  for (const fileName of staticSrcFiles) {
      fs.copyFileSync(path.join(srcdir, fileName), path.join(outdir, fileName));
  }

  fs.mkdirSync(path.join(outdir, "icons"), { recursive: true });
  for (const file of fs.readdirSync("icons")) {
    fs.copyFileSync(path.join("icons", file), path.join(outdir, "icons", file));
  }

  console.log(
    "Build complete: dist/ is ready to load as an unpacked extension.",
  );
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
