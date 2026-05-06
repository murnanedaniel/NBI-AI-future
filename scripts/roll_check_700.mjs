import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

const T = Date.now();
await page.keyboard.press("Space");
await page.waitForTimeout(700);
await page.screenshot({ path: "/tmp/verify_700.png" });

// Also check DOM at this exact moment
const dom = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll("canvas"));
  const allDivs = Array.from(document.querySelectorAll("[class*='absolute inset-0']"));
  return {
    canvases: canvases.length,
    canvasInfo: canvases.map((c) => ({
      z: getComputedStyle(c.parentElement).zIndex,
      cls: c.parentElement.className,
    })),
    // Check if RateRamp text is in DOM
    hasActText: document.body.textContent.includes("ACT 1 · THE FIREHOSE"),
    hasEventsText: document.body.textContent.includes("events / second"),
    hasBeamsText: document.body.textContent.includes("the beams cross"),
  };
});
console.log("at t=700ms:", JSON.stringify(dom, null, 2));
await browser.close();
