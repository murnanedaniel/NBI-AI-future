import { chromium } from "playwright";
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

page.on("console", (msg) => {
  const txt = msg.text();
  if (txt.includes("TitleSlide")) console.log(`[${Date.now()}] ${msg.type()}: ${txt}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

console.log(`--- PRESSING SPACE at ${Date.now()}`);
await page.keyboard.press("Space");
await page.waitForTimeout(3000);

await browser.close();
