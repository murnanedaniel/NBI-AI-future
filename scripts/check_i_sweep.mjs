import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/roll-demo", { waitUntil: "networkidle" });
await page.waitForSelector('[data-roll-demo-ready="true"]', { timeout: 10000 });
await page.click('[data-variant-select="I"]');
await page.waitForTimeout(200);
for (const p of [0.3, 0.5, 0.65, 0.8, 0.9, 0.95, 0.98]) {
  await page.$eval("#roll-progress", (el, v) => {
    el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true }));
  }, p);
  await page.waitForTimeout(100);
  await page.screenshot({ path: `/tmp/demo_I_${p.toFixed(2)}.png` });
}
await browser.close();
console.log("OK");
