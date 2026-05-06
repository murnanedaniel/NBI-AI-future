// Verify the persistent PaperRollOverlay across title → rateRamp steps → grid.
// Usage: node scripts/roll_overlay_inspect.mjs  (requires npm run dev)

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE ERR: ${msg.text()}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/overlay_00_title.png` });
console.log("→ title captured");

// Advance: title → rateRamp step 0 (triggers the roll-in)
await page.keyboard.press("Space");
for (const [ms, label] of [
  [500, "rolling_500"],
  [1000, "rolling_1000"],
  [1700, "rolling_1700"],
  [2200, "settled"],
]) {
  await page.waitForTimeout(ms === 500 ? 500 : (ms === 1000 ? 500 : (ms === 1700 ? 700 : 500)));
  await page.screenshot({ path: `${OUT}/overlay_${String(ms).padStart(4, "0")}_${label}.png` });
  console.log(`→ ${label}`);
}

// Now advance through steps 1..4 — tube should stay put
for (let i = 1; i <= 4; i++) {
  await page.keyboard.press("Space");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/overlay_step${i}_hz.png` });
  console.log(`→ step ${i}`);
}

// Step 5 = grid — tube should fade away
await page.keyboard.press("Space");
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/overlay_step5_fading.png` });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/overlay_step5_grid.png` });
console.log("→ step 5 grid");

if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log("  " + e));
  process.exitCode = 1;
} else {
  console.log("\nno errors");
}
await browser.close();
