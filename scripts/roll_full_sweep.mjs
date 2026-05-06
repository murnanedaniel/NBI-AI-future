import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/sweep_000_title.png" });

const t0 = Date.now();
await page.keyboard.press("Space");

for (const [targetMs, label] of [
  [150, "roll_150"],
  [300, "roll_300"],
  [500, "roll_500"],
  [700, "roll_700"],
  [900, "roll_900"],
  [1100, "roll_1100"],
  [1300, "roll_1300"],
  [1500, "handoff_1500"],
  [2000, "ratreamp_2000"],
  [3000, "protons_3000"],
]) {
  const delta = targetMs - (Date.now() - t0);
  if (delta > 0) await page.waitForTimeout(delta);
  await page.screenshot({ path: `/tmp/sweep_${String(targetMs).padStart(4, "0")}_${label}.png` });
}

await browser.close();
console.log("done");
