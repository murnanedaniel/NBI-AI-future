import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();

let T = 0;
page.on("console", (msg) => {
  const txt = msg.text();
  if (txt.includes("TitleSlide")) console.log(`[log +${Date.now()-T}] ${msg.type()}: ${txt}`);
});

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

T = Date.now();
console.log(`[+0] press Space`);
await page.keyboard.press("Space");

for (const ms of [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1300, 1600, 2000]) {
  const delta = ms - (Date.now() - T);
  if (delta > 0) await page.waitForTimeout(delta);
  const state = await page.evaluate(() => {
    const canvases = document.querySelectorAll("canvas");
    return {
      count: canvases.length,
      canvases: Array.from(canvases).map((c) => ({
        w: c.width, h: c.height,
        parentZ: getComputedStyle(c.parentElement).zIndex,
        parentClass: c.parentElement.className,
      })),
    };
  });
  console.log(`[+${ms}] canvases=${state.count}: ${JSON.stringify(state.canvases)}`);
}
await browser.close();
