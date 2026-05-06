// Paper-roll demo: sweep each variant at 5 progress values, take screenshots.
// Usage: node scripts/roll_inspect.mjs   (requires `npm run dev` in another terminal)

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp";

const VARIANTS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
const PROGRESSES = [0, 0.25, 0.5, 0.75, 1.0];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE ERR: ${msg.text()}`);
});

console.log(`→ loading ${BASE}/roll-demo`);
await page.goto(`${BASE}/roll-demo`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-roll-demo-ready="true"]', { timeout: 15_000 });
await page.waitForTimeout(300);

async function setProgress(p) {
  await page.$eval(
    "#roll-progress",
    (el, v) => {
      const input = /** @type {HTMLInputElement} */ (el);
      input.value = String(v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    p,
  );
  await page.waitForTimeout(80);
}

// Grid screenshot at progress = 0.5 (sanity check: all 6 variants visible)
console.log("→ grid snapshot at progress=0.5");
await page.click('[data-variant-select="grid"]');
await page.waitForSelector('[data-variant="A"] canvas', { state: "visible" });
await setProgress(0.5);
await page.screenshot({ path: `${OUT}/roll_grid_0.50.png`, fullPage: true });

// Per-variant sweep
for (const id of VARIANTS) {
  console.log(`→ variant ${id}`);
  await page.click(`[data-variant-select="${id}"]`);
  await page.waitForSelector(`[data-variant="${id}"] canvas`, { state: "visible" });
  await page.waitForTimeout(150); // let the new scene build

  for (const p of PROGRESSES) {
    await setProgress(p);
    const canvas = await page.$(`[data-variant="${id}"] canvas`);
    if (!canvas) {
      errors.push(`MISSING canvas for variant ${id}`);
      continue;
    }
    const box = await canvas.boundingBox();
    if (!box) {
      errors.push(`MISSING bbox for variant ${id}`);
      continue;
    }
    const file = `${OUT}/roll_${id}_${p.toFixed(2)}.png`;
    await page.screenshot({
      path: file,
      clip: {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      },
    });
    console.log(`   ${file}`);
  }
}

if (errors.length) {
  console.log("\nERRORS:");
  for (const e of errors) console.log("  " + e);
  process.exitCode = 1;
} else {
  console.log("\nno errors");
}

await browser.close();
