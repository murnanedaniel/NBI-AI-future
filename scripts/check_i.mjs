import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("ERR:", e.message));
await page.goto("http://localhost:3000/roll-demo", { waitUntil: "networkidle" });
await page.waitForSelector('[data-roll-demo-ready="true"]', { timeout: 10000 });
await page.click('[data-variant-select="I"]');
await page.waitForTimeout(200);
await page.$eval("#roll-progress", (el, v) => {
  el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true }));
}, 0.3);
await page.waitForTimeout(150);
await page.screenshot({ path: "/tmp/demo_I_at_0.30.png" });
await browser.close();
console.log("OK");
