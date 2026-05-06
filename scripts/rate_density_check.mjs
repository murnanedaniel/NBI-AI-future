// Visually verify the 1 kHz step now reads as a true blur and the 40 MHz
// grid cells fire fresh patterns per frame.
// Usage: node scripts/rate_density_check.mjs  (requires npm run dev)

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE ERR: ${msg.text()}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Advance title → rate step 0, then wait past the roll-in
await page.keyboard.press("Space");
await page.waitForTimeout(2500); // roll finishes + protons arrive

// Advance to steps 1,2,3,4 — snap each
const labels = ["hz2", "hz5", "hz10", "hz1000"];
for (let i = 0; i < 4; i++) {
  await page.keyboard.press("Space");
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/rate_${labels[i]}.png` });
  console.log(`→ ${labels[i]}`);
}

// Advance to grid (step 5), capture at 3 distinct moments 200 ms apart
await page.keyboard.press("Space");
await page.waitForTimeout(1500); // allow fill to progress
for (let i = 0; i < 3; i++) {
  await page.screenshot({ path: `/tmp/rate_grid_${i}.png` });
  console.log(`→ grid frame ${i}`);
  await page.waitForTimeout(200);
}

if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log("  " + e));
  process.exitCode = 1;
} else {
  console.log("\nno errors");
}
await browser.close();
