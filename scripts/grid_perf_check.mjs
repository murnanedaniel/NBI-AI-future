// Verify the 70k-cell grid renders without dropping frames.
// Usage: node scripts/grid_perf_check.mjs  (requires npm run dev)

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

// Advance to step 5 (grid): 6 Space presses (title→step0, ×5 more to step5)
for (let i = 0; i < 6; i++) {
  await page.keyboard.press("Space");
  await page.waitForTimeout(i === 0 ? 2500 : 600);
}

// Now on grid — wait for fill to complete
await page.waitForTimeout(2500);
await page.screenshot({ path: "/tmp/grid_70k_full.png" });

// Measure RAF rate over 1 second while grid is churning
const frameStats = await page.evaluate(() => {
  return new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames++;
      if (performance.now() - start < 1000) requestAnimationFrame(tick);
      else resolve({ frames, ms: performance.now() - start });
    };
    requestAnimationFrame(tick);
  });
});
console.log(`RAF: ${frameStats.frames} frames in ${frameStats.ms.toFixed(0)} ms = ${(frameStats.frames / frameStats.ms * 1000).toFixed(1)} fps`);

// Second screenshot 200 ms later — should show different firing pattern
await page.waitForTimeout(200);
await page.screenshot({ path: "/tmp/grid_70k_frame2.png" });

if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log("  " + e));
  process.exitCode = 1;
} else {
  console.log("no errors");
}
await browser.close();
