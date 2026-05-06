// Verify the TitleSlide paper-roll → RateRamp beam handoff.
// Usage: node scripts/title_handoff_inspect.mjs  (requires npm run dev running)

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

console.log("→ load /");
await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/title_0000_arrived.png` });
console.log(`   ${OUT}/title_0000_arrived.png`);

// Fire advance
const t0 = Date.now();
await page.keyboard.press("Space");

const samples = [
  [200, "roll_early"],
  [500, "roll_mid"],
  [900, "roll_late"],
  [1300, "handoff_t=0.98"],   // exit finishes here
  [1500, "post_handoff"],
  [2200, "rateramp_protons"],
  [3500, "first_collision"],
];

for (const [targetMs, label] of samples) {
  const elapsed = Date.now() - t0;
  const delta = targetMs - elapsed;
  if (delta > 0) await page.waitForTimeout(delta);
  const file = `${OUT}/title_${String(targetMs).padStart(4, "0")}_${label}.png`;
  await page.screenshot({ path: file });
  console.log(`   ${file}`);
}

await browser.close();
if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log("  " + e));
  process.exitCode = 1;
} else {
  console.log("\nno errors");
}
