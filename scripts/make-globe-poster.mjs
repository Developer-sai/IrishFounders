// Renders the live globe once, frozen, and saves it as the static poster (LCP / no-WebGL / reduced-motion fallback).
// Run against a local server with an EMPTY register so the poster has no pins: node scripts/make-globe-poster.mjs
import { chromium } from "@playwright/test";
const out = process.argv[2] ?? "poster.png";
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const c = await b.newContext({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 2 });
await c.addInitScript(() => { window.__globeFreeze = true; localStorage.setItem("theme", "dark"); });
const p = await c.newPage();
await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
const dataUrl = await p.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
const { writeFileSync } = await import("node:fs");
writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
await b.close();
console.log("saved", out);
